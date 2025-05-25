export type NotificationType = 
  | 'todo_assigned'
  | 'todo_completed'
  | 'todo_updated'
  | 'comment_added'
  | 'space_invited'
  | 'space_member_joined';

export interface NotificationData {
  actor_id?: string;
  actor_name?: string;
  todo_id?: string;
  space_id?: string;
  space_name?: string;
  title?: string;
  comment?: string;
  [key: string]: any;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  data: NotificationData;
  is_read: boolean;
  created_at: string;
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
  sound_enabled: boolean;
  browser_enabled: boolean;
  sound_volume: number;
  created_at: string;
  updated_at: string;
}
