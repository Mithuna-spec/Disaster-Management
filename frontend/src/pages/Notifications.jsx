import React, { useState, useEffect, useCallback } from 'react';
import * as notificationsApi from '../api/notifications';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import { Bell, Check, Trash2, Calendar, AlertTriangle, Info, CheckCircle } from 'lucide-react';

export default function Notifications() {
  const { showSuccess, showError } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await notificationsApi.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error(err);
      setError('Failed to sync in-app alerts from EOC notification center.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkRead = async (id) => {
    try {
      await notificationsApi.markNotificationRead(id);
      showSuccess('Alert marked as read');
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: 'READ' } : n))
      );
    } catch (err) {
      showError(err.message);
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => n.status !== 'READ');
    if (unread.length === 0) return;
    try {
      await Promise.all(unread.map(n => notificationsApi.markNotificationRead(n.id)));
      showSuccess('All notifications cleared');
      setNotifications((prev) => prev.map((n) => ({ ...n, status: 'READ' })));
    } catch (err) {
      showError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <LoadingState variant="list" count={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState message={error} retry={loadNotifications} />
      </div>
    );
  }

  const unreadCount = notifications.filter(n => n.status !== 'READ').length;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header panel */}
      <div className="flex items-center justify-between border-b border-brand-border pb-4">
        <div className="flex items-center gap-2">
          <Bell className="text-brand-violet-light" size={20} />
          <h3 className="font-outfit font-semibold text-sm uppercase tracking-wider text-brand-text-primary">
            EOC System Alert Console
          </h3>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded bg-brand-surface border border-brand-border hover:border-brand-violet/30 text-brand-violet-light hover:text-brand-violet transition-colors cursor-pointer"
          >
            <Check size={14} /> Clear All Alerts
          </button>
        )}
      </div>

      {/* Roster list */}
      {notifications.length === 0 ? (
        <EmptyState
          title="Console Log Clear"
          description="There are currently no active alerts routed to this operator terminal."
          icon={Bell}
        />
      ) : (
        <div className="space-y-4">
          {notifications.map((n) => {
            const isRead = n.status === 'READ';
            const date = new Date(n.created_at).toLocaleString();

            return (
              <div
                key={n.id}
                className={`glass-panel p-5 rounded-xl border transition-all flex flex-col md:flex-row gap-4 items-start md:items-center justify-between ${
                  isRead ? 'opacity-55 border-brand-border/40' : 'border-brand-border bg-brand-surface/35 shadow-lg'
                }`}
              >
                {/* Text content */}
                <div className="flex items-start gap-4 flex-1">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0 mt-0.5 border ${
                    n.type === 'LOW_STOCK'
                      ? 'bg-brand-amber/10 border-brand-amber/20 text-brand-amber'
                      : 'bg-brand-violet/10 border-brand-violet/20 text-brand-violet-light'
                  }`}>
                    {n.type === 'LOW_STOCK' ? <AlertTriangle size={18} /> : <Info size={18} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h4 className="font-outfit font-bold text-sm text-brand-text-primary">
                        {n.title}
                      </h4>
                      {!isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-rose animate-ping" />
                      )}
                    </div>
                    <p className="text-xs text-brand-text-secondary mt-1 leading-relaxed max-w-2xl">
                      {n.message}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[9px] text-brand-text-muted mt-2 font-medium">
                      <Calendar size={10} /> Received {date}
                    </span>
                  </div>
                </div>

                {/* Mark as read action */}
                {!isRead && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-brand-teal hover:bg-brand-teal-light text-white transition-all cursor-pointer w-full md:w-auto justify-center"
                  >
                    <Check size={12} /> Acknowledge Alert
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
