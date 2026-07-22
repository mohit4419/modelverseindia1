-- 007_chat.sql
-- Description: Sets up production-grade chat_rooms, chat_messages, chat_attachments, and message_reads tables with UUID consistency, automatic triggers, and proper indices.

-- 1. Chat Rooms Table
CREATE TABLE IF NOT EXISTS public.chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    model_id UUID NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    last_message TEXT,
    last_message_id UUID, -- Will be linked via foreign key after chat_messages is created
    last_message_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Chat Messages Table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'document', 'audio', 'system')),
    content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT chk_message_edit_consistency CHECK ((is_edited = FALSE AND edited_at IS NULL) OR (is_edited = TRUE AND edited_at IS NOT NULL)),
    CONSTRAINT chk_message_delete_consistency CHECK ((is_deleted = FALSE AND deleted_at IS NULL) OR (is_deleted = TRUE AND deleted_at IS NOT NULL)),
    CONSTRAINT chk_content_presence CHECK (char_length(trim(content)) > 0 OR message_type <> 'text')
);

-- 3. Chat Attachments Table
CREATE TABLE IF NOT EXISTS public.chat_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'document', 'audio')),
    file_size BIGINT CHECK (file_size >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Message Reads Table
CREATE TABLE IF NOT EXISTS public.message_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT uq_message_read UNIQUE (message_id, user_id)
);

-- Circular Reference Linking for last_message_id
ALTER TABLE public.chat_rooms
    ADD CONSTRAINT fk_chat_rooms_last_message
    FOREIGN KEY (last_message_id) REFERENCES public.chat_messages(id) ON DELETE SET NULL;

-- Partial Unique Indexes to handle NULL booking_id correctly (PostgreSQL treats NULL as distinct, so UNIQUE constraint fails for multiple NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS uq_chat_room_booking
    ON public.chat_rooms(client_id, model_id, booking_id)
    WHERE booking_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_chat_room_no_booking
    ON public.chat_rooms(client_id, model_id)
    WHERE booking_id IS NULL;

-- Indices for Chat Rooms
CREATE INDEX IF NOT EXISTS idx_chat_rooms_client ON public.chat_rooms(client_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_model ON public.chat_rooms(model_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_booking ON public.chat_rooms(booking_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_last_message_at ON public.chat_rooms(last_message_at);

-- Indices for Chat Messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created_at ON public.chat_messages(room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_active_latest ON public.chat_messages(room_id, is_deleted, created_at DESC);

-- Other Indices
CREATE INDEX IF NOT EXISTS idx_chat_attachments_message ON public.chat_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_message_user ON public.message_reads(message_id, user_id);

-- Trigger to update updated_at on chat_rooms
DROP TRIGGER IF EXISTS trg_update_chat_rooms_updated_at ON public.chat_rooms;
CREATE TRIGGER trg_update_chat_rooms_updated_at
    BEFORE UPDATE ON public.chat_rooms
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to update updated_at on chat_messages
DROP TRIGGER IF EXISTS trg_update_chat_messages_updated_at ON public.chat_messages;
CREATE TRIGGER trg_update_chat_messages_updated_at
    BEFORE UPDATE ON public.chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Aggregation Trigger to automatically recalculate chat_rooms when a message is inserted, updated, or deleted
CREATE OR REPLACE FUNCTION public.recalculate_chat_room_last_message()
RETURNS TRIGGER AS $$
DECLARE
    v_room_id UUID;
    v_latest_msg RECORD;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_room_id := OLD.room_id;
    ELSE
        v_room_id := NEW.room_id;
    END IF;

    -- Find the latest active (non-deleted) message in that room
    SELECT id, content, created_at
    INTO v_latest_msg
    FROM public.chat_messages
    WHERE room_id = v_room_id AND is_deleted = FALSE
    ORDER BY created_at DESC, id DESC
    LIMIT 1;

    IF FOUND THEN
        UPDATE public.chat_rooms
        SET last_message_id = v_latest_msg.id,
            last_message = v_latest_msg.content,
            last_message_at = v_latest_msg.created_at,
            updated_at = now()
        WHERE id = v_room_id;
    ELSE
        UPDATE public.chat_rooms
        SET last_message_id = NULL,
            last_message = NULL,
            last_message_at = NULL,
            updated_at = now()
        WHERE id = v_room_id;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

DROP TRIGGER IF EXISTS trg_recalculate_chat_room_last_message ON public.chat_messages;
CREATE TRIGGER trg_recalculate_chat_room_last_message
    AFTER INSERT OR UPDATE OR DELETE ON public.chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.recalculate_chat_room_last_message();
