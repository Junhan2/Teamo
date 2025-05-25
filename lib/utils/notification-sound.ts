import { notificationsClient } from '@/lib/api/notifications/client';
import type { Notification, NotificationPreferences } from '@/lib/types/notifications';

// 알림 사운드 재생
export async function playNotificationSound(volume: number = 50) {
  try {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = volume / 100;
    await audio.play();
  } catch (error) {
    console.error('Failed to play notification sound:', error);
    
    // Fallback: Web Audio API를 사용한 간단한 비프음
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      gainNode.gain.value = volume / 100;
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (err) {
      console.error('Failed to play fallback sound:', err);
    }
  }
}

// 브라우저 알림 표시
export async function showBrowserNotification(notification: Notification) {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return;
  }

  try {
    const title = getNotificationTitle(notification);
    const body = getNotificationBody(notification);
    const icon = '/icon-192x192.png'; // PWA 아이콘 사용

    const browserNotification = new Notification(title, {
      body,
      icon,
      badge: '/icon-192x192.png',
      tag: notification.id, // 같은 ID의 알림은 덮어씌움
      renotify: true, // 같은 태그의 알림도 다시 알림
      requireInteraction: false, // 자동으로 사라짐
      silent: true, // 시스템 소리는 끔 (우리가 직접 재생)
    });

    // 클릭 시 앱으로 이동
    browserNotification.onclick = () => {
      window.focus();
      
      // 알림 타입에 따라 적절한 페이지로 이동
      switch (notification.type) {
        case 'todo_assigned':
        case 'todo_completed':
        case 'todo_updated':
        case 'comment_added':
          if (notification.data.todo_id) {
            window.location.href = `/todos/${notification.data.todo_id}`;
          }
          break;
        case 'space_invited':
        case 'space_member_joined':
          if (notification.data.space_id) {
            window.location.href = `/spaces/${notification.data.space_id}`;
          }
          break;
        default:
          window.location.href = '/notifications';
      }
      
      browserNotification.close();
    };

    // 5초 후 자동으로 닫기
    setTimeout(() => {
      browserNotification.close();
    }, 5000);
  } catch (error) {
    console.error('Failed to show browser notification:', error);
  }
}

// 알림 제목 생성
function getNotificationTitle(notification: Notification): string {
  switch (notification.type) {
    case 'todo_assigned':
      return '새 할일 할당';
    case 'todo_completed':
      return '할일 완료';
    case 'todo_updated':
      return '할일 수정';
    case 'comment_added':
      return '새 댓글';
    case 'space_invited':
      return '스페이스 초대';
    case 'space_member_joined':
      return '새 멤버 참여';
    default:
      return '새 알림';
  }
}

// 알림 본문 생성
function getNotificationBody(notification: Notification): string {
  const { data } = notification;
  
  switch (notification.type) {
    case 'todo_assigned':
      return `${data.actor_name || '누군가'}님이 "${data.title || '할일'}"을 할당했습니다`;
    case 'todo_completed':
      return `${data.actor_name || '누군가'}님이 "${data.title || '할일'}"을 완료했습니다`;
    case 'todo_updated':
      return `${data.actor_name || '누군가'}님이 "${data.title || '할일'}"을 수정했습니다`;
    case 'comment_added':
      return `${data.actor_name || '누군가'}님이 댓글을 남겼습니다: ${data.comment || ''}`;
    case 'space_invited':
      return `${data.actor_name || '누군가'}님이 "${data.space_name || '스페이스'}"에 초대했습니다`;
    case 'space_member_joined':
      return `${data.actor_name || '누군가'}님이 "${data.space_name || '스페이스'}"에 참여했습니다`;
    default:
      return '새로운 알림이 있습니다';
  }
}

// 알림 처리 (사운드 + 브라우저 알림)
export async function handleNewNotification(
  notification: Notification,
  preferences: NotificationPreferences | null
) {
  if (!preferences) return;

  // 사운드 재생
  if (preferences.sound_enabled) {
    await playNotificationSound(preferences.sound_volume);
  }

  // 브라우저 알림 표시
  if (preferences.browser_enabled) {
    await showBrowserNotification(notification);
  }
}

// 브라우저 알림 권한 요청
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }

  return await Notification.requestPermission();
}

// 브라우저 알림 권한 상태 확인
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }

  return Notification.permission;
}
