import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Flame,
  ShieldAlert,
  CheckSquare,
  Users,
  Package,
  Bell,
  FileSpreadsheet,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';

export default function Sidebar({ isOpen, setIsOpen }) {
  const { user, logoutUser } = useAuth();
  
  const getNavLinks = () => {
    if (!user) return [];
    
    const role = user.role;
    
    if (role === 'ADMIN') {
      return [
        { to: '/dashboard', label: 'Control Room', icon: LayoutDashboard },
        { to: '/disasters', label: 'Disaster Events', icon: Flame },
        { to: '/emergency-requests', label: 'Emergency Requests', icon: ShieldAlert },
        { to: '/tasks', label: 'Task Center', icon: CheckSquare },
        { to: '/volunteers', label: 'Volunteer Pool', icon: Users },
        { to: '/resources', label: 'Resource Stocks', icon: Package },
        { to: '/notifications', label: 'System Alerts', icon: Bell },
        { to: '/audit-logs', label: 'Audit Trail', icon: FileSpreadsheet },
        { to: '/profile', label: 'Profile & Settings', icon: User },
      ];
    } else if (role === 'VOLUNTEER') {
      return [
        { to: '/dashboard', label: 'Task Board', icon: LayoutDashboard },
        { to: '/profile', label: 'Availability Profile', icon: User },
      ];
    } else if (role === 'BENEFICIARY') {
      return [
        { to: '/dashboard', label: 'Request Hub', icon: LayoutDashboard },
        { to: '/profile', label: 'Profile & Location', icon: User },
      ];
    }
    
    return [];
  };

  const navLinks = getNavLinks();

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-30 flex flex-col bg-[#FFFFFF] border-r border-brand-border transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-20'
      } md:relative md:flex`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-brand-border bg-[#FFFFFF]">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#607D6C]/10 border border-[#607D6C]/30 text-[#607D6C] flex-shrink-0">
            <Shield size={20} className="pulse-subtle" />
          </div>
          {isOpen && (
            <span className="font-outfit font-extrabold tracking-wider text-[#2C3531] whitespace-nowrap">
              RESQCOMMAND
            </span>
          )}
        </div>
        
        {/* Toggle Button for Desktop */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="hidden md:flex items-center justify-center w-6 h-6 rounded-md bg-brand-bg border border-brand-border hover:border-[#607D6C]/30 text-brand-text-secondary hover:text-[#2C3531] transition-colors cursor-pointer"
        >
          {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto bg-[#FFFFFF]">
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group cursor-pointer ${
                  isActive
                    ? 'bg-[#607D6C]/10 border-l-4 border-[#607D6C] text-[#607D6C] font-bold'
                    : 'text-brand-text-secondary hover:text-[#2C3531] hover:bg-[#607D6C]/5'
                }`
              }
            >
              <Icon
                size={18}
                className="flex-shrink-0 transition-transform group-hover:scale-105"
              />
              {isOpen && <span className="truncate">{link.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User Status / Logout Footer */}
      <div className="p-3 border-t border-brand-border bg-brand-bg/40">
        {user && isOpen && (
          <div className="px-3 py-2.5 mb-3 rounded-xl bg-[#FFFFFF] border border-brand-border">
            <div className="text-[9px] font-bold text-brand-text-muted uppercase tracking-wider">
              System Operator
            </div>
            <div className="font-bold text-sm truncate text-[#2C3531] mt-0.5">
              {user.name}
            </div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-2 rounded-md text-[10px] font-bold tracking-wider uppercase bg-[#607D6C]/10 border border-[#607D6C]/20 text-[#607D6C]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#607D6C] animate-ping" />
              {user.role}
            </div>
          </div>
        )}
        
        <button
          onClick={logoutUser}
          className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-bold text-[#C26D5C] hover:bg-[#C26D5C]/10 transition-colors cursor-pointer ${
            !isOpen && 'justify-center'
          }`}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {isOpen && <span>Logout Operator</span>}
        </button>
      </div>
    </aside>
  );
}
