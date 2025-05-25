-- Helper function to create notifications
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_space_id UUID DEFAULT NULL,
    p_invitation_id UUID DEFAULT NULL,
    p_actor_id UUID DEFAULT NULL,
    p_actor_name TEXT DEFAULT NULL,
    p_actor_avatar TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
    v_preferences RECORD;
    v_should_notify BOOLEAN;
BEGIN
    -- Check user notification preferences
    SELECT * INTO v_preferences
    FROM public.notification_preferences
    WHERE user_id = p_user_id;
    
    -- If no preferences exist, create default ones
    IF v_preferences IS NULL THEN
        INSERT INTO public.notification_preferences (user_id)
        VALUES (p_user_id)
        RETURNING * INTO v_preferences;
    END IF;
    
    -- Check if this notification type is enabled
    v_should_notify := CASE p_type
        WHEN 'task_created' THEN v_preferences.task_created
        WHEN 'task_updated' THEN v_preferences.task_updated
        WHEN 'task_deleted' THEN v_preferences.task_deleted
        WHEN 'task_assigned' THEN v_preferences.task_assigned
        WHEN 'task_completed' THEN v_preferences.task_completed
        WHEN 'space_invited' THEN v_preferences.space_invited
        WHEN 'space_joined' THEN v_preferences.space_joined
        WHEN 'comment_added' THEN v_preferences.comment_added
        WHEN 'comment_mentioned' THEN v_preferences.comment_mentioned
        ELSE true
    END;
    
    -- Only create notification if enabled
    IF v_should_notify THEN
        INSERT INTO public.notifications (
            user_id, type, title, message,
            space_id, invitation_id,
            actor_id, actor_name, actor_avatar,
            metadata
        )
        VALUES (
            p_user_id, p_type, p_title, p_message,
            p_space_id, p_invitation_id,
            p_actor_id, p_actor_name, p_actor_avatar,
            p_metadata
        )
        RETURNING id INTO v_notification_id;
        
        RETURN v_notification_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for space invitations
CREATE OR REPLACE FUNCTION handle_invitation_created()
RETURNS TRIGGER AS $$
DECLARE
    v_inviter RECORD;
    v_space RECORD;
    v_invitee_id UUID;
BEGIN
    -- Get inviter details
    SELECT id, raw_user_meta_data->>'full_name' as name, 
           raw_user_meta_data->>'avatar_url' as avatar
    INTO v_inviter
    FROM auth.users
    WHERE id = NEW.inviter_id;
    
    -- Get space details
    SELECT name INTO v_space
    FROM public.spaces
    WHERE id = NEW.space_id;
    
    -- Try to find existing user by email
    SELECT id INTO v_invitee_id
    FROM auth.users
    WHERE email = NEW.email;
    
    -- If user exists, create notification
    IF v_invitee_id IS NOT NULL THEN
        PERFORM create_notification(
            p_user_id := v_invitee_id,
            p_type := 'space_invited',
            p_title := 'New Space Invitation',
            p_message := format('%s invited you to join "%s"', 
                COALESCE(v_inviter.name, 'Someone'), v_space.name),
            p_space_id := NEW.space_id,
            p_invitation_id := NEW.id,
            p_actor_id := NEW.inviter_id,
            p_actor_name := v_inviter.name,
            p_actor_avatar := v_inviter.avatar,
            p_metadata := jsonb_build_object(
                'invitation_token', NEW.token,
                'role', NEW.role
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for invitations
DROP TRIGGER IF EXISTS on_invitation_created ON public.invitations;
CREATE TRIGGER on_invitation_created
    AFTER INSERT ON public.invitations
    FOR EACH ROW
    EXECUTE FUNCTION handle_invitation_created();

-- Trigger for when someone joins a space
CREATE OR REPLACE FUNCTION handle_user_space_joined()
RETURNS TRIGGER AS $$
DECLARE
    v_member RECORD;
    v_space RECORD;
    v_other_member RECORD;
BEGIN
    -- Skip if this is the space creator joining their own space
    SELECT created_by, name INTO v_space
    FROM public.spaces
    WHERE id = NEW.space_id;
    
    IF v_space.created_by = NEW.user_id THEN
        RETURN NEW;
    END IF;
    
    -- Get new member details
    SELECT id, raw_user_meta_data->>'full_name' as name,
           raw_user_meta_data->>'avatar_url' as avatar
    INTO v_member
    FROM auth.users
    WHERE id = NEW.user_id;
    
    -- Notify all other members in the space
    FOR v_other_member IN
        SELECT user_id
        FROM public.user_spaces
        WHERE space_id = NEW.space_id
        AND user_id != NEW.user_id
    LOOP
        PERFORM create_notification(
            p_user_id := v_other_member.user_id,
            p_type := 'space_joined',
            p_title := 'New Member Joined',
            p_message := format('%s joined "%s"',
                COALESCE(v_member.name, 'A new member'), v_space.name),
            p_space_id := NEW.space_id,
            p_actor_id := NEW.user_id,
            p_actor_name := v_member.name,
            p_actor_avatar := v_member.avatar,
            p_metadata := jsonb_build_object(
                'member_role', NEW.role
            )
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user_spaces
DROP TRIGGER IF EXISTS on_user_space_joined ON public.user_spaces;
CREATE TRIGGER on_user_space_joined
    AFTER INSERT ON public.user_spaces
    FOR EACH ROW
    EXECUTE FUNCTION handle_user_space_joined();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
