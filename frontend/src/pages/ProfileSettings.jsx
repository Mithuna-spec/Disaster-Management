import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/ui/StatusBadge';
import {
  User,
  Shield,
  Clock,
  Mail,
  Lock,
  MapPin,
  Award,
  Truck,
  Activity,
  CheckCircle,
} from 'lucide-react';

export default function ProfileSettings() {
  const { user, volunteerProfile } = useAuth();
  const { showInfo } = useToast();

  const handleUnlockEdit = () => {
    showInfo('Registry changes are restricted in EOC production terminals. Contact System Admin.');
  };

  const getRolePrivileges = () => {
    if (!user) return [];
    
    switch (user.role) {
      case 'ADMIN':
        return [
          'Full read/write warehouse inventory access',
          'Deploy tasks and assign volunteer operators',
          'Execute AI volunteer matching algorithm operations',
          'Access to EOC security audit logs',
          'Manage crisis/disaster events',
        ];
      case 'VOLUNTEER':
        return [
          'Access to assigned deployment tasks board',
          'Accept/decline incoming rescue missions',
          'Configure standby/availability coordinates',
        ];
      case 'BENEFICIARY':
        return [
          'Submit emergency assistance requests',
          'Track live request resolution status',
          'View public EOC crisis response updates',
        ];
      default:
        return [];
    }
  };

  const privileges = getRolePrivileges();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Overview Card */}
      <div className="glass-panel p-8 rounded-2xl border border-brand-border flex flex-col md:flex-row gap-6 items-center">
        {/* User initials avatar */}
        <div className="w-20 h-20 rounded-full bg-brand-violet/20 border border-brand-violet/30 text-brand-violet-light flex items-center justify-center font-outfit text-3xl font-bold flex-shrink-0">
          {user?.name.charAt(0).toUpperCase()}
        </div>

        <div className="space-y-2 text-center md:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <h2 className="font-outfit font-extrabold text-2xl text-brand-text-primary">
              {user?.name}
            </h2>
            <StatusBadge status={user?.role} type="role" />
          </div>
          
          <div className="text-xs text-brand-text-secondary flex flex-wrap items-center justify-center md:justify-start gap-4">
            <span className="flex items-center gap-1">
              <Mail size={12} className="opacity-70" /> {user?.email}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} className="opacity-70" /> Operator ID: #{user?.id}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Operator Privileges */}
        <div className="glass-panel p-6 rounded-2xl border border-brand-border space-y-4">
          <div className="flex items-center gap-2 border-b border-brand-border pb-3">
            <Shield size={16} className="text-brand-violet-light" />
            <h4 className="font-outfit font-semibold text-xs uppercase tracking-wider text-brand-text-primary">
              EOC Operator Permissions
            </h4>
          </div>

          <ul className="space-y-3">
            {privileges.map((p, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-brand-text-secondary leading-relaxed">
                <CheckCircle size={14} className="text-brand-teal flex-shrink-0 mt-0.5" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Column: Role Profiles Details */}
        <div className="glass-panel p-6 rounded-2xl border border-brand-border space-y-4">
          <div className="flex items-center justify-between border-b border-brand-border pb-3">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-brand-teal-light" />
              <h4 className="font-outfit font-semibold text-xs uppercase tracking-wider text-brand-text-primary">
                Operator Registry Details
              </h4>
            </div>
            <button
              onClick={handleUnlockEdit}
              className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-brand-text-secondary hover:text-brand-violet-light hover:underline cursor-pointer"
            >
              <Lock size={10} /> Edit Locked
            </button>
          </div>

          {/* Volunteer specific view */}
          {user?.role === 'VOLUNTEER' && volunteerProfile ? (
            <div className="space-y-4 text-xs text-brand-text-secondary">
              <div className="flex justify-between border-b border-brand-border/40 pb-2">
                <span>Roster ID</span>
                <strong className="text-brand-text-primary font-mono">VOL #{volunteerProfile.id}</strong>
              </div>
              <div className="flex justify-between border-b border-brand-border/40 pb-2">
                <span>Base Location</span>
                <span className="text-brand-text-primary flex items-center gap-1">
                  <MapPin size={12} className="opacity-80" /> {volunteerProfile.location_name}
                </span>
              </div>
              <div className="flex justify-between border-b border-brand-border/40 pb-2">
                <span>Coordinates</span>
                <strong className="text-brand-text-primary font-mono">
                  ({volunteerProfile.location_lat}, {volunteerProfile.location_lng})
                </strong>
              </div>
              <div className="flex justify-between border-b border-brand-border/40 pb-2">
                <span>Medical Training</span>
                <span className={`font-semibold ${volunteerProfile.medical_training ? 'text-brand-rose' : 'text-brand-text-muted'}`}>
                  {volunteerProfile.medical_training ? 'Certified Medic' : 'Standard'}
                </span>
              </div>
              <div className="flex justify-between border-b border-brand-border/40 pb-2">
                <span>Logistic Vehicle</span>
                <span className={`font-semibold ${volunteerProfile.vehicle_available ? 'text-brand-teal-light' : 'text-brand-text-muted'}`}>
                  {volunteerProfile.vehicle_available ? volunteerProfile.vehicle_type || 'Yes' : 'None'}
                </span>
              </div>
              <div className="space-y-1">
                <span>Skills Inventory</span>
                <div className="flex flex-wrap gap-1 pt-1">
                  {volunteerProfile.skills?.map(s => (
                    <span key={s} className="px-1.5 py-0.5 rounded bg-white/5 border border-brand-border text-[10px] text-brand-text-primary font-mono">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : user?.role === 'VOLUNTEER' ? (
            <div className="text-center py-6 text-xs text-brand-text-muted italic">
              Volunteer profile not initialized. Go to Dashboard to initialize.
            </div>
          ) : (
            <div className="space-y-4 text-xs text-brand-text-secondary">
              <div className="flex justify-between border-b border-brand-border/40 pb-2">
                <span>System Status</span>
                <strong className="text-brand-emerald">ACTIVE OPERATOR</strong>
              </div>
              <div className="flex justify-between border-b border-brand-border/40 pb-2">
                <span>Operator Node</span>
                <strong className="text-brand-text-primary font-mono">EOC_CTRL_UNIT_01</strong>
              </div>
              <div className="flex justify-between border-b border-brand-border/40 pb-2">
                <span>Network Protocol</span>
                <strong className="text-brand-text-primary font-mono">IPv4 (VITE_PROXY)</strong>
              </div>
              <div className="flex justify-between border-b border-brand-border/40 pb-2">
                <span>Session Duration</span>
                <strong className="text-brand-text-primary font-mono">60 Minutes Max</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
