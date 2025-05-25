'use client';

import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Check, X, Users, MessageSquare, UserPlus, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { Notification } from '@/lib/types/notifications';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  selectable?: boolean;
  selected?: boolean;
  onSelectChange?: (id: string, checked: boolean) => void;
}

const notificationIcons = {
  todo_assigned: Calendar,
  todo_completed: Check,
  todo_updated: Calendar,
  comment_added: MessageSquare,
  space_invited: UserPlus,
  space_member_joined: Users,
};

const notificationMessages = {
  todo_assigned: '님이 할일을 할당했습니다',
  todo_completed: '님이 할일을 완료했습니다',
  todo_updated: '님이 할일을 수정했습니다',
  comment_added: '님이 댓글을 남겼습니다',
  space_invited: '님이 스페이스에 초대했습니다',
  space_member_joined: '님이 스페이스에 참여했습니다',
};

export default function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  selectable = false,
  selected = false,
  onSelectChange,
}: NotificationItemProps) {
  const Icon = notificationIcons[notification.type] || Calendar;
  const message = notificationMessages[notification.type] || '새로운 알림';

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 transition-colors hover:bg-gray-50 cursor-pointer',
        !notification.is_read && 'bg-blue-50 hover:bg-blue-100',
        selected && 'bg-gray-100'
      )}
      onClick={handleClick}
    >
      {selectable && (
        <div className="flex items-center pt-1">
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) => {
              onSelectChange?.(notification.id, checked as boolean);
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
        "relative p-4 hover:bg-accent/50 transition-colors cursor-pointer",
        !notification.is_read && "bg-accent/30"
      )}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        {/* 아이콘 */}
        <div className={cn(
          "rounded-full p-2 shrink-0",
          !notification.is_read ? "bg-primary/10" : "bg-muted"
        )}>
          <Icon className={cn(
            "h-4 w-4",
            !notification.is_read ? "text-primary" : "text-muted-foreground"
          )} />
        </div>

        {/* 내용 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className={cn(
                "text-sm",
                !notification.is_read ? "font-medium" : "font-normal"
              )}>
                <span className="font-medium">{notification.data?.actor_name || '사용자'}</span>
                {message}
              </p>
              {notification.data?.title && (
                <p className="text-sm text-muted-foreground mt-1 truncate">
                  {notification.data.title}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(notification.created_at), {
                  addSuffix: true,
                  locale: ko,
                })}
              </p>
            </div>

            {/* 삭제 버튼 */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification.id);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 읽지 않음 표시 */}
      {!notification.is_read && (
        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full" />
      )}
    </div>
  );
}
