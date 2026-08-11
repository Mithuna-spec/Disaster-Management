import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as emergencyRequestsApi from '../api/emergencyRequests';
import * as tasksApi from '../api/tasks';
import * as volunteersApi from '../api/volunteers';
import * as resourcesApi from '../api/resources';
import * as disastersApi from '../api/disasters';
import * as auditLogsApi from '../api/auditLogs';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import StatusBadge from '../components/ui/StatusBadge';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import {
  ShieldAlert,
  CheckSquare,
  Users,
  Package,
  Flame,
  FileSpreadsheet,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States for stats counters
  const [emergencies, setEmergencies] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [resources, setResources] = useState([]);
  const [disasters, setDisasters] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        emergenciesData,
        tasksData,
        volunteersData,
        resourcesData,
        disastersData,
        auditLogsData,
      ] = await Promise.all([
        emergencyRequestsApi.getEmergencyRequests(),
        tasksApi.getTasks(),
        volunteersApi.getVolunteers(),
        resourcesApi.getResources(),
        disastersApi.getDisasters(),
        auditLogsApi.getAuditLogs(),
      ]);

      setEmergencies(emergenciesData);
      setTasks(tasksData);
      setVolunteers(volunteersData);
      setResources(resourcesData);
      setDisasters(disastersData);
      setAuditLogs(auditLogsData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to sync control center dashboard widgets. Verify server connections.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <LoadingState variant="stats" count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LoadingState variant="card" count={2} />
          <LoadingState variant="table" count={5} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState message={error} retry={loadData} />
      </div>
    );
  }

  // Calculations for stats
  const activeDisastersCount = disasters.filter((d) => d.status === 'ACTIVE').length;
  const pendingRequestsCount = emergencies.filter((e) => e.status === 'PENDING').length;
  const activeTasksCount = tasks.filter((t) => ['ASSIGNED', 'IN_PROGRESS'].includes(t.status)).length;
  const availableVolunteersCount = volunteers.filter((v) => v.availability).length;
  const lowStockResources = resources.filter((r) => r.quantity <= r.minimum_threshold);

  // Chart Data: Emergency Statuses
  const emergencyStatusMap = emergencies.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {});

  const emergencyChartData = Object.keys(emergencyStatusMap).map((status) => ({
    name: status.replace('_', ' '),
    value: emergencyStatusMap[status],
  }));

  const COLORS_EMERGENCY = {
    PENDING: '#D4A373',   // Warm Sand
    ACTIVE: '#C26D5C',    // Soft Terracotta
    RESOLVED: '#607D6C',  // Sage Green
    DEFAULT: '#8E9A94',
  };

  // Chart Data: Resource stock levels
  const resourceChartData = resources.slice(0, 6).map((r) => ({
    name: r.name,
    Current: r.quantity,
    SafetyLimit: r.minimum_threshold,
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Top Banner Warning if active crisis zone exists */}
      {activeDisastersCount > 0 && (
        <div className="flex items-center justify-between p-4 rounded-xl border border-brand-rose/25 bg-brand-rose/5 text-brand-rose glow-teal">
          <div className="flex items-center gap-3">
            <Flame className="pulse-subtle flex-shrink-0" size={20} />
            <div className="text-sm font-semibold tracking-wide">
              ALERT: {activeDisastersCount} ACTIVE DISASTER ZONE(S) CURRENTLY REGISTERED. ENFORCE DIRECT DEPLOYMENT PROTOCOLS.
            </div>
          </div>
          <button
            onClick={() => navigate('/disasters')}
            className="text-xs font-bold uppercase tracking-wider underline hover:text-brand-text-primary transition-colors cursor-pointer"
          >
            Review Disasters
          </button>
        </div>
      )}

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-xl flex items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-brand-indigo/10 border border-brand-indigo/25 text-brand-indigo-light">
            <ShieldAlert size={22} />
          </div>
          <div>
            <div className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider">
              Pending Emergencies
            </div>
            <div className="font-outfit text-3xl font-bold mt-1 text-brand-text-primary">
              {pendingRequestsCount}
            </div>
            <div className="text-[10px] text-brand-text-secondary mt-1">
              Out of {emergencies.length} total requests
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-xl flex items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-brand-violet/10 border border-brand-violet/25 text-brand-violet-light">
            <CheckSquare size={22} />
          </div>
          <div>
            <div className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider">
              Active Deployments
            </div>
            <div className="font-outfit text-3xl font-bold mt-1 text-brand-text-primary">
              {activeTasksCount}
            </div>
            <div className="text-[10px] text-brand-text-secondary mt-1">
              {tasks.filter((t) => t.status === 'COMPLETED').length} tasks completed
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-xl flex items-start gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-brand-teal/10 border border-brand-teal/25 text-brand-teal-light">
            <Users size={22} />
          </div>
          <div>
            <div className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider">
              Available Volunteers
            </div>
            <div className="font-outfit text-3xl font-bold mt-1 text-brand-text-primary">
              {availableVolunteersCount}
            </div>
            <div className="text-[10px] text-brand-text-secondary mt-1">
              Roster: {volunteers.length} members
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-xl flex items-start gap-4">
          <div className={`flex items-center justify-center w-12 h-12 rounded-lg border transition-colors ${
            lowStockResources.length > 0
              ? 'bg-brand-amber/10 border-brand-amber/30 text-brand-amber'
              : 'bg-brand-teal/10 border-brand-teal/25 text-brand-teal-light'
          }`}>
            <Package size={22} />
          </div>
          <div>
            <div className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider">
              Low-Stock Supplies
            </div>
            <div className={`font-outfit text-3xl font-bold mt-1 ${
              lowStockResources.length > 0 ? 'text-brand-amber' : 'text-brand-text-primary'
            }`}>
              {lowStockResources.length}
            </div>
            <div className="text-[10px] text-brand-text-secondary mt-1">
              {resources.length} stock line items logged
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resource stocks levels chart */}
        <div className="glass-panel p-6 rounded-2xl border border-brand-border">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={16} className="text-brand-teal-light" />
            <h3 className="font-outfit font-semibold text-sm uppercase tracking-wider text-brand-text-primary">
              Resource Stock Levels
            </h3>
          </div>
          {resourceChartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-brand-text-secondary">
              No inventory logged
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resourceChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderColor: 'rgba(96, 125, 108, 0.2)',
                      borderRadius: '8px',
                      color: '#2C3531',
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconSize={12} wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="Current" fill="#607D6C" name="Current Stock" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="SafetyLimit" fill="#D4A373" name="Safety Threshold" radius={[4, 4, 0, 0]} opacity={0.6} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Emergency Status Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-brand-border">
          <h3 className="font-outfit font-semibold text-sm uppercase tracking-wider text-brand-text-primary mb-6">
            Emergency Request Status Distribution
          </h3>
          {emergencyChartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-brand-text-secondary">
              No emergency requests reported
            </div>
          ) : (
            <div className="h-64 grid grid-cols-1 md:grid-cols-2 items-center">
              <div className="h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={emergencyChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {emergencyChartData.map((entry, index) => {
                        const sName = String(entry.name).toUpperCase().replace(' ', '_');
                        const color = COLORS_EMERGENCY[sName] || COLORS_EMERGENCY.DEFAULT;
                        return <Cell key={`cell-${index}`} fill={color} />;
                      })}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderColor: 'rgba(96, 125, 108, 0.2)',
                        borderRadius: '8px',
                        color: '#2C3531',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 px-4">
                {emergencyChartData.map((entry, index) => {
                  const sName = String(entry.name).toUpperCase().replace(' ', '_');
                  const color = COLORS_EMERGENCY[sName] || COLORS_EMERGENCY.DEFAULT;
                  return (
                    <div key={entry.name} className="flex items-center justify-between text-xs border-b border-brand-border/40 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-brand-text-secondary capitalize font-medium">{entry.name}</span>
                      </div>
                      <span className="font-semibold text-brand-text-primary">{entry.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Alerts & Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Recent Audit activity */}
        <div className="glass-panel p-6 rounded-2xl border border-brand-border lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileSpreadsheet size={16} className="text-brand-violet-light" />
              <h3 className="font-outfit font-semibold text-sm uppercase tracking-wider text-brand-text-primary">
                Operator Security Log Stream
              </h3>
            </div>
            <button
              onClick={() => navigate('/audit-logs')}
              className="text-xs text-brand-text-secondary hover:text-brand-violet-light flex items-center gap-1 cursor-pointer"
            >
              See all logs <ChevronRight size={14} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-brand-border text-brand-text-secondary">
                  <th className="py-2.5 font-semibold uppercase">Timestamp</th>
                  <th className="py-2.5 font-semibold uppercase">Actor</th>
                  <th className="py-2.5 font-semibold uppercase">Operation</th>
                  <th className="py-2.5 font-semibold uppercase">Target Entity</th>
                  <th className="py-2.5 font-semibold uppercase">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/45">
                {auditLogs.slice(0, 5).map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors text-brand-text-secondary">
                    <td className="py-2.5 whitespace-nowrap text-brand-text-muted">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-2.5 font-medium text-brand-text-primary">
                      {log.user ? log.user.name : `ID: ${log.user_id}`}
                    </td>
                    <td className="py-2.5 font-semibold text-brand-violet-light">
                      {log.action}
                    </td>
                    <td className="py-2.5 font-medium">
                      {log.entity_type} #{log.entity_id}
                    </td>
                    <td className="py-2.5 max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-brand-text-muted">
                      No security audit log transactions recorded
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Active Disasters Checklist */}
        <div className="glass-panel p-6 rounded-2xl border border-brand-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-outfit font-semibold text-sm uppercase tracking-wider text-brand-text-primary">
              Active Crisis Zones
            </h3>
            <button
              onClick={() => navigate('/disasters')}
              className="text-xs text-brand-text-secondary hover:text-brand-violet-light flex items-center gap-1 cursor-pointer"
            >
              Manage <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {disasters.filter(d => d.status === 'ACTIVE').slice(0, 4).map((d) => (
              <div key={d.id} className="p-3.5 rounded-lg border border-brand-border bg-brand-surface/30">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-xs text-brand-text-primary">{d.name}</h4>
                  <StatusBadge status={d.severity} type="priority" />
                </div>
                <p className="text-[11px] text-brand-text-secondary mt-1.5 line-clamp-2">
                  {d.description || 'No description logged.'}
                </p>
                <div className="flex items-center justify-between text-[9px] text-brand-text-muted mt-3 pt-2 border-t border-brand-border/40">
                  <span>Location: {d.area_name || 'N/A'}</span>
                  <span>ID: #{d.id}</span>
                </div>
              </div>
            ))}
            {disasters.filter(d => d.status === 'ACTIVE').length === 0 && (
              <div className="py-12 text-center text-xs text-brand-text-muted">
                No active disaster events logged.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
