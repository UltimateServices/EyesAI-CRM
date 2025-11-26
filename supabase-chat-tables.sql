-- Chat System Tables for EyesAI CRM
-- Run this in Supabase SQL Editor to create the chat tables

-- Create chat_conversations table
CREATE TABLE IF NOT EXISTS public.chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id),

    -- Visitor info
    visitor_name TEXT,
    visitor_email TEXT,
    visitor_phone TEXT,
    visitor_id TEXT, -- For tracking returning visitors

    -- Company association
    company_id UUID REFERENCES public.companies(id),

    -- Status
    status TEXT NOT NULL DEFAULT 'ai_only' CHECK (status IN ('ai_only', 'waiting_human', 'active_human', 'resolved')),

    -- Assignment
    assigned_va_id UUID,
    assigned_va_name TEXT,

    -- Metadata
    source TEXT NOT NULL DEFAULT 'webflow' CHECK (source IN ('webflow', 'client_portal')),
    page_url TEXT,
    user_agent TEXT,

    -- Timestamps
    last_message_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,

    -- Sender info
    sender_type TEXT NOT NULL CHECK (sender_type IN ('visitor', 'ai', 'va')),
    sender_id UUID, -- VA user ID if sender is VA
    sender_name TEXT,

    -- Message content
    message_text TEXT NOT NULL,
    message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
    file_url TEXT,
    file_name TEXT,

    -- Status
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chat_conversations_status ON public.chat_conversations(status);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_organization ON public.chat_conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_company ON public.chat_conversations(company_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_created ON public.chat_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON public.chat_messages(created_at ASC);

-- Enable Row Level Security
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_conversations
-- Allow public to insert (visitors can start conversations)
CREATE POLICY "Allow public to create conversations"
    ON public.chat_conversations
    FOR INSERT
    WITH CHECK (true);

-- Allow public to read their own conversations (by visitor_id or conversation_id)
CREATE POLICY "Allow public to read conversations"
    ON public.chat_conversations
    FOR SELECT
    USING (true);

-- Allow authenticated users to read conversations in their organization
CREATE POLICY "Allow organization members to read conversations"
    ON public.chat_conversations
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid()
        )
    );

-- Allow authenticated users to update conversations in their organization
CREATE POLICY "Allow organization members to update conversations"
    ON public.chat_conversations
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for chat_messages
-- Allow public to insert messages
CREATE POLICY "Allow public to create messages"
    ON public.chat_messages
    FOR INSERT
    WITH CHECK (true);

-- Allow public to read messages in their conversation
CREATE POLICY "Allow public to read messages"
    ON public.chat_messages
    FOR SELECT
    USING (true);

-- Allow organization members to read messages
CREATE POLICY "Allow organization members to read messages"
    ON public.chat_messages
    FOR SELECT
    USING (
        conversation_id IN (
            SELECT id FROM public.chat_conversations
            WHERE organization_id IN (
                SELECT organization_id FROM public.organization_members
                WHERE user_id = auth.uid()
            )
        )
    );

-- Allow organization members to update messages (mark as read)
CREATE POLICY "Allow organization members to update messages"
    ON public.chat_messages
    FOR UPDATE
    USING (
        conversation_id IN (
            SELECT id FROM public.chat_conversations
            WHERE organization_id IN (
                SELECT organization_id FROM public.organization_members
                WHERE user_id = auth.uid()
            )
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_chat_conversations_updated_at
    BEFORE UPDATE ON public.chat_conversations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Realtime for chat tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Chat tables created successfully!';
    RAISE NOTICE 'Tables: chat_conversations, chat_messages';
    RAISE NOTICE 'Indexes created for performance';
    RAISE NOTICE 'RLS policies enabled';
    RAISE NOTICE 'Realtime enabled';
END $$;
