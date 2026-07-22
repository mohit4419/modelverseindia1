-- 002_model_registration.sql
-- Description: Sets up clients, models, and all model-associated sub-entities and attributes with UUID primary keys, normalized relationships, and strict data-integrity constraints.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Master Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE CHECK (char_length(name) > 0),
    description TEXT DEFAULT ''
);

-- Master Skills Table
CREATE TABLE IF NOT EXISTS public.skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE CHECK (char_length(name) > 0),
    "categoryId" UUID REFERENCES public.categories(id) ON DELETE SET NULL
);

-- 1. Clients Table (inherits from users)
-- Note on Identity Strategy: All tables use UUID consistently, linking directly to public.users(id).
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Models Table
CREATE TABLE IF NOT EXISTS public.models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(name) > 0),
    gender TEXT CHECK (gender IN ('Male', 'Female', 'Other', 'Prefer not to say', 'male', 'female', 'non-binary')),
    age INTEGER CHECK (age BETWEEN 1 AND 120),
    height INTEGER CHECK (height BETWEEN 50 AND 300),
    city TEXT NOT NULL CHECK (char_length(trim(city)) > 0),
    state TEXT NOT NULL CHECK (char_length(trim(state)) > 0),
    starting_price NUMERIC(10,2) DEFAULT 15000.00 CHECK (starting_price >= 0.00),
    rating NUMERIC(2,1) DEFAULT 5.0 CHECK (rating >= 0.0 AND rating <= 5.0),
    reviews_count INTEGER DEFAULT 0 CHECK (reviews_count >= 0),
    biography TEXT,
    phone TEXT CHECK (char_length(phone) <= 20),
    email TEXT UNIQUE,
    languages TEXT[] DEFAULT '{}',
    experience TEXT,
    "videoUrl" TEXT,
    "availabilityStatus" TEXT DEFAULT 'Available' CHECK ("availabilityStatus" IN ('Available','Busy','Offline')),
    measurements JSONB DEFAULT '{}'::jsonb,
    chest TEXT,
    waist TEXT,
    hips TEXT,
    "shoeSize" TEXT,
    "eyeColor" TEXT,
    "hairColor" TEXT,
    "skinTone" TEXT,
    "instagramUrl" TEXT CHECK ("instagramUrl" IS NULL OR "instagramUrl" LIKE 'https://%'),
    "isPremium" BOOLEAN DEFAULT FALSE,
    subscription JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Model Media & Portfolio Images
CREATE TABLE IF NOT EXISTS public.model_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
    caption TEXT,
    category TEXT,
    sort_order INTEGER DEFAULT 0 CHECK (sort_order >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT uq_model_media_order UNIQUE (model_id, sort_order)
);

-- Compatibility portfolio_images table for repositories mapping 'portfolio_images'
CREATE TABLE IF NOT EXISTS public.portfolio_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    category TEXT,
    sort_order INTEGER DEFAULT 0 CHECK (sort_order >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT uq_portfolio_images_order UNIQUE (model_id, sort_order)
);

-- 4. Model Documents
CREATE TABLE IF NOT EXISTS public.model_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
    document_name TEXT NOT NULL,
    document_type TEXT NOT NULL CHECK (document_type IN ('Aadhaar', 'PAN', 'Passport', 'Driving License', 'Other')),
    document_url TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Model Social Links
CREATE TABLE IF NOT EXISTS public.model_social_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('Instagram', 'Facebook', 'YouTube', 'LinkedIn', 'Website', 'Twitter')),
    url TEXT NOT NULL CHECK (url LIKE 'https://%'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Model Categories (Relation/Mapping)
CREATE TABLE IF NOT EXISTS public.model_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT uq_model_category UNIQUE (model_id, category_id)
);

-- 7. Model Skills (Relation/Mapping)
CREATE TABLE IF NOT EXISTS public.model_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT uq_model_skill UNIQUE (model_id, skill_id)
);

-- Attach updated_at triggers
DROP TRIGGER IF EXISTS trg_update_models_updated_at ON public.models;
CREATE TRIGGER trg_update_models_updated_at
    BEFORE UPDATE ON public.models
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_clients_updated_at ON public.clients;
CREATE TRIGGER trg_update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indices for registration queries
CREATE INDEX IF NOT EXISTS idx_models_user_id ON public.models("userId");
CREATE INDEX IF NOT EXISTS idx_models_city ON public.models(city);
CREATE INDEX IF NOT EXISTS idx_models_state ON public.models(state);
CREATE INDEX IF NOT EXISTS idx_models_rating ON public.models(rating);
CREATE INDEX IF NOT EXISTS idx_models_price ON public.models(starting_price);
CREATE INDEX IF NOT EXISTS idx_models_premium ON public.models("isPremium");
CREATE INDEX IF NOT EXISTS idx_models_gender ON public.models(gender);
CREATE INDEX IF NOT EXISTS idx_models_age ON public.models(age);
CREATE INDEX IF NOT EXISTS idx_models_availability ON public.models("availabilityStatus");
CREATE INDEX IF NOT EXISTS idx_model_media_model ON public.model_media(model_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_images_model ON public.portfolio_images(model_id);
CREATE INDEX IF NOT EXISTS idx_model_categories_category ON public.model_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_model_skills_skill ON public.model_skills(skill_id);
