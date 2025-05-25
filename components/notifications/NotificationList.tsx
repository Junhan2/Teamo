'use client';

import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, Settings, Check, Archive } from 'lucide-react';
import { useNotifications } from '@/lib/hooks/useNotifications';
import NotificationItem from './NotificationItem';
import Link from 'next/link';

interface NotificationListProps {
  onClose?: () => void;
}

export default function NotificationList({ onClose }: NotificationListProps) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const {
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch,
  } = useNotifications();

  // 필터링된 알림
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.is_read;
    return true;
  });

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  return (
    <div className="flex flex-col h-[500px]">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-lg">알림</h3>
        <div className="flex items-center gap-2">
          {filteredNotifications.some(n => !n.is_read) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-sm"
            >
              <Check className="h-4 w-4 mr-1" />
              모두 읽음
            </Button>
          )}
        </div>
      </div>

      {/* 탭 필터 */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')} className="flex-1">
        <TabsList className="w-full justify-start rounded-none border-b h-10">
          <TabsTrigger value="all" className="data-[state=active]:bg-background">
            전체
          </TabsTrigger>
          <TabsTrigger value="unread" className="data-[state=active]:bg-background">
            읽지 않음
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-0 flex-1">
          <ScrollArea className="h-[360px]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <Archive className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {filter === 'unread' ? '읽지 않은 알림이 없습니다' : '알림이 없습니다'}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* 하단 링크 */}
      <div className="p-3 border-t">
        <Link href="/notifications" onClick={onClose}>
          <Button variant="ghost" className="w-full justify-center text-sm">
            모든 알림 보기
          </Button>
        </Link>
      </div>
    </div>
  );
}
