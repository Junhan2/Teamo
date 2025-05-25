'use client';

import { useState, useEffect, useCallback } from 'react';
import { notificationsClient } from '@/lib/api/notifications/client';
import type { NotificationPreferences } from '@/lib/types/notifications';

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 알림 설정 조회
  const fetchPreferences = useCallback(async () => {
    try {
      setLoading(true);
      const data = await notificationsClient.getPreferences();
      setPreferences(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 알림 설정 업데이트
  const updatePreferences = useCallback(async (updates: Partial<NotificationPreferences>) => {
    try {
      await notificationsClient.updatePreferences(updates);
      
      // 로컬 상태 업데이트
      setPreferences(prev => prev ? { ...prev, ...updates } : null);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  // 특정 알림 타입 토글
  const toggleNotificationType = useCallback(async (type: keyof NotificationPreferences) => {
    if (!preferences || typeof preferences[type] !== 'boolean') return;
    
    const newValue = !preferences[type];
    await updatePreferences({ [type]: newValue });
  }, [preferences, updatePreferences]);

  // 초기 데이터 로드
  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    toggleNotificationType,
    refetch: fetchPreferences
  };
}
