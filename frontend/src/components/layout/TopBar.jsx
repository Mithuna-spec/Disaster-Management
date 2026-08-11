import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import * as notificationsApi from '../../api/notifications';
import * as tasksApi from '../../api/tasks';
import * as volunteerApi from '../../api/volunteers';
import { Menu, Bell, Check, RefreshCw, AlertTriangle } from 'lucide-react';

export default function TopBar({ toggleSidebar }) {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [showDrawer, setShowDrawer] = useState(false);
  const [loading, setLoading] = useState(false);
  const drawerRef = useRef(null);

  // Map route paths to page titles
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) {
      if (user?.role === 'ADMIN') return 'Emergency Operations Center (EOC) Control Room';
      if (user?.role === 'VOLUNTEER') return 'Volunteer Task Board & Availability';
      return 'Beneficiary Request Hub';
    }
    if (path.startsWith('/disasters')) return 'Disaster Operations & Mapping';
    if (path.startsWith('/emergency-requests')) return 'Inbound Emergency Requests';
    if (path.startsWith('/tasks')) return 'Active Deployment Tasks';
    if (path.startsWith('/volunteers')) return 'Active Volunteer Roster';
    if (path.startsWith('/resources')) return 'Resource Stocks & Supply Chain';
    if (path.startsWith('/notifications')) return 'System Notifications Center';
    if (path.startsWith('/audit-logs')) return 'Immutable Security Audit Logs';
    if (path.startsWith('/profile')) return 'Operator Profile & Settings';
    return 'ResQCommand Portal';
  };

  // Fetch in-app notifications
  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await notificationsApi.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch pending tasks to generate virtual notifications for volunteers
  const fetchPendingTasks = async () => {
    if (user?.role !== 'VOLUNTEER') return;
    try {
      const [allTasks, myProfile] = await Promise.all([
        tasksApi.getTasks(),
        volunteerApi.getMyVolunteerProfile().catch(() => null)
      ]);
      if (myProfile) {
        const myPending = allTasks.filter(t =>
          t.volunteer_assignments?.some(
            va => va.volunteer_id === myProfile.id && va.status === 'PENDING'
          )
        );
        setPendingTasks(myPending);
      }
    } catch (err) {
      console.error('Failed to load pending tasks for notification bar:', err);
    }
  };

  const handleFetchAll = async () => {
    await Promise.all([
      fetchNotifications(),
      fetchPendingTasks()
    ]);
  };

  useEffect(() => {
    handleFetchAll();
    // Poll notifications & tasks every 30 seconds for live alert system
    const interval = setInterval(handleFetchAll, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Click outside to close drawer
  useEffect(() => {
    function handleClickOutside(event) {
      if (drawerRef.current && !drawerRef.current.contains(event.target)) {
        setShowDrawer(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Combine regular notifications with virtual action-required task notifications
  const combinedNotifications = [
    ...pendingTasks.map(task => ({
      id: `task-pending-${task.id}`,
      title: 'ACTION REQUIRED',
      message: `New task assigned to you: ${task.task_type}`,
      created_at: task.created_at || new Date(),
      status: 'UNREAD',
      type: 'TASK_PENDING',
      taskId: task.id
    })),
    ...notifications
  ];

  const unreadCount = combinedNotifications.filter(n => n.status !== 'READ').length;

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsApi.markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, status: 'READ' } : n))
      );
      showSuccess('Notification marked as read');
    } catch (err) {
      showError(err.message);
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => n.status !== 'READ');
    if (unread.length === 0) return;
    try {
      await Promise.all(unread.map(n => notificationsApi.markNotificationRead(n.id)));
      setNotifications(prev => prev.map(n => ({ ...n, status: 'READ' })));
      showSuccess('All notifications marked as read');
    } catch (err) {
      showError(err.message);
    }
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-6 bg-[#FFFFFF] border-b border-brand-border">
      {/* Title & Hamburger */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="md:hidden p-2 rounded-lg hover:bg-brand-bg text-[#2C3531] cursor-pointer"
        >
          <Menu size={20} />
        </button>
        <h2 className="text-sm md:text-base font-outfit font-bold text-[#2C3531] tracking-wider uppercase leading-none">
          {getPageTitle()}
        </h2>
      </div>

      {/* Quick Controls */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div className="relative" ref={drawerRef}>
          <button
            onClick={() => setShowDrawer(!showDrawer)}
            className="relative p-2.5 rounded-lg hover:bg-brand-bg border border-brand-border text-brand-text-secondary hover:text-[#2C3531] transition-colors cursor-pointer"
            aria-label="Notifications Drawer"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-[#C26D5C] border border-white text-[9px] font-bold text-white leading-none animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showDrawer && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 bg-[#FFFFFF] rounded-xl shadow-lg border border-brand-border overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 bg-brand-bg/30 border-b border-brand-border">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-[#2C3531] uppercase tracking-wider">System Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[9px] bg-[#C26D5C]/15 text-[#C26D5C] px-2 py-0.5 rounded-full font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > pendingTasks.length && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] font-bold uppercase text-[#607D6C] hover:text-[#4F6759] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Check size={12} /> Mark all read
                    </button>
                  )}
                  <button
                    onClick={handleFetchAll}
                    className="p-1 rounded hover:bg-brand-bg text-brand-text-secondary cursor-pointer"
                    disabled={loading}
                  >
                    <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>

              {/* Notification Items */}
              <div className="max-h-80 overflow-y-auto divide-y divide-brand-border/40">
                {combinedNotifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-brand-text-muted">
                    No notifications received
                  </div>
                ) : (
                  combinedNotifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-4 transition-colors ${
                        n.status === 'READ' ? 'bg-transparent opacity-60' : 'bg-brand-bg/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {n.type === 'TASK_PENDING' ? (
                              <span className="text-[9px] font-bold text-[#C26D5C] uppercase tracking-wider bg-[#C26D5C]/15 px-1.5 py-0.5 rounded border border-[#C26D5C]/25">
                                Action Required
                              </span>
                            ) : n.type === 'LOW_STOCK' ? (
                              <AlertTriangle size={14} className="text-[#D4A373] flex-shrink-0" />
                            ) : null}
                            
                            {n.type !== 'TASK_PENDING' && (
                              <h4 className={`text-xs font-bold ${
                                n.type === 'LOW_STOCK' ? 'text-[#D4A373]' : 'text-[#607D6C]'
                              }`}>
                                {n.title}
                              </h4>
                            )}
                          </div>
                          <p className="text-xs text-brand-text-secondary mt-1 leading-relaxed">
                            {n.message}
                          </p>
                          
                          {n.type === 'TASK_PENDING' && (
                            <button
                              onClick={() => {
                                setShowDrawer(false);
                                navigate(`/dashboard?review_task_id=${n.taskId}`);
                              }}
                              className="mt-2 px-3 py-1 rounded bg-[#607D6C] hover:bg-[#607D6C]/90 text-white font-bold text-[10px] uppercase tracking-wider block cursor-pointer transition-colors"
                            >
                              Review Task
                            </button>
                          )}
                          
                          <span className="text-[9px] text-brand-text-muted mt-2 block">
                            {new Date(n.created_at).toLocaleString()}
                          </span>
                        </div>
                        
                        {n.type !== 'TASK_PENDING' && n.status !== 'READ' && (
                          <button
                            onClick={() => handleMarkAsRead(n.id)}
                            className="p-1 rounded border border-brand-border hover:border-[#607D6C] hover:bg-[#607D6C]/10 text-brand-text-secondary hover:text-[#607D6C] transition-all cursor-pointer"
                            title="Mark as read"
                          >
                            <Check size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-brand-border">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-bold text-[#2C3531] leading-tight">
                {user.name}
              </span>
              <span className="text-[9px] text-brand-text-muted uppercase font-bold tracking-wider mt-0.5">
                {user.role}
              </span>
            </div>
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#607D6C]/15 border border-[#607D6C]/30 text-[#607D6C] font-outfit font-extrabold text-sm shadow-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
