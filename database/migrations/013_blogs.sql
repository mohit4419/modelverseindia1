-- Migration 013: Create blogs table for admin blog posts and articles

CREATE TABLE IF NOT EXISTS public.blogs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Industry Tips',
    summary TEXT,
    content TEXT NOT NULL,
    image_url TEXT,
    author TEXT,
    published_date TEXT,
    author_email TEXT,
    author_role TEXT,
    user_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS author_email TEXT;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS author_role TEXT;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Seed default blogs if empty
INSERT INTO public.blogs (id, title, category, summary, content, image_url, author, published_date)
VALUES 
(
  'b1',
  'How to Build a High-Converting Modeling Portfolio in India',
  'Industry Tips',
  'Essential guidelines for Indian modeling talent to draft a visual portfolio that grabs the immediate attention of major casting agencies and couture directors.',
  'Building a modeling portfolio is your first calling card. In the Indian fashion industry—ranging from high-fashion couture in Delhi or Mumbai to heavy commercial and catalog work—agencies look for versatility and canvas quality.\n\n### 1. The Power of "Polaroids"\nFirst thing first, casting directors want to see your natural face. These are called casting digitals or polaroids. Avoid thick makeup, wear basic, close-fitting clothing (like a black tank top and blue jeans), and shoot in crisp, natural window daylight.\n\n### 2. Diversify Your Looks\nYour portfolio shouldn''t just contain one aesthetic. Showcase traditional Indian wear, western casuals, and high fashion editorial looks.\n\n### 3. Work with Professional Photographers\nInvesting in a reputable fashion photographer who understands agency standards makes a dramatic difference.',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=800&auto=format&fit=crop',
  'Karan Mehra (Inega Director)',
  'Jun 14, 2026'
),
(
  'b2',
  'The Rise of UGC Creators and Influencers in Commercial Modeling',
  'Casting Guides',
  'Why modern lifestyle brands across Bangalore, Mumbai, and Gurgaon are shifting budget shares towards authentic, self-managed user-generated content creators.',
  'The marketing landscape in 2026 has witnessed a massive decentralization of media. Traditional models are expanding their skillset into speaking, script-building, and self-publishing, while authentic UGC creators are gaining runway recognition.',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=800&auto=format&fit=crop',
  'Nisha Sundaram (E-com Casting lead)',
  'Jun 18, 2026'
)
ON CONFLICT (id) DO NOTHING;
