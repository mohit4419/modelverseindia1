-- 0. Safely convert existing UUID columns to TEXT if tables were created with UUID type previously
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'id' AND data_type = 'uuid'
  ) THEN
    BEGIN
      ALTER TABLE public.users ALTER COLUMN id TYPE TEXT USING id::text;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id' AND data_type = 'uuid'
  ) THEN
    BEGIN
      ALTER TABLE public.profiles ALTER COLUMN id TYPE TEXT USING id::text;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'blog_categories' AND column_name = 'id' AND data_type = 'uuid'
  ) THEN
    BEGIN
      ALTER TABLE public.blog_categories ALTER COLUMN id TYPE TEXT USING id::text;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'blogs' AND column_name = 'category_id' AND data_type = 'uuid'
  ) THEN
    BEGIN
      ALTER TABLE public.blogs ALTER COLUMN category_id TYPE TEXT USING category_id::text;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'blogs' AND column_name = 'author_id' AND data_type = 'uuid'
  ) THEN
    BEGIN
      ALTER TABLE public.blogs ALTER COLUMN author_id TYPE TEXT USING author_id::text;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
END $$;

-- 1. Create the 'users' table exactly with requested columns
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password_hash TEXT,
    role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'model', 'admin')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    avatar TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ensure profiles exist and are synced with users for existing application route/repository compatibility
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    role TEXT DEFAULT 'client',
    phone TEXT,
    status TEXT DEFAULT 'active',
    "avatarUrl" TEXT,
    favorites TEXT[] DEFAULT '{}',
    "createdAt" TEXT DEFAULT timezone('utc'::text, now())::text,
    updated_at TEXT DEFAULT timezone('utc'::text, now())::text
);

-- Create trigger to automatically synchronize user authentication and manual signup to public.profiles
CREATE OR REPLACE FUNCTION public.sync_profiles_from_users()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, name, email, role, phone, status, "avatarUrl", "createdAt", updated_at
  ) VALUES (
    NEW.id,
    NEW.full_name,
    NEW.email,
    NEW.role,
    NEW.phone,
    NEW.status,
    NEW.avatar,
    NEW.created_at::text,
    NEW.updated_at::text
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone,
    status = EXCLUDED.status,
    "avatarUrl" = EXCLUDED."avatarUrl",
    updated_at = EXCLUDED.updated_at;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_profiles_from_users ON public.users;
CREATE TRIGGER trg_sync_profiles_from_users
    AFTER INSERT OR UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.sync_profiles_from_users();

-- Create trigger for automatic sync from auth.users (Supabase native Auth) directly into public.users & public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_auth_user_signup()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Sync into public.users
  BEGIN
    INSERT INTO public.users (
      id, 
      email, 
      full_name, 
      role, 
      phone,
      status, 
      created_at,
      updated_at
    )
    VALUES (
      NEW.id::text,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
      COALESCE(NEW.raw_user_meta_data->>'phone', ''),
      'active',
      timezone('utc'::text, now()),
      timezone('utc'::text, now())
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, users.full_name),
      role = COALESCE(EXCLUDED.role, users.role),
      phone = COALESCE(EXCLUDED.phone, users.phone),
      updated_at = timezone('utc'::text, now());
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Users sync error: %', SQLERRM;
  END;

  -- 2. Sync into public.profiles
  BEGIN
    INSERT INTO public.profiles (
      id,
      email,
      name,
      role,
      phone,
      status,
      created_at
    )
    VALUES (
      NEW.id::text,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
      COALESCE(NEW.raw_user_meta_data->>'phone', ''),
      'active',
      timezone('utc'::text, now())
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = COALESCE(EXCLUDED.name, profiles.name),
      role = COALESCE(EXCLUDED.role, profiles.role),
      phone = COALESCE(EXCLUDED.phone, profiles.phone);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Profiles sync error: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user_signup();

-- 2. Create the 'clients' table
CREATE TABLE IF NOT EXISTS public.clients (
    id TEXT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Create 'models' table
CREATE TABLE IF NOT EXISTS public.models (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    gender TEXT,
    age INTEGER,
    height INTEGER,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    starting_price INTEGER DEFAULT 15000,
    rating NUMERIC DEFAULT 5.0,
    reviews_count INTEGER DEFAULT 0,
    biography TEXT,
    phone TEXT,
    email TEXT,
    approved BOOLEAN DEFAULT true,
    rejected BOOLEAN DEFAULT false,
    selfie_verified BOOLEAN DEFAULT true,
    category TEXT DEFAULT 'fashion',
    portfolio JSONB DEFAULT '[]'::jsonb,
    measurements JSONB DEFAULT '{}'::jsonb,
    languages JSONB DEFAULT '["English", "Hindi"]'::jsonb,
    experience TEXT DEFAULT 'Fresh Face',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.models ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT true;
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS rejected BOOLEAN DEFAULT false;
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS selfie_verified BOOLEAN DEFAULT true;
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'fashion';
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS portfolio JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS measurements JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '["English", "Hindi"]'::jsonb;
ALTER TABLE public.models ADD COLUMN IF NOT EXISTS experience TEXT DEFAULT 'Fresh Face';

-- 4. Create model-associated auxiliary child tables
-- A. model_media
CREATE TABLE IF NOT EXISTS public.model_media (
    id TEXT PRIMARY KEY,
    model_id TEXT NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type TEXT DEFAULT 'image', -- 'image' or 'video'
    caption TEXT,
    category TEXT, -- e.g., 'Runway', 'Editorial'
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- B. model_documents
CREATE TABLE IF NOT EXISTS public.model_documents (
    id TEXT PRIMARY KEY,
    model_id TEXT NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
    document_name TEXT NOT NULL,
    document_type TEXT NOT NULL, -- e.g., 'Aadhaar', 'Pan', 'Contract'
    document_url TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by TEXT REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- C. model_social_links
CREATE TABLE IF NOT EXISTS public.model_social_links (
    id TEXT PRIMARY KEY,
    model_id TEXT NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- e.g., 'instagram', 'twitter', 'portfolio'
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- D. model_categories
CREATE TABLE IF NOT EXISTS public.model_categories (
    id TEXT PRIMARY KEY,
    model_id TEXT NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- e.g., 'Fashion Models', 'Commercial Models'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- E. model_skills
CREATE TABLE IF NOT EXISTS public.model_skills (
    id TEXT PRIMARY KEY,
    model_id TEXT NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
    skill TEXT NOT NULL, -- e.g., 'artistic posing', 'ramp walk'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Create 'bookings' table
CREATE TABLE IF NOT EXISTS public.bookings (
    id TEXT PRIMARY KEY,
    booking_number TEXT UNIQUE,
    client_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    model_id TEXT NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    booking_date TEXT,
    location TEXT,
    amount NUMERIC DEFAULT 0,
    project_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Create 'favorites' table
CREATE TABLE IF NOT EXISTS public.favorites (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    model_id TEXT NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_favorite UNIQUE (client_id, model_id)
);

-- 7. Create 'payments' table (linking from bookings)
CREATE TABLE IF NOT EXISTS public.payments (
    id TEXT PRIMARY KEY,
    booking_id TEXT NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. Create 'reviews' table (linking from bookings)
CREATE TABLE IF NOT EXISTS public.reviews (
    id TEXT PRIMARY KEY,
    booking_id TEXT REFERENCES public.bookings(id) ON DELETE SET NULL,
    client_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    model_id TEXT NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 9. Create 'transactions' table (linking from payments)
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    payment_id TEXT NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    gateway TEXT NOT NULL DEFAULT 'Razorpay',
    transaction_reference TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    amount NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 10. Create 'notifications' table
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 11. Create 'audit_logs' table (linking from transactions)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    transaction_id TEXT REFERENCES public.transactions(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    performed_by TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Grant broad read-write capabilities (with SELECT accessible to all, rest for authenticated/service role)
DROP POLICY IF EXISTS "Allow public select" ON public.users;
DROP POLICY IF EXISTS "Allow public select" ON public.clients;
DROP POLICY IF EXISTS "Allow public select" ON public.models;
DROP POLICY IF EXISTS "Allow public select" ON public.model_media;
DROP POLICY IF EXISTS "Allow public select" ON public.model_documents;
DROP POLICY IF EXISTS "Allow public select" ON public.model_social_links;
DROP POLICY IF EXISTS "Allow public select" ON public.model_categories;
DROP POLICY IF EXISTS "Allow public select" ON public.model_skills;
DROP POLICY IF EXISTS "Allow public select" ON public.bookings;
DROP POLICY IF EXISTS "Allow public select" ON public.favorites;
DROP POLICY IF EXISTS "Allow public select" ON public.payments;
DROP POLICY IF EXISTS "Allow public select" ON public.reviews;
DROP POLICY IF EXISTS "Allow public select" ON public.transactions;
DROP POLICY IF EXISTS "Allow public select" ON public.notifications;
DROP POLICY IF EXISTS "Allow public select" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow public select on profiles" ON public.profiles;

CREATE POLICY "Allow public select" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public select" ON public.clients FOR SELECT USING (true);
CREATE POLICY "Allow public select" ON public.models FOR SELECT USING (true);
CREATE POLICY "Allow public select" ON public.model_media FOR SELECT USING (true);
CREATE POLICY "Allow public select" ON public.model_documents FOR SELECT USING (true);
CREATE POLICY "Allow public select" ON public.model_social_links FOR SELECT USING (true);
CREATE POLICY "Allow public select" ON public.model_categories FOR SELECT USING (true);
CREATE POLICY "Allow public select" ON public.model_skills FOR SELECT USING (true);
CREATE POLICY "Allow public select" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Allow public select" ON public.favorites FOR SELECT USING (true);
CREATE POLICY "Allow public select" ON public.payments FOR SELECT USING (true);
CREATE POLICY "Allow public select" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Allow public select" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Allow public select" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Allow public select" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow public select on profiles" ON public.profiles FOR SELECT USING (true);

-- Allow insertions/updates for general seamless testing Flow
DROP POLICY IF EXISTS "Allow write" ON public.users;
DROP POLICY IF EXISTS "Allow write" ON public.clients;
DROP POLICY IF EXISTS "Allow write" ON public.models;
DROP POLICY IF EXISTS "Allow write" ON public.model_media;
DROP POLICY IF EXISTS "Allow write" ON public.model_documents;
DROP POLICY IF EXISTS "Allow write" ON public.model_social_links;
DROP POLICY IF EXISTS "Allow write" ON public.model_categories;
DROP POLICY IF EXISTS "Allow write" ON public.model_skills;
DROP POLICY IF EXISTS "Allow write" ON public.bookings;
DROP POLICY IF EXISTS "Allow write" ON public.favorites;
DROP POLICY IF EXISTS "Allow write" ON public.payments;
DROP POLICY IF EXISTS "Allow write" ON public.reviews;
DROP POLICY IF EXISTS "Allow write" ON public.transactions;
DROP POLICY IF EXISTS "Allow write" ON public.notifications;
DROP POLICY IF EXISTS "Allow write" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow write on profiles" ON public.profiles;

CREATE POLICY "Allow write" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow write" ON public.clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow write" ON public.models FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow write" ON public.model_media FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow write" ON public.model_documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow write" ON public.model_social_links FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow write" ON public.model_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow write" ON public.model_skills FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow write" ON public.bookings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow write" ON public.favorites FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow write" ON public.payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow write" ON public.reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow write" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow write" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow write" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow write on profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- Insert dummy users for testing safely
DO $$
BEGIN
  INSERT INTO public.users (id, full_name, email, phone, role, status) VALUES
  ('c_test', 'Demo Client', 'client@modelverse.in', '+91 98765 43210', 'client', 'active'),
  ('m1', 'Pooja Hegde', 'model@modelverse.in', '+91 91111 22222', 'model', 'active'),
  ('a_admin', 'Super Admin', 'admin@modelverse.in', '+91 99999 88888', 'admin', 'active')
  ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN
  BEGIN
    INSERT INTO public.users (id, full_name, email, phone, role, status) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Demo Client', 'client@modelverse.in', '+91 98765 43210', 'client', 'active'),
    ('00000000-0000-0000-0000-000000000002', 'Pooja Hegde', 'model@modelverse.in', '+91 91111 22222', 'model', 'active'),
    ('00000000-0000-0000-0000-000000000003', 'Super Admin', 'admin@modelverse.in', '+91 99999 88888', 'admin', 'active')
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

-- 12. Create 'blog_categories' table
CREATE TABLE IF NOT EXISTS public.blog_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed default categories safely
DO $$
BEGIN
  INSERT INTO public.blog_categories (id, name, slug, description, icon) VALUES
  ('cat-1', 'Fashion', 'fashion', 'High fashion couture & runway trends', 'Sparkles'),
  ('cat-2', 'Modeling Tips', 'modeling-tips', 'Posing, portfolios, and casting advice', 'BookOpen'),
  ('cat-3', 'Beauty', 'beauty', 'Skincare, makeup, and camera aesthetics', 'Sun'),
  ('cat-4', 'Lifestyle', 'lifestyle', 'Fitness, travel, and personal branding', 'Heart'),
  ('cat-5', 'Industry News', 'industry-news', 'Latest agency trends and casting calls', 'Newspaper'),
  ('cat-6', 'Success Stories', 'success-stories', 'Inspirational journeys of ModelVerse talent', 'Award')
  ON CONFLICT (slug) DO NOTHING;
EXCEPTION WHEN OTHERS THEN
  BEGIN
    INSERT INTO public.blog_categories (name, slug, description, icon) VALUES
    ('Fashion', 'fashion', 'High fashion couture & runway trends', 'Sparkles'),
    ('Modeling Tips', 'modeling-tips', 'Posing, portfolios, and casting advice', 'BookOpen'),
    ('Beauty', 'beauty', 'Skincare, makeup, and camera aesthetics', 'Sun'),
    ('Lifestyle', 'lifestyle', 'Fitness, travel, and personal branding', 'Heart'),
    ('Industry News', 'industry-news', 'Latest agency trends and casting calls', 'Newspaper'),
    ('Success Stories', 'success-stories', 'Inspirational journeys of ModelVerse talent', 'Award')
    ON CONFLICT (slug) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

-- 13. Create 'blogs' table
CREATE TABLE IF NOT EXISTS public.blogs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT DEFAULT 'Industry Tips',
    category_id TEXT,
    author_id TEXT,
    author_name TEXT,
    author TEXT,
    author_role TEXT DEFAULT 'contributor',
    author_email TEXT,
    user_id TEXT,
    brief_summary TEXT,
    summary TEXT,
    content TEXT NOT NULL,
    excerpt TEXT,
    featured_image TEXT,
    image_url TEXT,
    status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'pending', 'published', 'rejected')),
    is_featured BOOLEAN DEFAULT false,
    read_time INTEGER DEFAULT 3,
    views INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    seo_title TEXT,
    seo_description TEXT,
    seo_keywords TEXT,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_date TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

GRANT ALL ON TABLE public.blogs TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.blog_categories TO anon, authenticated, service_role, postgres;

ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select" ON public.blogs;
DROP POLICY IF EXISTS "Allow write" ON public.blogs;
CREATE POLICY "Allow public select" ON public.blogs FOR SELECT USING (true);
CREATE POLICY "Allow write" ON public.blogs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select" ON public.blog_categories;
DROP POLICY IF EXISTS "Allow write" ON public.blog_categories;
CREATE POLICY "Allow public select" ON public.blog_categories FOR SELECT USING (true);
CREATE POLICY "Allow write" ON public.blog_categories FOR ALL USING (true) WITH CHECK (true);

-- Grant privileges on all tables in public schema for API access
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role, postgres;


