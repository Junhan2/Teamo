'use client';

import { useNotifications } from '@/lib/hooks/useNotifications';
import { useState } from 'react';

export default function NotificationsTestPage() {
  const { notifications, unreadCount, loading, error, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [selectedNotificationId, setSelectedNotificationId] = useState<string>('');

  if (loading) return <div className="p-8">Loading notifications...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error.message}</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Notifications Test Page</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Summary</h2>
        <p>Total Notifications: {notifications.length}</p>
        <p>Unread Count: {unreadCount}</p>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Mark All as Read
          </button>
        )}
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <p className="text-gray-500">No notifications yet.</p>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 border rounded-lg ${
                notification.is_read ? 'bg-white' : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold">{notification.title}</h3>
                  <p className="text-gray-600 mt-1">{notification.message}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    <span>Type: {notification.type}</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(notification.created_at).toLocaleString()}</span>
                    {notification.actor_name && (
                      <>
                        <span className="mx-2">•</span>
                        <span>By: {notification.actor_name}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  {!notification.is_read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
                    >
                      Mark as Read
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="px-3 py-1 text-sm bg-red-600 text-white hover:bg-red-700 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
