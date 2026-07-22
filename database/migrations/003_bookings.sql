-- 003_bookings.sql
-- Description: Sets up public.bookings and public.favorites tables with UUID foreign keys for clients and models, and adds advanced booking features, status history tracking, and model availability slot management.

-- Create sequence for booking numbers
CREATE SEQUENCE IF NOT EXISTS public.booking_number_seq START WITH 1001;

-- 1. Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_number TEXT NOT NULL UNIQUE DEFAULT ('MV-' || to_char(CURRENT_DATE, 'YYYY') || '-' || lpad(nextval('public.booking_number_seq')::text, 6, '0')),
    client_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    model_id UUID NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
    project_title TEXT NOT NULL DEFAULT 'Untitled Project' CHECK (char_length(trim(project_title)) > 0),
    project_type TEXT CHECK (project_type IS NULL OR project_type IN ('Fashion', 'Commercial', 'Editorial', 'Runway', 'Wedding', 'Event', 'Promotion', 'Other')),
    event_type TEXT CHECK (event_type IS NULL OR event_type IN ('Shoot', 'Catwalk', 'Fitting', 'Casting', 'Workshop', 'Conference', 'Exhibition', 'Other')),
    booking_date DATE DEFAULT CURRENT_DATE,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TIME DEFAULT '09:00:00',
    end_time TIME DEFAULT '18:00:00',
    number_of_models INTEGER DEFAULT 1 CHECK (number_of_models >= 1),
    location TEXT,
    amount NUMERIC(10,2) DEFAULT 0.00 CHECK (amount >= 0.00),
    payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partially_paid', 'paid', 'refunded')),
    advance_amount NUMERIC(10,2) DEFAULT 0.00 CHECK (advance_amount >= 0.00),
    special_requirements TEXT,
    client_notes TEXT,
    model_notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'accepted', 'rejected', 'confirmed', 'completed', 'cancelled')
    ),
    project_details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT chk_booking_dates CHECK (end_date >= start_date),
    CONSTRAINT chk_booking_times CHECK (end_time > start_time),
    CONSTRAINT chk_booking_advance CHECK (advance_amount <= amount)
);

-- 2. Favorites Table
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    model_id UUID NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT uq_user_favorite UNIQUE (client_id, model_id)
);

-- 3. Booking Status History Table
CREATE TABLE IF NOT EXISTS public.booking_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    old_status TEXT CHECK (old_status IS NULL OR old_status IN ('pending', 'accepted', 'rejected', 'confirmed', 'completed', 'cancelled')),
    new_status TEXT NOT NULL CHECK (new_status IN ('pending', 'accepted', 'rejected', 'confirmed', 'completed', 'cancelled')),
    changed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Availability Slots Table
CREATE TABLE IF NOT EXISTS public.availability_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT uq_model_availability_slot UNIQUE (model_id, date, start_time, end_time),
    CONSTRAINT chk_slot_times CHECK (end_time > start_time)
);

-- Attach updated_at triggers
DROP TRIGGER IF EXISTS trg_update_bookings_updated_at ON public.bookings;
CREATE TRIGGER trg_update_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_availability_slots_updated_at ON public.availability_slots;
CREATE TRIGGER trg_update_availability_slots_updated_at
    BEFORE UPDATE ON public.availability_slots
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indices for rapid querying
CREATE INDEX IF NOT EXISTS idx_bookings_client ON public.bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_model ON public.bookings(model_id);
CREATE INDEX IF NOT EXISTS idx_favorites_client ON public.favorites(client_id);
CREATE INDEX IF NOT EXISTS idx_booking_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_booking_start_date ON public.bookings(start_date);
CREATE INDEX IF NOT EXISTS idx_booking_end_date ON public.bookings(end_date);
CREATE INDEX IF NOT EXISTS idx_booking_created ON public.bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_booking_status_history_booking ON public.booking_status_history(booking_id);
CREATE INDEX IF NOT EXISTS idx_availability_slots_model_date ON public.availability_slots(model_id, date);
CREATE INDEX IF NOT EXISTS idx_booking_payment_status ON public.bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_booking_number ON public.bookings(booking_number);
CREATE INDEX IF NOT EXISTS idx_favorites_model ON public.favorites(model_id);
CREATE INDEX IF NOT EXISTS idx_favorites_client_model ON public.favorites(client_id, model_id);
CREATE INDEX IF NOT EXISTS idx_availability_status ON public.availability_slots(status);
