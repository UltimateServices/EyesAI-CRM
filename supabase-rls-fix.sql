-- Fix: Allow public (visitors) to update conversation status
-- This is needed so visitors can request human support

CREATE POLICY "Allow public to update conversations"
    ON public.chat_conversations
    FOR UPDATE
    USING (true)
    WITH CHECK (true);
