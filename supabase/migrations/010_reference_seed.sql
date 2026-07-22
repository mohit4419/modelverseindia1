-- 010_reference_seed.sql
-- Description: Seeds default reference / lookup data that are static and required for production setup.

-- Seed default categories
INSERT INTO public.categories (id, name, description) VALUES
('11111111-1111-1111-1111-111111111111', 'High Fashion / Runway', 'Runway modeling and designer showcase'),
('22222222-2222-2222-2222-222222222222', 'Commercial / Print', 'Advertisements, catalogs, and print media'),
('33333333-3333-3333-3333-333333333333', 'Fitness / Athletic', 'Sports, gym, and active wear campaigns'),
('44444444-4444-4444-4444-444444444444', 'Editorial / Couture', 'Artistic modeling for high-end magazines'),
('55555555-5555-5555-5555-555555555555', 'Parts Modeling', 'Hands, feet, hair, or eye specialty modeling')
ON CONFLICT (id) DO NOTHING;

-- Seed default skills
INSERT INTO public.skills (id, name, "categoryId") VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Ramp Walk / Catwalk', '11111111-1111-1111-1111-111111111111'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Artistic Posing', '44444444-4444-4444-4444-444444444444'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Facial Expressions', '22222222-2222-2222-2222-222222222222'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Athletic Agility', '33333333-3333-3333-3333-333333333333'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Swimwear Modeling', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;
