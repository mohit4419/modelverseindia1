-- 005_reviews.sql
-- Description: Sets up the public.reviews, review_images, review_reports, and review_votes tables with UUID references, proper constraints, and updated_at triggers.

-- 1. Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    client_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    model_id UUID NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
    rating NUMERIC(2,1) NOT NULL CHECK (rating BETWEEN 1.0 AND 5.0),
    review TEXT NOT NULL CHECK (char_length(trim(review)) > 0),
    is_approved BOOLEAN DEFAULT TRUE,
    is_hidden BOOLEAN DEFAULT FALSE,
    moderated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    moderation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Unique constraint for reviews with a booking
CREATE UNIQUE INDEX IF NOT EXISTS uq_review_booking 
    ON public.reviews(client_id, booking_id) 
    WHERE booking_id IS NOT NULL;

-- Unique constraint for reviews without a booking (max 1 review per model per client)
CREATE UNIQUE INDEX IF NOT EXISTS uq_review_model_no_booking 
    ON public.reviews(client_id, model_id) 
    WHERE booking_id IS NULL;

-- 2. Review Images Table
CREATE TABLE IF NOT EXISTS public.review_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    sort_order INTEGER DEFAULT 0 CHECK (sort_order >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Review Reports Table
CREATE TABLE IF NOT EXISTS public.review_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
    reported_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL CHECK (reason IN ('Spam', 'Abusive', 'Fake Review', 'Harassment', 'Other')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigated', 'dismissed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Unique index to prevent duplicate reporting of a single review by the same user
CREATE UNIQUE INDEX IF NOT EXISTS uq_review_reports_once 
    ON public.review_reports(review_id, reported_by);

-- 4. Review Votes Table (Helpful Votes)
CREATE TABLE IF NOT EXISTS public.review_votes (
    review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    is_helpful BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (review_id, user_id)
);

-- Attach updated_at triggers
DROP TRIGGER IF EXISTS trg_update_reviews_updated_at ON public.reviews;
CREATE TRIGGER trg_update_reviews_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Reusable helper function to recalculate rating stats for a given model
CREATE OR REPLACE FUNCTION public.fn_recalculate_model_stats(p_model_id UUID)
RETURNS VOID AS $$
DECLARE
    v_avg_rating NUMERIC(2,1);
    v_count INTEGER;
BEGIN
    -- Calculate average rating and count of active, approved, non-hidden reviews
    SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 5.0), COUNT(*)
    INTO v_avg_rating, v_count
    FROM public.reviews
    WHERE model_id = p_model_id AND is_approved = TRUE AND is_hidden = FALSE;

    -- Update models record
    UPDATE public.models
    SET rating = v_avg_rating,
        reviews_count = v_count
    WHERE id = p_model_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for automatic rating aggregation on the public.models table
CREATE OR REPLACE FUNCTION public.fn_sync_model_review_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM public.fn_recalculate_model_stats(OLD.model_id);
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle potential change of model_id during an update
        IF OLD.model_id <> NEW.model_id THEN
            PERFORM public.fn_recalculate_model_stats(OLD.model_id);
        END IF;
        PERFORM public.fn_recalculate_model_stats(NEW.model_id);
    ELSE
        -- INSERT cases
        PERFORM public.fn_recalculate_model_stats(NEW.model_id);
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_model_reviews ON public.reviews;
CREATE TRIGGER trg_sync_model_reviews
    AFTER INSERT OR UPDATE OR DELETE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.fn_sync_model_review_stats();

-- Indices for rapid querying
CREATE INDEX IF NOT EXISTS idx_reviews_booking ON public.reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_client ON public.reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_reviews_model ON public.reviews(model_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON public.reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON public.reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_hidden ON public.reviews(is_hidden);

-- High-performance composite index for aggregation queries
CREATE INDEX IF NOT EXISTS idx_reviews_model_approved_hidden ON public.reviews(model_id, is_approved, is_hidden);

CREATE INDEX IF NOT EXISTS idx_review_images_review ON public.review_images(review_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_review ON public.review_reports(review_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_status ON public.review_reports(status);
CREATE INDEX IF NOT EXISTS idx_review_votes_review ON public.review_votes(review_id);
