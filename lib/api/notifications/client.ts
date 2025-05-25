import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { 
  Notification, 
  NotificationPreferences,
  NotificationType 
} from '@/lib/types/notifications';
import { RealtimeChannel } from '@supabase/supabase-js';

export class NotificationsClient {
  private supabase = createClientComponentClient();
  private realtimeChannel: RealtimeChannel | null = null;

  // 알림 목록 조회
  async getNotifications(options?: {
    limit?: number;
    offset?: number;
    isRead?: boolean;
    type?: NotificationType;
  }) {
    let query = this.supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    if (options?.isRead !== undefined) {
      query = query.eq('is_read', options.isRead);
    }

    if (options?.type) {
      query = query.eq('type', options.type);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as Notification[];
  }

  // 읽지 않은 알림 개수 조회
  async getUnreadCount(): Promise<number> {
    const { data, error } = await this.supabase
      .rpc('get_unread_notification_count');

    if (error) throw error;
    return data || 0;
  }

  // 알림 읽음 처리
  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await this.supabase
      .rpc('mark_notification_read', { notification_id: notificationId });

    if (error) throw error;
  }

  // 모든 알림 읽음 처리
  async markAllAsRead(): Promise<void> {
    const { error } = await this.supabase
      .rpc('mark_all_notifications_read');

    if (error) throw error;
  }

  // 알림 삭제
  async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  }

  // 알림 설정 조회
  async getPreferences(): Promise<NotificationPreferences | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await this.supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // 알림 설정 업데이트
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await this.supabase
      .from('notification_preferences')
      .upsert({
        user_id: user.id,
        ...preferences,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  // 실시간 알림 구독
  subscribeToNotifications(callback: (notification: Notification) => void): () => void {
    this.supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      // 이전 채널이 있으면 구독 해제
      if (this.realtimeChannel) {
        this.supabase.removeChannel(this.realtimeChannel);
      }

      // 새 채널 생성 및 구독
      this.realtimeChannel = this.supabase
        .channel(`notifications:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            callback(payload.new as Notification);
          }
        )
        .subscribe();
    });

    // 구독 해제 함수 반환
    return () => {
      if (this.realtimeChannel) {
        this.supabase.removeChannel(this.realtimeChannel);
        this.realtimeChannel = null;
      }
    };
  }
}

// 싱글톤 인스턴스
export const notificationsClient = new NotificationsClient();
