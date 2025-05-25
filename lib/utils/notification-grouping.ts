import { Notification } from '@/lib/types/notifications';
import { differenceInHours, startOfDay, isToday, isYesterday, format } from 'date-fns';
import { ko } from 'date-fns/locale';

export interface NotificationGroup {
  id: string;
  title: string;
  notifications: Notification[];
  relatedId?: string;
  spaceId?: string;
  type: 'task' | 'space' | 'mixed';
  timeGroup: string;
  isExpanded: boolean;
}

// 시간대별 그룹 라벨 생성
function getTimeGroupLabel(date: Date): string {
  if (isToday(date)) {
    return '오늘';
  } else if (isYesterday(date)) {
    return '어제';
  } else {
    return format(date, 'M월 d일', { locale: ko });
  }
}

// 알림을 그룹화하는 함수
export function groupNotifications(notifications: Notification[]): NotificationGroup[] {
  const groups: NotificationGroup[] = [];
  const groupMap = new Map<string, NotificationGroup>();

  // 시간순으로 정렬 (최신순)
  const sortedNotifications = [...notifications].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  sortedNotifications.forEach((notification) => {
    const createdAt = new Date(notification.created_at);
    const timeGroup = getTimeGroupLabel(createdAt);
    
    // 그룹 키 생성 (관련 ID + 시간 그룹)
    let groupKey = '';
    let groupTitle = '';
    let groupType: 'task' | 'space' | 'mixed' = 'mixed';

    // 할일 관련 알림
    if (notification.related_id && ['todo_assigned', 'todo_completed', 'todo_updated', 'comment_added'].includes(notification.type)) {
      groupKey = `task-${notification.related_id}-${timeGroup}`;
      groupTitle = notification.title;
      groupType = 'task';
    }
    // 스페이스 관련 알림
    else if (notification.space_id && ['space_invited', 'space_member_joined'].includes(notification.type)) {
      groupKey = `space-${notification.space_id}-${timeGroup}`;
      groupTitle = `스페이스 활동`;
      groupType = 'space';
    }
    // 기타 알림
    else {
      groupKey = `other-${notification.id}`;
      groupTitle = notification.title;
      groupType = 'mixed';
    }

    // 기존 그룹이 있는지 확인
    if (groupMap.has(groupKey)) {
      const group = groupMap.get(groupKey)!;
      group.notifications.push(notification);
    } else {
      // 새 그룹 생성
      const newGroup: NotificationGroup = {
        id: groupKey,
        title: groupTitle,
        notifications: [notification],
        relatedId: notification.related_id,
        spaceId: notification.space_id,
        type: groupType,
        timeGroup,
        isExpanded: false,
      };
      groupMap.set(groupKey, newGroup);
      groups.push(newGroup);
    }
  });

  // 각 그룹의 알림을 시간순으로 정렬
  groups.forEach(group => {
    group.notifications.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });

  return groups;
}

// 그룹 내 읽지 않은 알림 수 계산
export function getUnreadCount(group: NotificationGroup): number {
  return group.notifications.filter(n => !n.is_read).length;
}

// 그룹의 가장 최근 시간
export function getLatestTime(group: NotificationGroup): Date {
  return new Date(group.notifications[0].created_at);
}

// 그룹 요약 메시지 생성
export function getGroupSummary(group: NotificationGroup): string {
  const count = group.notifications.length;
  const unreadCount = getUnreadCount(group);
  
  if (count === 1) {
    return group.notifications[0].message;
  }

  const parts = [];
  if (group.type === 'task') {
    parts.push(`${count}개의 활동`);
  } else if (group.type === 'space') {
    parts.push(`${count}개의 스페이스 활동`);
  } else {
    parts.push(`${count}개의 알림`);
  }

  if (unreadCount > 0) {
    parts.push(`(${unreadCount}개 안읽음)`);
  }

  return parts.join(' ');
}
