'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { InlineSpinner } from '@/components/ui/UnifiedSpinner';
import { 
  Check, 
  Archive, 
  Calendar,
  MessageSquare,
  Users,
  Settings,
  CheckCheck,
  Trash2,
  X,
  Layers,
  List
} from 'lucide-react';
import { useNotifications } from '@/lib/hooks/useNotifications';
import NotificationItem from '@/components/notifications/NotificationItem';
import NotificationGroupItem from '@/components/notifications/NotificationGroupItem';
import Link from 'next/link';
import { toast } from 'sonner';
import { groupNotifications } from '@/lib/utils/notification-grouping';

export default function NotificationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL 파라미터에서 초기값 가져오기
  const [filter, setFilter] = useState<'all' | 'unread'>(
    (searchParams.get('filter') as 'all' | 'unread') || 'all'
  );
  const [typeFilter, setTypeFilter] = useState<string>(
    searchParams.get('type') || 'all'
  );
  
  const {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    bulkAction,
  } = useNotifications();

  // 선택 모드 상태
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [groupMode, setGroupMode] = useState(true); // 그룹화 모드 추가

  // URL 파라미터 업데이트
  useEffect(() => {
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('filter', filter);
    if (typeFilter !== 'all') params.set('type', typeFilter);
    
    const newUrl = params.toString() ? `?${params.toString()}` : '/notifications';
    router.replace(newUrl);
  }, [filter, typeFilter, router]);

  // 필터링된 알림
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread' && notification.is_read) return false;
    if (typeFilter === 'todo' && !['todo_assigned', 'todo_completed', 'todo_updated'].includes(notification.type)) return false;
    if (typeFilter === 'comment' && notification.type !== 'comment_added') return false;
    if (typeFilter === 'space' && !['space_invited', 'space_member_joined'].includes(notification.type)) return false;
    return true;
  });

  // 그룹화된 알림
  const notificationGroups = useMemo(() => {
    if (!groupMode) return null;
    return groupNotifications(filteredNotifications);
  }, [filteredNotifications, groupMode]);

  // 선택 모드 토글
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedIds(new Set());
  };

  // 개별 선택 처리
  const handleSelectChange = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  // 전체 선택
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredNotifications.map(n => n.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  // 일괄 읽음 처리
  const handleBulkMarkAsRead = async () => {
    const ids = Array.from(selectedIds);
    const result = await bulkAction(ids, 'read');
    if (result?.success) {
      toast.success(`${result.affectedCount}개의 알림을 읽음 처리했습니다.`);
      setSelectedIds(new Set());
    } else {
      toast.error('읽음 처리에 실패했습니다.');
    }
  };

  // 일괄 삭제
  const handleBulkDelete = async () => {
    if (!confirm(`선택한 ${selectedIds.size}개의 알림을 삭제하시겠습니까?`)) return;
    
    const ids = Array.from(selectedIds);
    const result = await bulkAction(ids, 'delete');
    if (result?.success) {
      toast.success(`${result.affectedCount}개의 알림을 삭제했습니다.`);
      setSelectedIds(new Set());
      if (filteredNotifications.length === ids.length) {
        setSelectionMode(false);
      }
    } else {
      toast.error('삭제에 실패했습니다.');
    }
  };

  const notificationTypeLabels = {
    all: '전체',
    todo: '할일',
    comment: '댓글',
    space: '스페이스',
  };

  const allChecked = filteredNotifications.length > 0 && 
    filteredNotifications.every(n => selectedIds.has(n.id));
  const someChecked = selectedIds.size > 0 && !allChecked;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <InlineSpinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">알림</h1>
        <div className="flex gap-2">
          {selectionMode ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectionMode(false);
                  setSelectedIds(new Set());
                }}
              >
                <X className="h-4 w-4 mr-1" />
                취소
              </Button>
              {selectedIds.size > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkMarkAsRead}
                    disabled={filteredNotifications
                      .filter(n => selectedIds.has(n.id))
                      .every(n => n.is_read)}
                  >
                    <CheckCheck className="h-4 w-4 mr-1" />
                    읽음 처리
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    삭제
                  </Button>
                </>
              )}
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGroupMode(!groupMode)}
                disabled={filteredNotifications.length === 0}
              >
                {groupMode ? <List className="h-4 w-4 mr-1" /> : <Layers className="h-4 w-4 mr-1" />}
                {groupMode ? '목록' : '그룹'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectionMode}
                disabled={filteredNotifications.length === 0}
              >
                선택
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <Link href="/notifications/settings">
                  <Settings className="h-4 w-4 mr-1" />
                  설정
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 필터 탭 */}
      <Tabs value={typeFilter} onValueChange={setTypeFilter}>
        <TabsList className="grid w-full grid-cols-4">
          {Object.entries(notificationTypeLabels).map(([value, label]) => (
            <TabsTrigger key={value} value={value}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={typeFilter} className="space-y-4">
          {/* 읽음 상태 필터 */}
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              전체
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('unread')}
            >
              읽지 않음
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* 일괄 선택 헤더 */}
          {selectionMode && filteredNotifications.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <Checkbox
                checked={allChecked}
                onCheckedChange={handleSelectAll}
                aria-label="전체 선택"
              />
              <span className="text-sm text-gray-600">
                {selectedIds.size > 0
                  ? `${selectedIds.size}개 선택됨`
                  : '전체 선택'}
              </span>
            </div>
          )}

          {/* 알림 목록 */}
          <Card>
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {filter === 'unread' ? '읽지 않은 알림이 없습니다.' : '알림이 없습니다.'}
              </div>
            ) : (
              <div className={groupMode ? '' : 'divide-y'}>
                {groupMode && notificationGroups ? (
                  // 그룹화된 알림 표시
                  notificationGroups.map((group) => (
                    <NotificationGroupItem
                      key={group.id}
                      group={group}
                      onMarkAsRead={markAsRead}
                      onDelete={deleteNotification}
                      selectable={selectionMode}
                      selectedIds={selectedIds}
                      onSelectChange={handleSelectChange}
                    />
                  ))
                ) : (
                  // 일반 목록 표시
                  filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onDelete={deleteNotification}
                      selectable={selectionMode}
                      selected={selectedIds.has(notification.id)}
                      onSelectChange={handleSelectChange}
                    />
                  ))
                )}
              </div>
            )}
          </Card>

          {/* 전체 읽음 처리 버튼 */}
          {!selectionMode && unreadCount > 0 && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={markAllAsRead}
              >
                <Check className="h-4 w-4 mr-2" />
                모두 읽음으로 표시
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
