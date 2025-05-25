export type NotificationType =
  | 'task_created'
  | 'task_updated'
  | 'task_deleted'
  | 'task_assigned'
  | 'task_completed'
  | 'space_invited'
  | 'space_joined'
  | 'comment_added'
  | 'comment_mentioned';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  space_id: string | null;
  invitation_id: string | null;
  actor_id: string | null;
  actor_name: string | null;
  actor_avatar: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  task_created: boolean;
  task_updated: boolean;
  task_deleted: boolean;
  task_assigned: boolean;
  task_completed: boolean;
  space_invited: boolean;
  space_joined: boolean;
  comment_added: boolean;
  comment_mentioned: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationInput {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  space_id?: string;
  invitation_id?: string;
  actor_id?: string;
  actor_name?: string;
  actor_avatar?: string;
  metadata?: Record<string, any>;
}
