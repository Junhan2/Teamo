'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Loader2, ArrowLeft, Bell, Calendar, MessageSquare, Users, UserPlus, CheckCircle, Volume2, VolumeX, Monitor } from 'lucide-react';
import { useNotificationPreferences } from '@/lib/hooks/useNotificationPreferences';
import { toast } from 'sonner';
import EmailSettings from './email-settings';

const notificationTypes = [
  {
    key: 'task_assigned',
    label: '할일 할당',
    description: '새로운 할일이 나에게 할당되었을 때',
    icon: Calendar,
  },
  {
    key: 'task_completed',
    label: '할일 완료',
    description: '내가 할당한 할일이 완료되었을 때',
    icon: CheckCircle,
  },
  {
    key: 'task_updated',
    label: '할일 수정',
    description: '내가 참여한 할일이 수정되었을 때',
    icon: Calendar,
  },
  {
    key: 'comment_added',
    label: '댓글 추가',
    description: '내 할일에 댓글이 추가되었을 때',
    icon: MessageSquare,
  },
  {
    key: 'space_invited',
    label: '스페이스 초대',
    description: '새로운 스페이스에 초대되었을 때',
    icon: UserPlus,
  },
  {
    key: 'space_joined',
    label: '멤버 참여',
    description: '내 스페이스에 새 멤버가 참여했을 때',
    icon: Users,
  },
] as const;

export default function NotificationSettingsPage() {
  const router = useRouter();
  const { preferences, loading, error, updatePreferences } = useNotificationPreferences();
  const [saving, setSaving] = useState(false);
  const [localPreferences, setLocalPreferences] = useState(preferences);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
    }
    
    // 브라우저 알림 권한 상태 확인
    if ('Notification' in window) {
      setBrowserPermission(Notification.permission);
    }
  }, [preferences]);

  const handleToggle = (key: string) => {
    if (!localPreferences) return;
    
    setLocalPreferences(prev => ({
      ...prev!,
      [key]: !prev![key as keyof typeof prev],
    }));
  };

  const handleSoundToggle = () => {
    if (!localPreferences) return;
    
    setLocalPreferences(prev => ({
      ...prev!,
      sound_enabled: !prev!.sound_enabled,
    }));
  };

  const handleBrowserToggle = async () => {
    if (!localPreferences) return;
    
    // 브라우저 알림이 꺼져있다가 켜지는 경우
    if (!localPreferences.browser_enabled) {
      // 브라우저 알림 권한 요청
      if ('Notification' in window) {
        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          setBrowserPermission(permission);
          
          if (permission !== 'granted') {
            toast.error('브라우저 알림 권한이 거부되었습니다.');
            return;
          }
        } else if (Notification.permission === 'denied') {
          toast.error('브라우저 알림이 차단되어 있습니다. 브라우저 설정에서 권한을 허용해주세요.');
          return;
        }
      }
    }
    
    setLocalPreferences(prev => ({
      ...prev!,
      browser_enabled: !prev!.browser_enabled,
    }));
  };

  const handleVolumeChange = (value: number[]) => {
    if (!localPreferences) return;
    
    setLocalPreferences(prev => ({
      ...prev!,
      sound_volume: value[0],
    }));
  };

  const handleSave = async () => {
    if (!localPreferences) return;
    
    setSaving(true);
    try {
      await updatePreferences(localPreferences);
      toast.success('알림 설정이 저장되었습니다.');
    } catch (err) {
      toast.error('설정 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push('/notifications');
  };

  const testSound = () => {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = (localPreferences?.sound_volume || 50) / 100;
    audio.play().catch(err => {
      console.error('Failed to play sound:', err);
      // 실제 사운드 파일이 없으므로 fallback으로 Web Audio API 사용
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      gainNode.gain.value = (localPreferences?.sound_volume || 50) / 100;
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
    });
  };

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto py-6 px-4">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !localPreferences) {
    return (
      <div className="container max-w-2xl mx-auto py-6 px-4">
        <div className="text-center py-16">
          <p className="text-muted-foreground">설정을 불러올 수 없습니다.</p>
          <Button onClick={handleBack} variant="outline" className="mt-4">
            돌아가기
          </Button>
        </div>
      </div>
    );
  }

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
        
        <h1 className="text-2xl font-bold">알림 설정</h1>
        <p className="text-muted-foreground mt-1">
          받고 싶은 알림 유형을 선택하세요
        </p>
      </div>

      {/* 사운드 및 브라우저 알림 설정 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            알림 방식
          </CardTitle>
          <CardDescription>
            알림을 받는 방법을 설정합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 사운드 설정 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {localPreferences.sound_enabled ? (
                  <Volume2 className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <VolumeX className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <Label htmlFor="sound-enabled" className="text-base font-medium cursor-pointer">
                    알림 사운드
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    새 알림이 올 때 소리로 알려줍니다
                  </p>
                </div>
              </div>
              <Switch
                id="sound-enabled"
                checked={localPreferences.sound_enabled || false}
                onCheckedChange={handleSoundToggle}
              />
            </div>
            
            {localPreferences.sound_enabled && (
              <div className="ml-8 space-y-3">
                <div className="flex items-center gap-4">
                  <Label htmlFor="volume" className="text-sm text-muted-foreground min-w-[60px]">
                    볼륨
                  </Label>
                  <Slider
                    id="volume"
                    min={0}
                    max={100}
                    step={10}
                    value={[localPreferences.sound_volume || 50]}
                    onValueChange={handleVolumeChange}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground min-w-[40px] text-right">
                    {localPreferences.sound_volume || 50}%
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testSound}
                  className="ml-auto"
                >
                  테스트
                </Button>
              </div>
            )}
          </div>

          <div className="border-t pt-6" />

          {/* 브라우저 알림 설정 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Monitor className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="browser-enabled" className="text-base font-medium cursor-pointer">
                    브라우저 알림
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    브라우저 알림으로 알려줍니다
                  </p>
                </div>
              </div>
              <Switch
                id="browser-enabled"
                checked={localPreferences.browser_enabled || false}
                onCheckedChange={handleBrowserToggle}
                disabled={!('Notification' in window)}
              />
            </div>
            
            {browserPermission === 'denied' && (
              <p className="ml-8 text-sm text-destructive">
                브라우저 알림이 차단되어 있습니다. 브라우저 설정에서 권한을 허용해주세요.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 알림 유형 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            알림 유형
          </CardTitle>
          <CardDescription>
            각 알림 유형을 켜거나 끌 수 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {notificationTypes.map((type) => {
            const Icon = type.icon;
            const isEnabled = localPreferences[type.key as keyof typeof localPreferences] as boolean;
            
            return (
              <div
                key={type.key}
                className="flex items-start space-x-3 pb-4 border-b last:border-0"
              >
                <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={type.key} className="text-base font-medium cursor-pointer">
                      {type.label}
                    </Label>
                    <Switch
                      id={type.key}
                      checked={isEnabled}
                      onCheckedChange={() => handleToggle(type.key)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {type.description}
                  </p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 mt-6">
        <Button
          variant="outline"
          onClick={handleBack}
        >
          취소
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              저장 중...
            </>
          ) : (
            '설정 저장'
          )}
        </Button>
      </div>

      {/* 이메일 알림 설정 섹션 추가 */}
      <div className="mt-8">
        <EmailSettings />
      </div>
    </div>
  );
}
