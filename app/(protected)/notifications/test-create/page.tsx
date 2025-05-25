'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { NotificationType } from '@/lib/types/notifications';

const notificationTypes: { value: NotificationType; label: string }[] = [
  { value: 'todo_assigned', label: '할일 할당' },
  { value: 'todo_completed', label: '할일 완료' },
  { value: 'todo_updated', label: '할일 수정' },
  { value: 'comment_added', label: '댓글 추가' },
  { value: 'space_invited', label: '스페이스 초대' },
  { value: 'space_member_joined', label: '스페이스 멤버 참여' },
];

export default function NotificationTestPage() {
  const [type, setType] = useState<NotificationType>('todo_assigned');
  const [title, setTitle] = useState('테스트 할일');
  const [actorName, setActorName] = useState('테스트 사용자');
  const [spaceName, setSpaceName] = useState('테스트 스페이스');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleCreateNotification = async () => {
    setLoading(true);
    try {
      // 현재 사용자 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('로그인이 필요합니다.');
        return;
      }

      // 알림 데이터 구성
      const notificationData = {
        actor_name: actorName,
        title: title,
        space_name: spaceName,
      };

      // 알림 생성
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: type,
          data: notificationData,
        });

      if (error) throw error;

      toast.success('테스트 알림이 생성되었습니다.');
      
      // 입력 필드 초기화
      setTitle('테스트 할일');
      setActorName('테스트 사용자');
      setSpaceName('테스트 스페이스');
    } catch (error) {
      console.error('알림 생성 실패:', error);
      toast.error('알림 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-6 px-4">
      <Card>
        <CardHeader>
          <CardTitle>알림 테스트</CardTitle>
          <CardDescription>
            테스트 알림을 생성하여 알림 시스템을 확인할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">알림 타입</Label>
            <Select value={type} onValueChange={(v) => setType(v as NotificationType)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {notificationTypes.map((nt) => (
                  <SelectItem key={nt.value} value={nt.value}>
                    {nt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="actor-name">행위자 이름</Label>
            <Input
              id="actor-name"
              value={actorName}
              onChange={(e) => setActorName(e.target.value)}
              placeholder="예: 홍길동"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">제목/내용</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 프로젝트 기획서 작성"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="space-name">스페이스 이름</Label>
            <Input
              id="space-name"
              value={spaceName}
              onChange={(e) => setSpaceName(e.target.value)}
              placeholder="예: 개발팀"
            />
          </div>

          <Button
            onClick={handleCreateNotification}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                테스트 알림 생성
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
