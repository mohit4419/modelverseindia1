-- ModelVerse India - Supabase / PostgreSQL Schema for Insights Blog Module
-- Run this SQL directly in your Supabase SQL Editor (https://app.supabase.com/project/_/sql)

-- 1. Enable UUID Extension (if not enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0. Safely convert existing UUID columns to TEXT if tables were created with UUID type previously
DO $$ 
BEGIN
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

-- 2. Blog Categories Table
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

-- 3. Blogs (Main Table)
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

-- Ensure columns exist if table was created previously with older schema
ALTER TABLE public.blogs ALTER COLUMN category_id TYPE TEXT USING category_id::text;
ALTER TABLE public.blogs ALTER COLUMN author_id TYPE TEXT USING author_id::text;

-- Create index for quick queries
CREATE INDEX IF NOT EXISTS idx_blogs_status ON public.blogs(status);
CREATE INDEX IF NOT EXISTS idx_blogs_category ON public.blogs(category);
CREATE INDEX IF NOT EXISTS idx_blogs_created_at ON public.blogs(created_at DESC);

-- 4. Blog Comments Table
CREATE TABLE IF NOT EXISTS public.blog_comments (
    id TEXT PRIMARY KEY,
    blog_id TEXT REFERENCES public.blogs(id) ON DELETE CASCADE,
    user_id TEXT,
    user_name TEXT,
    parent_comment_id TEXT,
    comment TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'hidden')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Blog Likes Table
CREATE TABLE IF NOT EXISTS public.blog_likes (
    id TEXT PRIMARY KEY,
    blog_id TEXT REFERENCES public.blogs(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(blog_id, user_id)
);

-- 6. Blog Tags Table
CREATE TABLE IF NOT EXISTS public.blog_tags (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Blog Tag Mapping Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.blog_tag_map (
    blog_id TEXT REFERENCES public.blogs(id) ON DELETE CASCADE,
    tag_id TEXT REFERENCES public.blog_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (blog_id, tag_id)
);

-- 8. GRANT ALL Privileges to API roles (anon, authenticated, service_role, postgres)
GRANT ALL ON TABLE public.blogs TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.blog_categories TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.blog_comments TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.blog_likes TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.blog_tags TO anon, authenticated, service_role, postgres;
GRANT ALL ON TABLE public.blog_tag_map TO anon, authenticated, service_role, postgres;

-- 9. Row Level Security Policies
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select" ON public.blogs;
DROP POLICY IF EXISTS "Allow write" ON public.blogs;
CREATE POLICY "Allow public select" ON public.blogs FOR SELECT USING (true);
CREATE POLICY "Allow write" ON public.blogs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select" ON public.blog_categories;
DROP POLICY IF EXISTS "Allow write" ON public.blog_categories;
CREATE POLICY "Allow public select" ON public.blog_categories FOR SELECT USING (true);
CREATE POLICY "Allow write" ON public.blog_categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select" ON public.blog_comments;
DROP POLICY IF EXISTS "Allow write" ON public.blog_comments;
CREATE POLICY "Allow public select" ON public.blog_comments FOR SELECT USING (true);
CREATE POLICY "Allow write" ON public.blog_comments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select" ON public.blog_likes;
DROP POLICY IF EXISTS "Allow write" ON public.blog_likes;
CREATE POLICY "Allow public select" ON public.blog_likes FOR SELECT USING (true);
CREATE POLICY "Allow write" ON public.blog_likes FOR ALL USING (true) WITH CHECK (true);
