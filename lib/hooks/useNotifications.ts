'use client';

import { useState, useEffect, useCallback } from 'react';
import { notificationsClient } from '@/lib/api/notifications/client';
import type { Notification, NotificationType } from '@/lib/types/notifications';

interface UseNotificationsOptions {
  autoSubscribe?: boolean;
  limit?: number;
  type?: NotificationType;
  isRead?: boolean;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 알림 목록 조회
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await notificationsClient.getNotifications({
        limit: options.limit,
        type: options.type,
        isRead: options.isRead
      });
      setNotifications(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [options.limit, options.type, options.isRead]);

  // 읽지 않은 알림 개수 조회
  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await notificationsClient.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, []);

  // 알림 읽음 처리
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationsClient.markAsRead(notificationId);
      
      // 로컬 상태 업데이트
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
      
      // 읽지 않은 개수 감소
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  }, []);

  // 모든 알림 읽음 처리
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsClient.markAllAsRead();
      
      // 로컬 상태 업데이트
      setNotifications(prev => 
        prev.map(n => ({ 
          ...n, 
          is_read: true, 
          read_at: new Date().toISOString() 
        }))
      );
      
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }, []);

  // 알림 삭제
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationsClient.deleteNotification(notificationId);
      
      // 로컬 상태에서 제거
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // 읽지 않은 알림이었다면 카운트 감소
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  }, [notifications]);

  // 일괄 작업 처리
  const bulkAction = useCallback(async (
    notificationIds: string[],
    action: 'read' | 'delete'
  ) => {
    if (notificationIds.length === 0) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('bulk_update_notifications', {
        notification_ids: notificationIds,
        user_id: user.id,
        action
      });

      if (error) throw error;

      if (data && data[0]?.success) {
        if (action === 'read') {
          // 읽음 처리된 알림들 업데이트
          setNotifications(prev => 
            prev.map(n => 
              notificationIds.includes(n.id) 
                ? { ...n, is_read: true } 
                : n
            )
          );
          setUnreadCount(prev => Math.max(0, prev - data[0].affected_count));
        } else if (action === 'delete') {
          // 삭제된 알림들 제거
          setNotifications(prev => 
            prev.filter(n => !notificationIds.includes(n.id))
          );
          // 삭제된 알림 중 읽지 않은 것들 카운트
          const unreadDeleted = notifications.filter(
            n => notificationIds.includes(n.id) && !n.is_read
          ).length;
          setUnreadCount(prev => Math.max(0, prev - unreadDeleted));
        }
        
        return { success: true, affectedCount: data[0].affected_count };
      }
    } catch (err) {
      console.error(`Failed to ${action} notifications:`, err);
      return { success: false, error: err };
    }
  }, [notifications]);

  // 실시간 알림 처리
  const handleNewNotification = useCallback((notification: Notification) => {
    // 새 알림을 목록 맨 앞에 추가
    setNotifications(prev => [notification, ...prev]);
    
    // 읽지 않은 카운트 증가
    if (!notification.is_read) {
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  // 초기 데이터 로드 및 실시간 구독
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    // 실시간 구독 설정
    if (options.autoSubscribe !== false) {
      const unsubscribe = notificationsClient.subscribeToNotifications(handleNewNotification);
      return unsubscribe;
    }
  }, [fetchNotifications, fetchUnreadCount, handleNewNotification, options.autoSubscribe]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    bulkAction,
    refetch: fetchNotifications
  };
}
