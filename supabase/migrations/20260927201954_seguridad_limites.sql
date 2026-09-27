-- Endurecimiento de seguridad:
-- 1. Límites de frecuencia en la base de datos (sirven entre todas las instancias del servidor).
-- 2. Nadie puede calificar con un celular ajeno sin conocer el nombre con que se registró.
-- 3. La función rls_auto_enable de la plataforma deja de ser invocable por la Data API.

-- ---------------------------------------------------------------------------
-- 1. Límites de frecuencia (ventana fija)
-- ---------------------------------------------------------------------------

create table public.rate_limits (
  bucket text not null check (char_length(bucket) <= 200),
  window_start timestamptz not null,
  hits integer not null default 1,
  primary key (bucket, window_start)
);

comment on table public.rate_limits is 'Contadores de intentos por ventana de tiempo (IP, dispositivo, celular, login).';

alter table public.rate_limits enable row level security;
revoke all on table public.rate_limits from anon, authenticated;

-- Suma un intento al bucket y devuelve si sigue dentro del límite.
create function public.hit_rate_limit(p_bucket text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_window timestamptz;
  v_hits integer;
begin
  v_window := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  insert into public.rate_limits as rl (bucket, window_start, hits)
  values (p_bucket, v_window, 1)
  on conflict (bucket, window_start) do update set hits = rl.hits + 1
  returning rl.hits into v_hits;

  -- Limpieza ocasional de ventanas viejas.
  if random() < 0.02 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;

  return v_hits <= p_limit;
end;
$$;

revoke all on function public.hit_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, integer, integer) to service_role;

-- ---------------------------------------------------------------------------
-- 2. Nombre normalizado (sin tildes, minúsculas, espacios simples)
-- ---------------------------------------------------------------------------

create function public.normalize_name(p_name text)
returns text
language sql
immutable
set search_path = ''
as $$
  select regexp_replace(
    lower(translate(
      btrim(p_name),
      'áàäâãéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ',
      'aaaaaeeeeiiiiooooouuuuncaaaaaeeeeiiiiooooouuuunc'
    )),
    '\s+', ' ', 'g'
  );
$$;

revoke all on function public.normalize_name(text) from public, anon, authenticated;
grant execute on function public.normalize_name(text) to service_role;

-- ---------------------------------------------------------------------------
-- submit_rating: límites + verificación de nombre para celulares ya registrados
-- ---------------------------------------------------------------------------

create or replace function public.submit_rating(
  p_full_name text,
  p_phone_e164 text,
  p_dish_slug text,
  p_stars smallint,
  p_consent_version text,
  p_entry_restaurant_slug text default null,
  p_device_id uuid default null,
  p_ip_hash text default null,
  p_user_agent text default null
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_campaign public.campaign%rowtype;
  v_dish_id smallint;
  v_participant_id bigint;
  v_registered_name text;
  v_entry_restaurant_id smallint;
begin
  -- Límites por ventana de 10 minutos. El wifi de un restaurante puede compartir IP: su cupo es amplio.
  if p_ip_hash is not null then
    if not public.hit_rate_limit('rating:ip:' || p_ip_hash, 60, 600) then
      return 'rate_limited';
    end if;
  end if;
  if p_device_id is not null then
    if not public.hit_rate_limit('rating:device:' || p_device_id::text, 20, 600) then
      return 'rate_limited';
    end if;
  end if;
  if not public.hit_rate_limit('rating:phone:' || p_phone_e164, 12, 600) then
    return 'rate_limited';
  end if;

  select c.* into v_campaign from public.campaign c where c.id;

  if not found
     or not v_campaign.is_open
     or (v_campaign.starts_at is not null and now() < v_campaign.starts_at)
     or (v_campaign.ends_at is not null and now() >= v_campaign.ends_at) then
    return 'closed';
  end if;

  select d.id into v_dish_id
  from public.dishes d
  where d.slug = p_dish_slug and d.is_active;

  if v_dish_id is null then
    return 'invalid_dish';
  end if;

  select p.id, p.full_name into v_participant_id, v_registered_name
  from public.participants p
  where p.phone_e164 = p_phone_e164;

  if v_participant_id is null then
    insert into public.participants as p (full_name, phone_e164, consent_version)
    values (btrim(p_full_name), p_phone_e164, p_consent_version)
    on conflict (phone_e164) do nothing
    returning p.id into v_participant_id;

    -- Otra petición creó el mismo celular al mismo tiempo.
    if v_participant_id is null then
      select p.id, p.full_name into v_participant_id, v_registered_name
      from public.participants p
      where p.phone_e164 = p_phone_e164;
    end if;
  end if;

  -- Un celular ya registrado solo se usa con el mismo nombre: evita suplantar a otra persona
  -- y que alguien consulte las calificaciones de un número ajeno.
  if v_registered_name is not null
     and public.normalize_name(v_registered_name) <> public.normalize_name(p_full_name) then
    return 'name_mismatch';
  end if;

  if p_entry_restaurant_slug is not null then
    select r.id into v_entry_restaurant_id
    from public.restaurants r
    where r.slug = p_entry_restaurant_slug;
  end if;

  insert into public.ratings (participant_id, dish_id, stars, entry_restaurant_id, device_id, ip_hash, user_agent)
  values (v_participant_id, v_dish_id, p_stars, v_entry_restaurant_id, p_device_id, p_ip_hash, left(p_user_agent, 300))
  on conflict (participant_id, dish_id) do nothing;

  if found then
    return 'created';
  end if;

  return 'already_rated';
end;
$$;

comment on function public.submit_rating is 'Registra participante + calificación. Devuelve created | already_rated | closed | invalid_dish | name_mismatch | rate_limited.';

-- ---------------------------------------------------------------------------
-- 3. Función de la plataforma (event trigger que activa RLS en tablas nuevas).
--    El trigger sigue funcionando: su ejecución no depende de este permiso.
-- ---------------------------------------------------------------------------

revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
