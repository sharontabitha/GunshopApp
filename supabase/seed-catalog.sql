-- Idempotently seed the complete 15-item classroom catalogue.
with items(name, type, caliber, price, description, specs, image_url) as (
  values
    ('Glock 17', 'Pistol', '9mm', 599, 'The duty pistol everything else is measured against. Presented as a sporting catalogue display item.', array['Catalogue display'], '/guns/pistol.svg'),
    ('AK-47', 'Rifle', '7.62mm', 899, 'A historic sporting catalogue entry shown for educational product-card practice.', array['Catalogue display'], '/guns/rifle.svg'),
    ('Remington 870', 'Shotgun', '12 Gauge', 449, 'A classic pump-action sporting catalogue entry for this classroom storefront.', array['Catalogue display'], '/guns/shotgun.svg'),
    ('AR-15', 'Rifle', '5.56mm', 799, 'A familiar sporting platform shown as a catalogue display entry.', array['Catalogue display'], '/guns/rifle.svg'),
    ('Desert Eagle', 'Pistol', '.50 AE', 1599, 'A distinctive sporting catalogue display item with a recognizable profile.', array['Catalogue display'], '/guns/pistol.svg'),
    ('Mossberg 500', 'Shotgun', '12 Gauge', 399, 'A familiar pump-action sporting catalogue display entry.', array['Catalogue display'], '/guns/shotgun.svg'),
    ('Glock 19', 'Pistol', '9mm', 549, 'A compact sporting catalogue entry with a balanced profile.', array['Catalogue display'], '/guns/pistol.svg'),
    ('Beretta 92FS', 'Pistol', '9mm', 699, 'A full-size alloy-frame classic with a distinctive sporting profile.', array['Catalogue display'], '/guns/pistol.svg'),
    ('CZ 75 B', 'Pistol', '9mm', 679, 'An all-steel sporting catalogue display item.', array['Catalogue display'], '/guns/pistol.svg'),
    ('SIG Sauer P320', 'Pistol', '9mm', 629, 'A modern modular design shown as a catalogue display item.', array['Catalogue display'], '/guns/pistol.svg'),
    ('Ruger 10/22', 'Rifle', '.22 LR', 329, 'A lightweight sporting rifle catalogue display entry.', array['Catalogue display'], '/guns/rifle.svg'),
    ('Springfield M1A', 'Rifle', '7.62mm', 1499, 'A traditional walnut-stock sporting rifle display item.', array['Catalogue display'], '/guns/rifle.svg'),
    ('Inert Training Cartridge Set', 'Accessories', 'Display only', 29, 'A non-functional, inert display set for a classroom catalogue mock-up. Not live ammunition.', array['Non-functional display prop', 'Not live ammunition'], '/guns/ammo.svg'),
    ('Leather Grip Panels', 'Accessories', 'Display prop', 42, 'Decorative, non-functional prop panels shown as an example accessory.', array['Decorative prop', 'Non-functional'], '/guns/grip-panels.svg'),
    ('Brass Sight Mount', 'Accessories', 'Display prop', 36, 'A non-functional prop accessory for the classroom storefront demonstration.', array['Display prop', 'Non-functional'], '/guns/sight-mount.svg')
)
insert into public.products (name, type, caliber, price, description, specs, image_url)
select items.name, items.type, items.caliber, items.price, items.description, items.specs, items.image_url
from items
where not exists (select 1 from public.products existing where existing.name = items.name);
