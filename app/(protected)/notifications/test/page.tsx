'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Volume2, Monitor, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { notificationsClient } from '@/lib/api/notifications/client';
import { useNotificationPreferences } from '@/lib/hooks/useNotificationPreferences';
import { playNotificationSound, showBrowserNotification, requestNotificationPermission } from '@/lib/utils/notification-sound';
import type { Notification } from '@/lib/types/notifications';

export default function NotificationTestPage() {
  const router = useRouter();
  const { preferences } = useNotificationPreferences();
  const [testing, setTesting] = useState(false);

  const handleBack = () => {
    router.push('/notifications');
  };

  // 사운드 테스트
  const testSound = async () => {
    if (!preferences?.sound_enabled) {
      toast.error('알림 사운드가 비활성화되어 있습니다. 설정에서 활성화해주세요.');
      return;
    }

    try {
      await playNotificationSound(preferences.sound_volume);
      toast.success('알림 사운드가 재생되었습니다.');
    } catch (error) {
      toast.error('사운드 재생에 실패했습니다.');
    }
  };

  // 브라우저 알림 테스트
  const testBrowserNotification = async () => {
    if (!preferences?.browser_enabled) {
      toast.error('브라우저 알림이 비활성화되어 있습니다. 설정에서 활성화해주세요.');
      return;
    }

    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      toast.error('브라우저 알림 권한이 거부되었습니다.');
      return;
    }

    // 테스트 알림 생성
    const testNotification: Notification = {
      id: 'test-' + Date.now(),
      user_id: 'test-user',
      type: 'todo_assigned',
      data: {
        actor_name: '테스트 사용자',
        title: '테스트 할일',
        todo_id: 'test-todo'
      },
      is_read: false,
      created_at: new Date().toISOString()
    };

    try {
      await showBrowserNotification(testNotification);
      toast.success('브라우저 알림이 표시되었습니다.');
    } catch (error) {
      toast.error('브라우저 알림 표시에 실패했습니다.');
    }
  };

  // 전체 알림 테스트 (서버에서 실제 알림 생성)
  const testFullNotification = async () => {
    setTesting(true);
    try {
      await notificationsClient.createTestNotification();
      toast.success('테스트 알림이 생성되었습니다. 잠시 후 알림이 표시됩니다.');
    } catch (error) {
      toast.error('테스트 알림 생성에 실패했습니다.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-6 px-4">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          알림으로 돌아가기
        </Button>
        
        <h1 className="text-2xl font-bold">알림 테스트</h1>
        <p className="text-muted-foreground mt-1">
          알림 기능이 정상적으로 작동하는지 테스트해보세요
        </p>
      </div>

      <div className="space-y-4">
        {/* 사운드 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              사운드 테스트
            </CardTitle>
            <CardDescription>
              알림 사운드가 정상적으로 재생되는지 확인합니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={testSound} variant="outline">
              사운드 재생
            </Button>
            {preferences?.sound_enabled === false && (
              <p className="text-sm text-muted-foreground mt-2">
                알림 사운드가 비활성화되어 있습니다.
              </p>
            )}
          </CardContent>
        </Card>

        {/* 브라우저 알림 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              브라우저 알림 테스트
            </CardTitle>
            <CardDescription>
              브라우저 알림이 정상적으로 표시되는지 확인합니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={testBrowserNotification} variant="outline">
              브라우저 알림 표시
            </Button>
            {preferences?.browser_enabled === false && (
              <p className="text-sm text-muted-foreground mt-2">
                브라우저 알림이 비활성화되어 있습니다.
              </p>
            )}
          </CardContent>
        </Card>

        {/* 전체 알림 테스트 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              전체 알림 테스트
            </CardTitle>
            <CardDescription>
              실제 알림을 생성하여 모든 기능이 정상 작동하는지 확인합니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testFullNotification} 
              disabled={testing}
            >
              {testing ? '생성 중...' : '테스트 알림 생성'}
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              테스트 알림이 생성되면 설정에 따라 사운드와 브라우저 알림이 표시됩니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
