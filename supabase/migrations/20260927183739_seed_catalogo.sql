-- Datos de referencia del duelo: restaurantes, platos y la fila de campaña.
-- Nombres, colores e imágenes son editables cuando lleguen los definitivos.

insert into public.restaurants (slug, name, accent_color, sort_order) values
  ('machete-burger', 'Machete Burger', '#E5484D', 1),
  ('coliseo', 'Coliseo', '#3E63DD', 2);

insert into public.dishes (restaurant_id, slug, category, name, sort_order)
select r.id, r.slug || '-' || v.suffix, v.category, v.name, v.sort_order
from public.restaurants r
cross join (
  values
    ('hamburguesa', 'hamburguesa', 'Hamburguesa', 1),
    ('chuzo-desgranado', 'chuzo_desgranado', 'Chuzo desgranado', 2)
) as v (suffix, category, name, sort_order);

insert into public.campaign (id) values (true);
