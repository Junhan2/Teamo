-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('task_created', 'task_updated', 'task_deleted', 'task_assigned', 'task_completed', 'space_invited', 'space_joined', 'comment_added', 'comment_mentioned')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    -- Related entities
    space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    invitation_id UUID REFERENCES public.invitations(id) ON DELETE CASCADE,
    -- Actor information (who triggered the notification)
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_name TEXT,
    actor_avatar TEXT,
    -- Additional metadata
    metadata JSONB DEFAULT '{}',
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
    ON public.notifications
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
    ON public.notifications
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
    ON public.notifications
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- System can insert notifications for any user
CREATE POLICY "System can insert notifications"
    ON public.notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Create notification_preferences table for user settings
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Notification type preferences
    task_created BOOLEAN DEFAULT true,
    task_updated BOOLEAN DEFAULT true,
    task_deleted BOOLEAN DEFAULT true,
    task_assigned BOOLEAN DEFAULT true,
    task_completed BOOLEAN DEFAULT true,
    space_invited BOOLEAN DEFAULT true,
    space_joined BOOLEAN DEFAULT true,
    comment_added BOOLEAN DEFAULT true,
    comment_mentioned BOOLEAN DEFAULT true,
    -- Delivery preferences (for future use)
    email_enabled BOOLEAN DEFAULT false,
    push_enabled BOOLEAN DEFAULT false,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    -- Ensure one preference per user
    UNIQUE(user_id)
);

-- Enable RLS on notification_preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_preferences
-- Users can view their own preferences
CREATE POLICY "Users can view own notification preferences"
    ON public.notification_preferences
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own notification preferences"
    ON public.notification_preferences
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own notification preferences"
    ON public.notification_preferences
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own preferences
CREATE POLICY "Users can delete own notification preferences"
    ON public.notification_preferences
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.notifications
    SET is_read = true, read_at = now(), updated_at = now()
    WHERE id = notification_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS void AS $$
BEGIN
    UPDATE public.notifications
    SET is_read = true, read_at = now(), updated_at = now()
    WHERE user_id = auth.uid() AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS integer AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM public.notifications
        WHERE user_id = auth.uid() AND is_read = false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old notifications (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM public.notifications
    WHERE created_at < now() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.notification_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count TO authenticated;
