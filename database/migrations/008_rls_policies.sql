-- 008_rls_policies.sql
-- Description: Enables Row Level Security (RLS), forces RLS on all tables, and defines secure, production-grade access policies.

-- 1. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

-- 1.1 Force RLS on all tables to ensure no accidental bypass (even for table owners in standard contexts)
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.clients FORCE ROW LEVEL SECURITY;
ALTER TABLE public.models FORCE ROW LEVEL SECURITY;
ALTER TABLE public.model_media FORCE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_images FORCE ROW LEVEL SECURITY;
ALTER TABLE public.model_documents FORCE ROW LEVEL SECURITY;
ALTER TABLE public.model_social_links FORCE ROW LEVEL SECURITY;
ALTER TABLE public.model_categories FORCE ROW LEVEL SECURITY;
ALTER TABLE public.model_skills FORCE ROW LEVEL SECURITY;
ALTER TABLE public.bookings FORCE ROW LEVEL SECURITY;
ALTER TABLE public.booking_status_history FORCE ROW LEVEL SECURITY;
ALTER TABLE public.availability_slots FORCE ROW LEVEL SECURITY;
ALTER TABLE public.favorites FORCE ROW LEVEL SECURITY;
ALTER TABLE public.payments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.reviews FORCE ROW LEVEL SECURITY;
ALTER TABLE public.review_images FORCE ROW LEVEL SECURITY;
ALTER TABLE public.review_reports FORCE ROW LEVEL SECURITY;
ALTER TABLE public.review_votes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.transactions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.invoices FORCE ROW LEVEL SECURITY;
ALTER TABLE public.refunds FORCE ROW LEVEL SECURITY;
ALTER TABLE public.notifications FORCE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences FORCE ROW LEVEL SECURITY;
ALTER TABLE public.device_tokens FORCE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue FORCE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms FORCE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages FORCE ROW LEVEL SECURITY;
ALTER TABLE public.chat_attachments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.message_reads FORCE ROW LEVEL SECURITY;
ALTER TABLE public.categories FORCE ROW LEVEL SECURITY;
ALTER TABLE public.skills FORCE ROW LEVEL SECURITY;

-- 2. Clean Up Existing Policies Dynamically to Prevent Collisions
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- 3. Define Clean, Enterprise-Grade RLS Policies with Consistent snake_case Naming

-- NOTE ON CASE SENSITIVITY:
-- The schema defines models."userId" with camelCase inside double quotes.
-- All policy references to models."userId" must use double quotes to preserve case-sensitivity.

---------------------------------------------------------
-- PUBLIC / SEMI-PUBLIC READ TABLES
---------------------------------------------------------

-- Categories (Public Select, Admin/System Write only)
CREATE POLICY "allow_select_categories" ON public.categories FOR SELECT USING (true);

-- Skills (Public Select, Admin/System Write only)
CREATE POLICY "allow_select_skills" ON public.skills FOR SELECT USING (true);

-- Profiles (Public Select, Owner Write)
CREATE POLICY "allow_select_profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "allow_owner_write_profiles" ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Users (Secure Select: Self, active Models, and booking/chat participants. Owner Write)
CREATE POLICY "allow_select_users" ON public.users FOR SELECT
    USING (
        id = auth.uid()
        OR role = 'model'
        OR EXISTS (
            SELECT 1 FROM public.bookings
            WHERE (client_id = id AND model_id IN (SELECT m.id FROM public.models m WHERE m."userId" = auth.uid()))
            OR (model_id IN (SELECT m.id FROM public.models m WHERE m."userId" = id) AND client_id = auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM public.chat_rooms
            WHERE (client_id = id AND model_id IN (SELECT m.id FROM public.models m WHERE m."userId" = auth.uid()))
            OR (model_id IN (SELECT m.id FROM public.models m WHERE m."userId" = id) AND client_id = auth.uid())
        )
    );

CREATE POLICY "allow_owner_write_users" ON public.users FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Clients Profile (Readable by self, and active models they are booking/chatting with)
CREATE POLICY "allow_participant_select_clients" ON public.clients FOR SELECT
    USING (
        id = auth.uid() 
        OR EXISTS (
            SELECT 1 FROM public.bookings 
            WHERE client_id = id AND model_id IN (SELECT m.id FROM public.models m WHERE m."userId" = auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM public.chat_rooms 
            WHERE client_id = id AND model_id IN (SELECT m.id FROM public.models m WHERE m."userId" = auth.uid())
        )
    );
CREATE POLICY "allow_owner_write_clients" ON public.clients FOR ALL
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Models (Select restricted to Active users only, Owner Write)
CREATE POLICY "allow_select_models" ON public.models FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = "userId" AND u.status = 'active'));

CREATE POLICY "allow_owner_write_models" ON public.models FOR ALL
    USING (auth.uid() = "userId")
    WITH CHECK (auth.uid() = "userId");

-- Model Associated Sub-tables (Select restricted to Active users only, Owner Write)
CREATE POLICY "allow_select_model_media" ON public.model_media FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.models m JOIN public.users u ON u.id = m."userId" WHERE m.id = model_id AND u.status = 'active'));

CREATE POLICY "allow_owner_write_model_media" ON public.model_media FOR ALL
    USING (model_id IN (SELECT id FROM public.models WHERE "userId" = auth.uid()))
    WITH CHECK (model_id IN (SELECT id FROM public.models WHERE "userId" = auth.uid()));

CREATE POLICY "allow_select_portfolio_images" ON public.portfolio_images FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.models m JOIN public.users u ON u.id = m."userId" WHERE m.id = model_id AND u.status = 'active'));

CREATE POLICY "allow_owner_write_portfolio_images" ON public.portfolio_images FOR ALL
    USING (model_id IN (SELECT id FROM public.models WHERE "userId" = auth.uid()))
    WITH CHECK (model_id IN (SELECT id FROM public.models WHERE "userId" = auth.uid()));

CREATE POLICY "allow_select_model_social_links" ON public.model_social_links FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.models m JOIN public.users u ON u.id = m."userId" WHERE m.id = model_id AND u.status = 'active'));

CREATE POLICY "allow_owner_write_model_social_links" ON public.model_social_links FOR ALL
    USING (model_id IN (SELECT id FROM public.models WHERE "userId" = auth.uid()))
    WITH CHECK (model_id IN (SELECT id FROM public.models WHERE "userId" = auth.uid()));

CREATE POLICY "allow_select_model_categories" ON public.model_categories FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.models m JOIN public.users u ON u.id = m."userId" WHERE m.id = model_id AND u.status = 'active'));

CREATE POLICY "allow_owner_write_model_categories" ON public.model_categories FOR ALL
    USING (model_id IN (SELECT id FROM public.models WHERE "userId" = auth.uid()))
    WITH CHECK (model_id IN (SELECT id FROM public.models WHERE "userId" = auth.uid()));

CREATE POLICY "allow_select_model_skills" ON public.model_skills FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.models m JOIN public.users u ON u.id = m."userId" WHERE m.id = model_id AND u.status = 'active'));

CREATE POLICY "allow_owner_write_model_skills" ON public.model_skills FOR ALL
    USING (model_id IN (SELECT id FROM public.models WHERE "userId" = auth.uid()))
    WITH CHECK (model_id IN (SELECT id FROM public.models WHERE "userId" = auth.uid()));

-- Model Documents (Owner Select/Write, Admins/System via service_role)
CREATE POLICY "allow_select_model_documents" ON public.model_documents FOR SELECT
    USING (model_id IN (SELECT id FROM public.models WHERE "userId" = auth.uid()));
CREATE POLICY "allow_owner_write_model_documents" ON public.model_documents FOR ALL
    USING (model_id IN (SELECT id FROM public.models WHERE "userId" = auth.uid()))
    WITH CHECK (model_id IN (SELECT id FROM public.models WHERE "userId" = auth.uid()));

-- Model Availability Slots (Select restricted to Active users only, Owner Write)
CREATE POLICY "allow_select_availability_slots" ON public.availability_slots FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.models m JOIN public.users u ON u.id = m."userId" WHERE m.id = model_id AND u.status = 'active'));

CREATE POLICY "allow_owner_write_availability_slots" ON public.availability_slots FOR ALL
    USING (model_id IN (SELECT id FROM public.models WHERE "userId" = auth.uid()))
    WITH CHECK (model_id IN (SELECT id FROM public.models WHERE "userId" = auth.uid()));


---------------------------------------------------------
-- OWNER & PARTICIPANT SECURED TABLES
---------------------------------------------------------

-- Bookings (Readable and writeable by participating client/model only)
CREATE POLICY "allow_select_bookings" ON public.bookings FOR SELECT
    USING (client_id = auth.uid() OR model_id IN (SELECT id FROM public.models WHERE "userId" = auth.uid()));

CREATE POLICY "allow_insert_bookings" ON public.bookings FOR INSERT
    WITH CHECK (client_id = auth.uid());

CREATE POLICY "allow_update_bookings" ON public.bookings FOR UPDATE
    USING (client_id = auth.uid() OR model_id IN (SELECT id FROM public.models WHERE "userId" = auth.uid()))
    WITH CHECK (client_id = auth.uid() OR model_id IN (SELECT id FROM public.models WHERE "userId" = auth.uid()));

CREATE POLICY "allow_delete_bookings" ON public.bookings FOR DELETE
    USING (client_id = auth.uid() OR model_id IN (SELECT id FROM public.models WHERE "userId" = auth.uid()));

-- Booking Status History (Readable by participating client/model. No direct client/model writes—strictly trigger/service_role managed)
CREATE POLICY "allow_select_booking_status_history" ON public.booking_status_history FOR SELECT
    USING (booking_id IN (SELECT id FROM public.bookings WHERE client_id = auth.uid() OR model_id IN (SELECT id FROM public.models WHERE "userId" = auth.uid())));

-- Favorites (Readable/Writable by owning Client only)
CREATE POLICY "allow_select_favorites" ON public.favorites FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "allow_owner_write_favorites" ON public.favorites FOR ALL
    USING (client_id = auth.uid())
    WITH CHECK (client_id = auth.uid());

-- Reviews (Public view if approved/hidden, participants/owner can manage, no deletion client-side)
CREATE POLICY "allow_select_reviews" ON public.reviews FOR SELECT
    USING ((is_approved = TRUE AND is_hidden = FALSE) OR client_id = auth.uid() OR model_id IN (SELECT id FROM public.models WHERE "userId" = auth.uid()));

CREATE POLICY "allow_insert_reviews" ON public.reviews FOR INSERT
    WITH CHECK (client_id = auth.uid());

CREATE POLICY "allow_update_reviews" ON public.reviews FOR UPDATE
    USING (client_id = auth.uid())
    WITH CHECK (client_id = auth.uid());

-- Review Images (Select if parent review visible, write if review owner, no deletion client-side)
CREATE POLICY "allow_select_review_images" ON public.review_images FOR SELECT
    USING (review_id IN (SELECT id FROM public.reviews WHERE (is_approved = TRUE AND is_hidden = FALSE) OR client_id = auth.uid() OR model_id IN (SELECT id FROM public.models WHERE "userId" = auth.uid())));

CREATE POLICY "allow_insert_review_images" ON public.review_images FOR INSERT
    WITH CHECK (review_id IN (SELECT id FROM public.reviews WHERE client_id = auth.uid()));

CREATE POLICY "allow_update_review_images" ON public.review_images FOR UPDATE
    USING (review_id IN (SELECT id FROM public.reviews WHERE client_id = auth.uid()))
    WITH CHECK (review_id IN (SELECT id FROM public.reviews WHERE client_id = auth.uid()));

-- Review Reports (Select/Insert by reporter, Admin/service_role manages)
CREATE POLICY "allow_select_review_reports" ON public.review_reports FOR SELECT USING (reported_by = auth.uid());
CREATE POLICY "allow_insert_review_reports" ON public.review_reports FOR INSERT WITH CHECK (reported_by = auth.uid());

-- Review Votes (Public read, owner manages vote)
CREATE POLICY "allow_select_review_votes" ON public.review_votes FOR SELECT USING (true);
CREATE POLICY "allow_owner_write_review_votes" ON public.review_votes FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());


---------------------------------------------------------
-- PAYMENTS, TRANSACTIONS & SERVICE ROLE SECURED TABLES
---------------------------------------------------------

-- Payments (Readable by user/model owner, INSERT for user, NO client-side update/delete)
CREATE POLICY "allow_select_payments" ON public.payments FOR SELECT
    USING (user_id = auth.uid() OR model_id IN (SELECT id FROM public.models WHERE "userId" = auth.uid()));

CREATE POLICY "allow_insert_payments" ON public.payments FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Transactions (Readable by payment participant owner, no client-side write/modify)
CREATE POLICY "allow_select_transactions" ON public.transactions FOR SELECT
    USING (payment_id IN (SELECT id FROM public.payments WHERE user_id = auth.uid() OR model_id IN (SELECT id FROM public.models WHERE "userId" = auth.uid())));

-- Invoices (Readable by payment participant owner, no client-side write/modify)
CREATE POLICY "allow_select_invoices" ON public.invoices FOR SELECT
    USING (payment_id IN (SELECT id FROM public.payments WHERE user_id = auth.uid() OR model_id IN (SELECT id FROM public.models WHERE "userId" = auth.uid())));

-- Refunds (Readable by payment participant owner, no client-side write/modify)
CREATE POLICY "allow_select_refunds" ON public.refunds FOR SELECT
    USING (payment_id IN (SELECT id FROM public.payments WHERE user_id = auth.uid() OR model_id IN (SELECT id FROM public.models WHERE "userId" = auth.uid())));


---------------------------------------------------------
-- SYSTEM & USER SCUTTLE / NOTIFICATION TABLES
---------------------------------------------------------

-- Notifications (Owner only can SELECT or UPDATE, no direct client INSERT or DELETE)
CREATE POLICY "allow_select_notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "allow_update_notifications" ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Notification Preferences (Owner only)
CREATE POLICY "allow_select_notification_preferences" ON public.notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "allow_owner_write_notification_preferences" ON public.notification_preferences FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Device Tokens (Owner only)
CREATE POLICY "allow_select_device_tokens" ON public.device_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "allow_owner_write_device_tokens" ON public.device_tokens FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Email Queue (Service Role Only - No public policies)

-- Audit Logs (Owner can SELECT and INSERT, strictly immutable—No UPDATE/DELETE allowed)
CREATE POLICY "allow_select_audit_logs" ON public.audit_logs FOR SELECT USING (auth.uid() = performed_by);
CREATE POLICY "allow_insert_audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() = performed_by);


---------------------------------------------------------
-- SECURED CHAT TABLES
---------------------------------------------------------

-- Chat Rooms
CREATE POLICY "allow_select_chat_rooms" ON public.chat_rooms FOR SELECT
    USING (auth.uid() = client_id OR EXISTS (SELECT 1 FROM public.models WHERE id = model_id AND "userId" = auth.uid()));

CREATE POLICY "allow_owner_write_chat_rooms" ON public.chat_rooms FOR ALL
    USING (auth.uid() = client_id OR EXISTS (SELECT 1 FROM public.models WHERE id = model_id AND "userId" = auth.uid()))
    WITH CHECK (auth.uid() = client_id OR EXISTS (SELECT 1 FROM public.models WHERE id = model_id AND "userId" = auth.uid()));

-- Chat Messages
CREATE POLICY "allow_select_chat_messages" ON public.chat_messages FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.chat_rooms
        WHERE id = room_id AND (client_id = auth.uid() OR EXISTS (SELECT 1 FROM public.models WHERE id = model_id AND "userId" = auth.uid()))
    ));

CREATE POLICY "allow_owner_write_chat_messages" ON public.chat_messages FOR ALL
    USING (auth.uid() = sender_id AND EXISTS (
        SELECT 1 FROM public.chat_rooms
        WHERE id = room_id AND (client_id = auth.uid() OR EXISTS (SELECT 1 FROM public.models WHERE id = model_id AND "userId" = auth.uid()))
    ))
    WITH CHECK (auth.uid() = sender_id AND EXISTS (
        SELECT 1 FROM public.chat_rooms
        WHERE id = room_id AND (client_id = auth.uid() OR EXISTS (SELECT 1 FROM public.models WHERE id = model_id AND "userId" = auth.uid()))
    ));

-- Chat Attachments
CREATE POLICY "allow_select_chat_attachments" ON public.chat_attachments FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.chat_messages
        JOIN public.chat_rooms ON chat_rooms.id = chat_messages.room_id
        WHERE chat_messages.id = message_id AND (chat_rooms.client_id = auth.uid() OR EXISTS (SELECT 1 FROM public.models WHERE id = chat_rooms.model_id AND "userId" = auth.uid()))
    ));

CREATE POLICY "allow_owner_write_chat_attachments" ON public.chat_attachments FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.chat_messages
        JOIN public.chat_rooms ON chat_rooms.id = chat_messages.room_id
        WHERE chat_messages.id = message_id AND chat_messages.sender_id = auth.uid() AND (chat_rooms.client_id = auth.uid() OR EXISTS (SELECT 1 FROM public.models WHERE id = chat_rooms.model_id AND "userId" = auth.uid()))
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.chat_messages
        JOIN public.chat_rooms ON chat_rooms.id = chat_messages.room_id
        WHERE chat_messages.id = message_id AND chat_messages.sender_id = auth.uid() AND (chat_rooms.client_id = auth.uid() OR EXISTS (SELECT 1 FROM public.models WHERE id = chat_rooms.model_id AND "userId" = auth.uid()))
    ));

-- Message Reads
CREATE POLICY "allow_select_message_reads" ON public.message_reads FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.chat_messages
        JOIN public.chat_rooms ON chat_rooms.id = chat_messages.room_id
        WHERE chat_messages.id = message_id AND (chat_rooms.client_id = auth.uid() OR EXISTS (SELECT 1 FROM public.models WHERE id = chat_rooms.model_id AND "userId" = auth.uid()))
    ));

CREATE POLICY "allow_owner_write_message_reads" ON public.message_reads FOR ALL
    USING (auth.uid() = user_id AND EXISTS (
        SELECT 1 FROM public.chat_messages
        JOIN public.chat_rooms ON chat_rooms.id = chat_messages.room_id
        WHERE chat_messages.id = message_id AND (chat_rooms.client_id = auth.uid() OR EXISTS (SELECT 1 FROM public.models WHERE id = chat_rooms.model_id AND "userId" = auth.uid()))
    ))
    WITH CHECK (auth.uid() = user_id AND EXISTS (
        SELECT 1 FROM public.chat_messages
        JOIN public.chat_rooms ON chat_rooms.id = chat_messages.room_id
        WHERE chat_messages.id = message_id AND (chat_rooms.client_id = auth.uid() OR EXISTS (SELECT 1 FROM public.models WHERE id = chat_rooms.model_id AND "userId" = auth.uid()))
    ));
