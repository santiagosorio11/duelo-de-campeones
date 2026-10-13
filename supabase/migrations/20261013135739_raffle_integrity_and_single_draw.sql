-- Integridad del sorteo después del cierre de votaciones:
-- * 4 ganadores en total: 2 redimen en cada restaurante.
-- * Cada clic sortea únicamente a una persona.
-- * Los perfiles extremos 5-5 / 1-1 y 5-5 / 2-2 no participan.

update public.campaign
set winners_per_restaurant = 2,
    updated_at = now()
where id
  and winners_per_restaurant <> 2;

create or replace view public.raffle_entries
with (security_invoker = true) as
with restaurant_profiles as (
  select
    ra.participant_id,
    d.restaurant_id,
    count(*)::integer as ratings_count,
    min(ra.stars)::smallint as min_stars,
    max(ra.stars)::smallint as max_stars
  from public.ratings ra
  join public.dishes d on d.id = ra.dish_id
  group by ra.participant_id, d.restaurant_id
),
excluded_participants as (
  select distinct high.participant_id
  from restaurant_profiles high
  join restaurant_profiles low
    on low.participant_id = high.participant_id
   and low.restaurant_id <> high.restaurant_id
  where high.ratings_count = 2
    and high.min_stars = 5
    and high.max_stars = 5
    and low.ratings_count = 2
    and low.min_stars = low.max_stars
    and low.min_stars in (1, 2)
)
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
where not exists (
  select 1
  from excluded_participants excluded
  where excluded.participant_id = p.id
)
group by p.id
having count(distinct d.restaurant_id) = (select count(*) from public.restaurants);

comment on view public.raffle_entries is
  'Participan quienes calificaron al menos un plato en cada restaurante, excepto perfiles extremos 5-5 / 1-1 o 5-5 / 2-2. Todos los elegibles tienen la misma probabilidad.';

revoke all on table public.raffle_entries from anon, authenticated;

-- Conserva el cupo por restaurante, pero extrae una sola persona en cada llamada.
create or replace function public.draw_raffle_winners(p_restaurant_slug text)
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
  where not exists (
    select 1
    from public.raffle_draws dr
    where dr.participant_id = e.participant_id
  );

  insert into public.raffle_draws (participant_id, prize_restaurant_id, pool_size)
  select e.participant_id, v_restaurant_id, v_pool
  from public.raffle_entries e
  where not exists (
    select 1
    from public.raffle_draws dr
    where dr.participant_id = e.participant_id
  )
  order by gen_random_uuid()
  limit 1;

  get diagnostics v_drawn = row_count;
  return v_drawn;
end;
$$;

comment on function public.draw_raffle_winners is
  'Sortea un ganador por llamada, sin repetir personas y sin superar el cupo del restaurante.';

revoke all on function public.draw_raffle_winners(text) from public, anon, authenticated;
grant execute on function public.draw_raffle_winners(text) to service_role;
