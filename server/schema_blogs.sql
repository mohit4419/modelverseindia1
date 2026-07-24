-- ModelVerse India - Supabase / PostgreSQL Schema for Insights Blog Module
-- Run this SQL directly in your Supabase SQL Editor (https://app.supabase.com/project/_/sql)

-- 1. Enable UUID Extension (if not enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Blog Categories Table
CREATE TABLE IF NOT EXISTS public.blog_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed default categories
INSERT INTO public.blog_categories (name, slug, description, icon) VALUES
('Fashion', 'fashion', 'High fashion couture & runway trends', 'Sparkles'),
('Modeling Tips', 'modeling-tips', 'Posing, portfolios, and casting advice', 'BookOpen'),
('Beauty', 'beauty', 'Skincare, makeup, and camera aesthetics', 'Sun'),
('Lifestyle', 'lifestyle', 'Fitness, travel, and personal branding', 'Heart'),
('Industry News', 'industry-news', 'Latest agency trends and casting calls', 'Newspaper'),
('Success Stories', 'success-stories', 'Inspirational journeys of ModelVerse talent', 'Award')
ON CONFLICT (slug) DO NOTHING;

-- 3. Blogs (Main Table)
CREATE TABLE IF NOT EXISTS public.blogs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT DEFAULT 'Industry Tips',
    category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
    author_id UUID,
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

-- Create index for quick queries
CREATE INDEX IF NOT EXISTS idx_blogs_status ON public.blogs(status);
CREATE INDEX IF NOT EXISTS idx_blogs_category ON public.blogs(category);
CREATE INDEX IF NOT EXISTS idx_blogs_created_at ON public.blogs(created_at DESC);

-- 4. Blog Comments Table
CREATE TABLE IF NOT EXISTS public.blog_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blog_id TEXT REFERENCES public.blogs(id) ON DELETE CASCADE,
    user_id TEXT,
    user_name TEXT,
    parent_comment_id UUID REFERENCES public.blog_comments(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'hidden')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Blog Likes Table
CREATE TABLE IF NOT EXISTS public.blog_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blog_id TEXT REFERENCES public.blogs(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(blog_id, user_id)
);

-- 6. Blog Tags Table
CREATE TABLE IF NOT EXISTS public.blog_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Blog Tag Mapping Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.blog_tag_map (
    blog_id TEXT REFERENCES public.blogs(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES public.blog_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (blog_id, tag_id)
);

-- Disable Row Level Security or allow full access for server-side service key
ALTER TABLE public.blogs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_tag_map DISABLE ROW LEVEL SECURITY;
