'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  Archive, 
  Loader2, 
  Calendar,
  MessageSquare,
  Users,
  Settings
} from 'lucide-react';
import { useNotifications } from '@/lib/hooks/useNotifications';
import NotificationItem from '@/components/notifications/NotificationItem';
import Link from 'next/link';

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  const {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  // 필터링된 알림
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread' && notification.is_read) return false;
    if (typeFilter !== 'all' && !notification.type.includes(typeFilter)) return false;
    return true;
  });

  const notificationTypes = [
    { value: 'all', label: '전체', icon: null },
    { value: 'todo', label: '할일', icon: Calendar },
    { value: 'comment', label: '댓글', icon: MessageSquare },
    { value: 'space', label: '스페이스', icon: Users },
  ];

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">알림</h1>
          <p className="text-muted-foreground mt-1">
            새로운 활동과 업데이트를 확인하세요
          </p>
        </div>
        <Link href="/notifications/settings">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            알림 설정
          </Button>
        </Link>
      </div>

      <Card>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')}>
              <TabsList>
                <TabsTrigger value="all">
                  전체
                  {notifications.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {notifications.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="unread">
                  읽지 않음
                  {unreadCount > 0 && (
                    <Badge variant="default" className="ml-2">
                      {unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAsRead()}
              >
                <Check className="h-4 w-4 mr-2" />
                모두 읽음으로 표시
              </Button>
            )}
          </div>

          {/* 타입 필터 */}
          <div className="flex gap-2 mt-4">
            {notificationTypes.map((type) => (
              <Button
                key={type.value}
                variant={typeFilter === type.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter(type.value)}
                className="gap-2"
              >
                {type.icon && <type.icon className="h-4 w-4" />}
                {type.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <Archive className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">알림이 없습니다</h3>
              <p className="text-muted-foreground text-center">
                {filter === 'unread' 
                  ? '읽지 않은 알림이 없습니다.' 
                  : '아직 받은 알림이 없습니다.'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                />
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
