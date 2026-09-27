-- Duelo de Campeones: esquema inicial.
--
-- Modelo de acceso: el navegador nunca consulta Supabase directamente. Todas las
-- lecturas y escrituras pasan por el servidor de Next.js con la secret key
-- (rol service_role). Por eso anon/authenticated no tienen privilegios y todas
-- las tablas tienen RLS habilitado sin políticas (deny-all).

-- ---------------------------------------------------------------------------
-- Catálogo
-- ---------------------------------------------------------------------------

create table public.restaurants (
  id smallint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 2 and 60),
  tagline text check (char_length(tagline) <= 120),
  accent_color text not null default '#E5484D' check (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  logo_path text,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.restaurants is 'Restaurantes que compiten en el duelo.';

create table public.dishes (
  id smallint generated always as identity primary key,
  restaurant_id smallint not null references public.restaurants (id) on delete restrict,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  category text not null check (category in ('hamburguesa', 'chuzo_desgranado')),
  name text not null check (char_length(name) between 2 and 80),
  description text check (char_length(description) <= 280),
  image_path text,
  sort_order smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  -- Un plato por categoría y restaurante. El índice también cubre el FK restaurant_id.
  unique (restaurant_id, category)
);

comment on table public.dishes is 'Platos en competencia: una hamburguesa y un chuzo desgranado por restaurante.';

-- ---------------------------------------------------------------------------
-- Participantes y calificaciones
-- ---------------------------------------------------------------------------

create table public.participants (
  id bigint generated always as identity primary key,
  full_name text not null check (char_length(btrim(full_name)) between 3 and 80),
  -- Solo celulares colombianos en formato E.164.
  phone_e164 text not null unique check (phone_e164 ~ '^\+573[0-9]{9}$'),
  consent_version text not null check (char_length(consent_version) between 1 and 40),
  consented_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

comment on table public.participants is 'Personas que califican (sin cuenta de usuario). Identificadas por su celular.';

create table public.ratings (
  id bigint generated always as identity primary key,
  participant_id bigint not null references public.participants (id) on delete cascade,
  dish_id smallint not null references public.dishes (id) on delete restrict,
  stars smallint not null check (stars between 1 and 5),
  -- Restaurante del QR desde el que se entró (contexto para la futura validación de visita).
  entry_restaurant_id smallint references public.restaurants (id) on delete set null,
  device_id uuid,
  ip_hash text check (char_length(ip_hash) <= 128),
  user_agent text check (char_length(user_agent) <= 300),
  created_at timestamptz not null default now(),
  -- Una calificación por teléfono por plato. El índice también cubre el FK participant_id.
  unique (participant_id, dish_id)
);

create index ratings_dish_id_idx on public.ratings (dish_id);
create index ratings_entry_restaurant_id_idx on public.ratings (entry_restaurant_id);
create index ratings_device_id_idx on public.ratings (device_id) where device_id is not null;

comment on table public.ratings is 'Calificación de 1 a 5 estrellas: un sello del pasaporte.';

-- ---------------------------------------------------------------------------
-- Campaña y sorteo
-- ---------------------------------------------------------------------------

create table public.campaign (
  id boolean primary key default true check (id),
  name text not null default 'Duelo de Campeones',
  starts_at timestamptz,
  ends_at timestamptz,
  is_open boolean not null default true,
  results_published boolean not null default false,
  updated_at timestamptz not null default now(),
  check (starts_at is null or ends_at is null or ends_at > starts_at)
);

comment on table public.campaign is 'Configuración de la campaña (fila única).';

create table public.raffle_draws (
  id bigint generated always as identity primary key,
  participant_id bigint not null references public.participants (id) on delete restrict,
  tickets smallint not null check (tickets > 0),
  total_tickets integer not null check (total_tickets >= tickets),
  pool_size integer not null check (pool_size > 0),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  notes text check (char_length(notes) <= 500),
  drawn_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index raffle_draws_participant_id_idx on public.raffle_draws (participant_id);

comment on table public.raffle_draws is 'Historial de sorteos. rejected = el número no respondió o no era real.';

-- ---------------------------------------------------------------------------
-- Vistas (security_invoker para no saltarse RLS)
-- ---------------------------------------------------------------------------

create view public.dish_results
with (security_invoker = true) as
select
  d.id as dish_id,
  d.slug as dish_slug,
  d.name as dish_name,
  d.category,
  r.id as restaurant_id,
  r.slug as restaurant_slug,
  r.name as restaurant_name,
  count(ra.id)::integer as votes,
  round(avg(ra.stars), 2) as avg_stars,
  count(ra.id) filter (where ra.stars = 1)::integer as stars_1,
  count(ra.id) filter (where ra.stars = 2)::integer as stars_2,
  count(ra.id) filter (where ra.stars = 3)::integer as stars_3,
  count(ra.id) filter (where ra.stars = 4)::integer as stars_4,
  count(ra.id) filter (where ra.stars = 5)::integer as stars_5
from public.dishes d
join public.restaurants r on r.id = d.restaurant_id
left join public.ratings ra on ra.dish_id = d.id
group by d.id, r.id;

comment on view public.dish_results is 'Resultados por plato: votos, promedio y distribución de estrellas.';

create view public.raffle_entries
with (security_invoker = true) as
select
  p.id as participant_id,
  p.full_name,
  p.phone_e164,
  count(ra.id)::integer as tickets,
  count(distinct d.restaurant_id)::integer as restaurants_covered,
  min(ra.created_at) as first_rating_at,
  max(ra.created_at) as last_rating_at
from public.participants p
join public.ratings ra on ra.participant_id = p.id
join public.dishes d on d.id = ra.dish_id
group by p.id
having count(distinct d.restaurant_id) = (select count(*) from public.restaurants);

comment on view public.raffle_entries is 'Participan quienes calificaron al menos un plato de cada restaurante. tickets = platos calificados.';

-- ---------------------------------------------------------------------------
-- Registro atómico de una calificación
-- ---------------------------------------------------------------------------

create function public.submit_rating(
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
  v_entry_restaurant_id smallint;
begin
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

  -- El primer nombre registrado para un teléfono se conserva.
  insert into public.participants as p (full_name, phone_e164, consent_version)
  values (btrim(p_full_name), p_phone_e164, p_consent_version)
  on conflict (phone_e164) do nothing
  returning p.id into v_participant_id;

  if v_participant_id is null then
    select p.id into v_participant_id
    from public.participants p
    where p.phone_e164 = p_phone_e164;
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

comment on function public.submit_rating is 'Registra participante + calificación. Devuelve created | already_rated | closed | invalid_dish.';

-- ---------------------------------------------------------------------------
-- Privilegios: solo service_role (servidor). RLS deny-all como segunda barrera.
-- ---------------------------------------------------------------------------

revoke all on table
  public.restaurants,
  public.dishes,
  public.participants,
  public.ratings,
  public.campaign,
  public.raffle_draws,
  public.dish_results,
  public.raffle_entries
from anon, authenticated;

revoke all on all sequences in schema public from anon, authenticated;

revoke all on function public.submit_rating(text, text, text, smallint, text, text, uuid, text, text)
from public, anon, authenticated;

grant execute on function public.submit_rating(text, text, text, smallint, text, text, uuid, text, text)
to service_role;

alter table public.restaurants enable row level security;
alter table public.dishes enable row level security;
alter table public.participants enable row level security;
alter table public.ratings enable row level security;
alter table public.campaign enable row level security;
alter table public.raffle_draws enable row level security;
