-- 004_payments.sql
-- Description: Sets up the payments, transactions, invoices, refunds, and subscription_payments tables with UUID references, strict naming conventions (snake_case), status checks, and updated_at triggers.

-- Create sequence for invoice numbers
CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq START WITH 1001;

-- 1. Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    amount NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (amount >= 0.00),
    payment_gateway TEXT DEFAULT 'Razorpay' CHECK (payment_gateway IN ('Razorpay', 'Stripe', 'Cash', 'Bank Transfer')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'authorized', 'captured', 'failed', 'cancelled', 'refunded')),
    description TEXT,
    session_id TEXT,
    model_id UUID REFERENCES public.models(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    gateway TEXT NOT NULL DEFAULT 'Razorpay' CHECK (gateway IN ('Razorpay', 'Stripe', 'Cash', 'Bank Transfer')),
    gateway_transaction_id TEXT,
    gateway_order_id TEXT UNIQUE,
    gateway_payment_id TEXT UNIQUE,
    gateway_response JSONB DEFAULT '{}'::jsonb,
    transaction_reference TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'authorized', 'captured', 'failed', 'cancelled', 'refunded')),
    amount NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (amount >= 0.00),
    currency TEXT DEFAULT 'INR' CHECK (currency IN ('INR', 'USD', 'EUR', 'GBP')),
    failure_reason TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL UNIQUE DEFAULT ('INV-' || to_char(CURRENT_DATE, 'YYYY') || '-' || lpad(nextval('public.invoice_number_seq')::text, 6, '0')),
    invoice_url TEXT,
    status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'paid', 'cancelled', 'refunded')),
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Refunds Table
CREATE TABLE IF NOT EXISTS public.refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0.00),
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
    gateway_refund_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Subscription Payments Table
CREATE TABLE IF NOT EXISTS public.subscription_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0.00),
    plan_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
    start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT chk_subscription_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

-- 6. Payment Status History Table
CREATE TABLE IF NOT EXISTS public.payment_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    old_status TEXT CHECK (old_status IS NULL OR old_status IN ('pending', 'authorized', 'captured', 'failed', 'cancelled', 'refunded')),
    new_status TEXT NOT NULL CHECK (new_status IN ('pending', 'authorized', 'captured', 'failed', 'cancelled', 'refunded')),
    changed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Attach updated_at triggers
DROP TRIGGER IF EXISTS trg_update_payments_updated_at ON public.payments;
CREATE TRIGGER trg_update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_transactions_updated_at ON public.transactions;
CREATE TRIGGER trg_update_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_invoices_updated_at ON public.invoices;
CREATE TRIGGER trg_update_invoices_updated_at
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_refunds_updated_at ON public.refunds;
CREATE TRIGGER trg_update_refunds_updated_at
    BEFORE UPDATE ON public.refunds
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_update_subscription_payments_updated_at ON public.subscription_payments;
CREATE TRIGGER trg_update_subscription_payments_updated_at
    BEFORE UPDATE ON public.subscription_payments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indices for rapid querying
CREATE INDEX IF NOT EXISTS idx_payments_booking ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_created ON public.payments(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payment_gateway ON public.payments(payment_gateway);
CREATE INDEX IF NOT EXISTS idx_payment_model ON public.payments(model_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payment ON public.transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_transactions_gateway_payment ON public.transactions(gateway_payment_id);
CREATE INDEX IF NOT EXISTS idx_transaction_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_invoices_booking ON public.invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_invoices_payment ON public.invoices(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_payment ON public.refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_user ON public.subscription_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_status_history_payment ON public.payment_status_history(payment_id);
