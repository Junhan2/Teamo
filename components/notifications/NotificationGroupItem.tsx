'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import NotificationItem from './NotificationItem';
import type { NotificationGroup } from '@/lib/utils/notification-grouping';
import { getUnreadCount, getLatestTime, getGroupSummary } from '@/lib/utils/notification-grouping';

interface NotificationGroupItemProps {
  group: NotificationGroup;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectChange?: (id: string, checked: boolean) => void;
}

export default function NotificationGroupItem({
  group,
  onMarkAsRead,
  onDelete,
  selectable = false,
  selectedIds = new Set(),
  onSelectChange,
}: NotificationGroupItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const unreadCount = getUnreadCount(group);
  const latestTime = getLatestTime(group);
  const summary = getGroupSummary(group);
  
  // 단일 알림인 경우 그룹화하지 않고 바로 표시
  if (group.notifications.length === 1) {
    return (
      <NotificationItem
        notification={group.notifications[0]}
        onMarkAsRead={onMarkAsRead}
        onDelete={onDelete}
        selectable={selectable}
        selected={selectedIds.has(group.notifications[0].id)}
        onSelectChange={onSelectChange}
      />
    );
  }

  // 그룹 내 모든 알림이 선택되었는지 확인
  const allSelected = group.notifications.every(n => selectedIds.has(n.id));
  const someSelected = group.notifications.some(n => selectedIds.has(n.id)) && !allSelected;

  const handleGroupSelect = (checked: boolean) => {
    group.notifications.forEach(notification => {
      onSelectChange?.(notification.id, checked);
    });
  };

  return (
    <div className="border-b last:border-b-0">
      {/* 그룹 헤더 */}
      <div
        className={cn(
          'flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors',
          unreadCount > 0 && 'bg-blue-50 hover:bg-blue-100'
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {selectable && (
          <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={allSelected}
              indeterminate={someSelected}
              onCheckedChange={handleGroupSelect}
            />
          </div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          className="p-0 h-auto"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
        
        <div className="flex items-center gap-2 flex-1">
          <Layers className="h-4 w-4 text-gray-400" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{group.title}</span>
              <Badge variant="secondary" className="text-xs">
                {group.notifications.length}
              </Badge>
              {unreadCount > 0 && (
                <Badge variant="default" className="text-xs">
                  {unreadCount} 새 알림
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500">{summary}</p>
          </div>
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(latestTime, {
              addSuffix: true,
              locale: ko,
            })}
          </span>
        </div>
      </div>

      {/* 확장된 알림 목록 */}
      {isExpanded && (
        <div className="pl-8 bg-gray-50">
          {group.notifications.map((notification) => (
            <div key={notification.id} className="border-t first:border-t-0">
              <NotificationItem
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onDelete={onDelete}
                selectable={selectable}
                selected={selectedIds.has(notification.id)}
                onSelectChange={onSelectChange}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
