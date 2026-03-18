'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  type: 'info' | 'warning' | 'success' | 'error';
  link?: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/notifications');
        if (!res.ok) throw new Error('Erreur lors du chargement');
        const data = await res.json();
        setNotifications(data.notifications || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  // Marquer comme lu → supprime la notification
  const markAsRead = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    fetch(`/api/notifications/${id}/read`, { method: 'POST' }).catch(() => {});
  };

  // Tout marquer comme lu → vide la liste
  const markAllAsRead = () => {
    setNotifications([]);
    fetch('/api/notifications/read-all', { method: 'POST' }).catch(() => {});
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'warning': return <AlertTriangle size={18} className="text-amber-500" />;
      case 'error':   return <AlertTriangle size={18} className="text-red-500" />;
      case 'success': return <CheckCircle2 size={18} className="text-green-500" />;
      default:        return <Info size={18} className="text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-gardex-orange rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        Erreur : {error}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        {notifications.length > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-gardex-orange hover:underline font-medium"
          >
            Tout marquer comme lu
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucune notification pour le moment</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="font-semibold text-gray-900">
                          {notification.title}
                        </h2>
                        <p className="text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {notification.time}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {notification.unread && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs text-gardex-orange hover:underline whitespace-nowrap"
                          >
                            Marquer comme lu
                          </button>
                        )}
                        {notification.link && (
                          <Link
                            href={notification.link}
                            className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                          >
                            Voir détails →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}