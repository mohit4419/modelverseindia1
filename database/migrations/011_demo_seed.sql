-- 011_demo_seed.sql
-- WARNING: THIS IS A DEVELOPMENT-ONLY DEMO SEED FILE.
-- DO NOT RUN THIS MIGRATION IN A PRISTINE PRODUCTION ENVIRONMENT.
-- Description: Seeds initial fictional demo data for development, testing, and display purposes.
-- This file should be applied only in sandbox/staging/dev environments and omitted in pristine production environments.

--------------------------------------------------------------------------------
-- 1. Demo Users (Auth.users and public.users sync)
--------------------------------------------------------------------------------
DO $$
DECLARE
    auth_exists BOOLEAN;
BEGIN
    -- Check if auth schema exists to satisfy foreign keys
    SELECT EXISTS (
        SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth'
    ) INTO auth_exists;

    IF auth_exists THEN
        -- Insert into auth.users. The trg_handle_new_auth_user_signup trigger on auth.users 
        -- will automatically handle inserting these into public.users and public.profiles.
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud) VALUES
        (
            'c0000000-0000-0000-0000-000000000001', 
            'client@modelverse.in', 
            '$2a$10$7zBtwIexU6rRE6mscHlqLOu5W5E6S72zKOnYgRfe.WNo3D1H1Wb72', 
            now(), 
            '{"provider":"email","providers":["email"]}', 
            '{"full_name":"Demo Client","role":"client","phone":"+91 98765 43210"}', 
            now(), 
            now(), 
            'authenticated', 
            'authenticated'
        ),
        (
            'c0000000-0000-0000-0000-000000000002', 
            'model@modelverse.in', 
            '$2a$10$7zBtwIexU6rRE6mscHlqLOu5W5E6S72zKOnYgRfe.WNo3D1H1Wb72', 
            now(), 
            '{"provider":"email","providers":["email"]}', 
            '{"full_name":"Aisha Mehra","role":"model","phone":"+91 91111 22222"}', 
            now(), 
            now(), 
            'authenticated', 
            'authenticated'
        ),
        (
            'c0000000-0000-0000-0000-000000000003', 
            'admin@modelverse.in', 
            '$2a$10$7zBtwIexU6rRE6mscHlqLOu5W5E6S72zKOnYgRfe.WNo3D1H1Wb72', 
            now(), 
            '{"provider":"email","providers":["email"]}', 
            '{"full_name":"Super Admin","role":"admin","phone":"+91 99999 88888"}', 
            now(), 
            now(), 
            'authenticated', 
            'authenticated'
        )
        ON CONFLICT (id) DO NOTHING;

        -- SECURITY OVERRIDE (Development/Demo Provisioning Only):
        -- Overwrite the admin role to 'admin' in public.users since the signup trigger restricts role inputs and defaults to 'client' for safety.
        -- In a real production deployment, admin roles must be securely provisioned via direct manual DB administration or service roles.
        UPDATE public.users SET role = 'admin' WHERE id = 'c0000000-0000-0000-0000-000000000003';

    ELSE
        -- Directly seed public.users if auth schema is absent (for local/raw DB setups)
        INSERT INTO public.users (id, full_name, email, phone, role, status) VALUES
        ('c0000000-0000-0000-0000-000000000001', 'Demo Client', 'client@modelverse.in', '+91 98765 43210', 'client', 'active'),
        ('c0000000-0000-0000-0000-000000000002', 'Aisha Mehra', 'model@modelverse.in', '+91 91111 22222', 'model', 'active'),
        ('c0000000-0000-0000-0000-000000000003', 'Super Admin', 'admin@modelverse.in', '+91 99999 88888', 'admin', 'active')
        ON CONFLICT (id) DO NOTHING;
    END IF;
END
$$;

--------------------------------------------------------------------------------
-- 2. Demo Sub-profiles (Clients and Models)
--------------------------------------------------------------------------------

-- Seed clients record
INSERT INTO public.clients (id) VALUES
('c0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Seed model record for Aisha Mehra (initially set reviews rating to 0.0 and count to 0)
-- This allows the reviews insert below to automatically run the aggregation trigger and update these organically.
INSERT INTO public.models (
    id, 
    "userId", 
    name, 
    gender, 
    age, 
    height, 
    city, 
    state, 
    starting_price, 
    rating, 
    reviews_count, 
    biography, 
    phone, 
    email
) VALUES (
    '99999999-9999-9999-9999-999999999999', 
    'c0000000-0000-0000-0000-000000000002', 
    'Aisha Mehra', 
    'Female', 
    27, 
    176, 
    'Mumbai', 
    'Maharashtra', 
    25000.00, 
    0.0, 
    0, 
    'Professional fashion and commercial model based in Mumbai.', 
    '+91 91111 22222', 
    'model@modelverse.in'
)
ON CONFLICT (id) DO NOTHING;

--------------------------------------------------------------------------------
-- 3. Model Categories & Skills mapping
--------------------------------------------------------------------------------

-- Link model Aisha Mehra to default Category 'High Fashion / Runway'
INSERT INTO public.model_categories (id, model_id, category_id) VALUES
('00000000-0000-0000-0000-000000000001', '99999999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- Link model Aisha Mehra to skills: 'Ramp Walk / Catwalk' & 'Swimwear Modeling'
INSERT INTO public.model_skills (id, model_id, skill_id) VALUES
('00000000-0000-0000-0000-000000000002', '99999999-9999-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('00000000-0000-0000-0000-000000000003', '99999999-9999-9999-9999-999999999999', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee')
ON CONFLICT (id) DO NOTHING;

--------------------------------------------------------------------------------
-- 4. Demo Bookings and Reviews (Automatic Aggregation Trigger Testing)
--------------------------------------------------------------------------------

-- Seed a completed booking to serve as the basis for a review
INSERT INTO public.bookings (
    id,
    booking_number,
    client_id,
    model_id,
    project_title,
    project_type,
    event_type,
    start_date,
    end_date,
    start_time,
    end_time,
    amount,
    payment_status,
    status
) VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'MV-2026-000001',
    'c0000000-0000-0000-0000-000000000001',
    '99999999-9999-9999-9999-999999999999',
    'Summer Couture Runway',
    'Runway',
    'Catwalk',
    CURRENT_DATE - INTERVAL '10 days',
    CURRENT_DATE - INTERVAL '10 days',
    '10:00:00',
    '18:00:00',
    30000.00,
    'paid',
    'completed'
)
ON CONFLICT (id) DO NOTHING;

-- Seed a review on Aisha Mehra for this completed booking. 
-- Inserting this will automatically execute public.fn_sync_model_review_stats trigger, 
-- updating rating and reviews_count on public.models organically!
INSERT INTO public.reviews (
    id,
    booking_id,
    client_id,
    model_id,
    rating,
    review,
    is_approved,
    is_hidden
) VALUES (
    'r0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    '99999999-9999-9999-9999-999999999999',
    5.0,
    'Aisha was phenomenal on the runway! Professional poise, incredible energy, and absolute pleasure to work with.',
    true,
    false
)
ON CONFLICT (id) DO NOTHING;
