-- Nuevas condiciones del sorteo:
-- * Participa quien calificó al menos un plato en cada restaurante, todos con la misma probabilidad.
-- * 8 ganadores: 4 redimen en Machete Burger y 4 en Coliseo (cupo configurable por restaurante).

alter table public.campaign
  add column winners_per_restaurant smallint not null default 4
  check (winners_per_restaurant between 1 and 50);

-- raffle_draws está vacía: se reestructura sin migrar datos.
alter table public.raffle_draws
  drop column tickets,
  drop column total_tickets,
  add column prize_restaurant_id smallint not null references public.restaurants (id) on delete restrict;

comment on column public.raffle_draws.prize_restaurant_id is 'Restaurante donde el ganador redime el premio.';

-- Una persona sale sorteada una sola vez, aunque luego se descarte.
drop index public.raffle_draws_participant_id_idx;
create unique index raffle_draws_participant_id_key on public.raffle_draws (participant_id);
create index raffle_draws_prize_restaurant_id_idx on public.raffle_draws (prize_restaurant_id);

-- La vista ya no cuenta oportunidades: solo platos calificados, como dato informativo.
drop view public.raffle_entries;

create view public.raffle_entries
with (security_invoker = true) as
select
  p.id as participant_id,
  p.full_name,
  p.phone_e164,
  count(ra.id)::integer as dishes_rated,
  count(distinct d.restaurant_id)::integer as restaurants_covered,
  min(ra.created_at) as first_rating_at,
  max(ra.created_at) as last_rating_at
from public.participants p
join public.ratings ra on ra.participant_id = p.id
join public.dishes d on d.id = ra.dish_id
group by p.id
having count(distinct d.restaurant_id) = (select count(*) from public.restaurants);

comment on view public.raffle_entries is 'Participan quienes calificaron al menos un plato en cada restaurante. Todos con la misma probabilidad.';

revoke all on table public.raffle_entries from anon, authenticated;

-- Sortea los cupos que falten para un restaurante, de forma atómica.
create function public.draw_raffle_winners(p_restaurant_slug text)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_restaurant_id smallint;
  v_missing integer;
  v_pool integer;
  v_drawn integer;
begin
  -- Un sorteo a la vez, para no superar el cupo por restaurante.
  perform pg_advisory_xact_lock(hashtext('public.raffle_draws'));

  select r.id into v_restaurant_id
  from public.restaurants r
  where r.slug = p_restaurant_slug;

  if v_restaurant_id is null then
    raise exception 'Restaurante desconocido: %', p_restaurant_slug;
  end if;

  select c.winners_per_restaurant - count(dr.id) into v_missing
  from public.campaign c
  left join public.raffle_draws dr
    on dr.prize_restaurant_id = v_restaurant_id and dr.status <> 'rejected'
  where c.id
  group by c.winners_per_restaurant;

  if coalesce(v_missing, 0) <= 0 then
    return 0;
  end if;

  select count(*) into v_pool
  from public.raffle_entries e
  where not exists (select 1 from public.raffle_draws dr where dr.participant_id = e.participant_id);

  -- gen_random_uuid() usa aleatoriedad criptográfica: orden imparcial.
  insert into public.raffle_draws (participant_id, prize_restaurant_id, pool_size)
  select e.participant_id, v_restaurant_id, v_pool
  from public.raffle_entries e
  where not exists (select 1 from public.raffle_draws dr where dr.participant_id = e.participant_id)
  order by gen_random_uuid()
  limit v_missing;

  get diagnostics v_drawn = row_count;
  return v_drawn;
end;
$$;

comment on function public.draw_raffle_winners is 'Sortea, sin repetir personas, los ganadores que falten para un restaurante. Devuelve cuántos salieron.';

revoke all on function public.draw_raffle_winners(text) from public, anon, authenticated;
grant execute on function public.draw_raffle_winners(text) to service_role;
