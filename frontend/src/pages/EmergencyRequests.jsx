import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../context/ToastContext';
import * as emergencyApi from '../api/emergencyRequests';
import * as tasksApi from '../api/tasks';
import * as disastersApi from '../api/disasters';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle,
  Clock,
  MapPin,
  Users,
  HeartPulse,
  Brain,
  X,
  UserCheck,
  AlertTriangle,
  ChevronRight,
  Trash2,
} from 'lucide-react';

export default function EmergencyRequests() {
  const { showSuccess, showError } = useToast();
  const [requests, setRequests] = useState([]);
  const [disasters, setDisasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Request for AI matching drawer
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [customTaskType, setCustomTaskType] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reqs, dists] = await Promise.all([
        emergencyApi.getEmergencyRequests(),
        disastersApi.getDisasters(),
      ]);
      setRequests(reqs);
      setDisasters(dists);
    } catch (err) {
      console.error('Failed to load emergency data:', err);
      setError('Failed to fetch emergency requests database. Ensure EOC network is online.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load AI recommendations when selectedRequest changes
  const loadRecommendations = async (requestId) => {
    setMatchingLoading(true);
    try {
      const data = await emergencyApi.getRecommendedVolunteers(requestId);
      setRecommendations(data.recommendations || []);
    } catch (err) {
      showError(`AI Matching failed: ${err.message}`);
      setRecommendations([]);
    } finally {
      setMatchingLoading(false);
    }
  };

  const handleOpenMatching = (request) => {
    setSelectedRequest(request);
    setCustomTaskType(request.category ? `${request.category.toUpperCase()}_RESPONSE` : 'RESCUE_DEPLOYMENT');
    loadRecommendations(request.id);
  };

  const handleCloseMatching = () => {
    setSelectedRequest(null);
    setRecommendations([]);
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await emergencyApi.updateEmergencyRequestStatus(id, newStatus);
      showSuccess(`Request status updated to ${newStatus}`);
      // Refresh list
      const updated = await emergencyApi.getEmergencyRequests();
      setRequests(updated);
    } catch (err) {
      showError(err.message);
    }
  };

  const handleDeleteRequest = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this emergency request? This action is audited.')) {
      return;
    }
    try {
      await emergencyApi.deleteEmergencyRequest(id);
      showSuccess('Emergency request deleted');
      setRequests(prev => prev.filter(r => r.id !== id));
      if (selectedRequest?.id === id) {
        handleCloseMatching();
      }
    } catch (err) {
      showError(err.message);
    }
  };

  // Perform Task Creation + Volunteer Assignment Flow
  const handleAssignVolunteer = async (volunteerId) => {
    if (!selectedRequest) return;
    
    setMatchingLoading(true);
    try {
      // Step 1: Create the Task linked to this emergency request
      const task = await tasksApi.createTask(selectedRequest.id, customTaskType);
      
      // Step 2: Assign the volunteer to this task
      await tasksApi.assignVolunteer(task.id, volunteerId);
      
      // Step 3: Automatically move emergency request to ACTIVE status if it was PENDING
      if (selectedRequest.status === 'PENDING') {
        await emergencyApi.updateEmergencyRequestStatus(selectedRequest.id, 'ACTIVE');
      }

      showSuccess(`Task #${task.id} created successfully and assigned to Volunteer #${volunteerId}`);
      handleCloseMatching();
      
      // Refresh database records
      const updated = await emergencyApi.getEmergencyRequests();
      setRequests(updated);
    } catch (err) {
      showError(`Assignment transaction failed: ${err.message}`);
    } finally {
      setMatchingLoading(false);
    }
  };

  // Filter logic
  const filteredRequests = requests.filter((r) => {
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || r.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'ALL' || r.category === categoryFilter;
    const matchesSearch = 
      r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.location_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesPriority && matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="p-6">
        <LoadingState variant="card" count={6} />
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

  return (
    <div className="p-6 space-y-6 relative min-h-[calc(100vh-4rem)]">
      {/* Search & Filter Panel */}
      <div className="glass-panel p-4 rounded-xl border border-brand-border flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-text-muted">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search by description, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm glass-input"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-brand-text-secondary">
            <Filter size={12} /> Filter by:
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded bg-brand-surface border border-brand-border text-xs text-brand-text-primary focus:outline-none focus:border-brand-violet"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 rounded bg-brand-surface border border-brand-border text-xs text-brand-text-primary focus:outline-none focus:border-brand-violet"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded bg-brand-surface border border-brand-border text-xs text-brand-text-primary focus:outline-none focus:border-brand-violet"
          >
            <option value="ALL">All Categories</option>
            <option value="FLOOD">FLOOD</option>
            <option value="MEDICAL">MEDICAL</option>
            <option value="FIRE">FIRE</option>
            <option value="OTHER">OTHER</option>
          </select>
        </div>
      </div>

      {/* Grid of Emergency Cards */}
      {filteredRequests.length === 0 ? (
        <EmptyState
          title="No Emergency Requests Found"
          description="Try adjusting your status, priority, or search term query."
          icon={ShieldAlert}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className={`glass-card p-6 rounded-xl flex flex-col justify-between border ${
                req.status === 'PENDING'
                  ? 'border-brand-amber/20 hover:border-brand-amber/40 bg-brand-amber/5'
                  : req.status === 'ACTIVE'
                  ? 'border-brand-rose/25 hover:border-brand-rose/40 bg-brand-rose/5'
                  : 'border-brand-border'
              }`}
            >
              <div>
                {/* Header info */}
                <div className="flex justify-between items-start gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={req.status} type="status" />
                    <StatusBadge status={req.priority} type="priority" />
                  </div>
                  <div className="text-[10px] text-brand-text-muted font-mono">
                    REQ #{req.id}
                  </div>
                </div>

                {/* Description */}
                <h3 className="font-outfit font-semibold text-sm text-brand-text-primary mt-4 line-clamp-3">
                  {req.description}
                </h3>

                {/* Urgency Reason */}
                {req.urgency_reason && (
                  <div className="mt-2.5 p-2.5 rounded bg-black/20 border border-brand-border text-xs text-brand-amber flex items-start gap-1.5">
                    <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                    <span>{req.urgency_reason}</span>
                  </div>
                )}

                {/* Meta list */}
                <div className="mt-4 space-y-2 text-xs text-brand-text-secondary">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-brand-text-muted" />
                    <span className="truncate" title={req.location_name}>{req.location_name}</span>
                    <span className="text-[10px] text-brand-text-muted">
                      ({req.location_lat.toFixed(2)}, {req.location_lng.toFixed(2)})
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Users size={14} className="text-brand-text-muted" />
                      <span>{req.people_affected} affected</span>
                    </div>
                    {req.injured && (
                      <div className="flex items-center gap-1.5 text-brand-rose">
                        <HeartPulse size={14} />
                        <span className="font-semibold">Injuries reported</span>
                      </div>
                    )}
                  </div>

                  {req.disaster_event_id && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-brand-border text-[10px] text-brand-violet-light">
                      Linked to Disaster Event #{req.disaster_event_id}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="border-t border-brand-border/40 pt-4 mt-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <select
                    value={req.status}
                    onChange={(e) => handleUpdateStatus(req.id, e.target.value)}
                    className="px-2 py-1 bg-brand-surface border border-brand-border rounded text-[11px] text-brand-text-primary focus:outline-none"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="RESOLVED">RESOLVED</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteRequest(req.id)}
                    className="p-1.5 text-brand-text-secondary hover:text-brand-rose hover:bg-brand-rose/10 rounded transition-colors cursor-pointer"
                    title="Delete Request"
                  >
                    <Trash2 size={14} />
                  </button>

                  {req.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleOpenMatching(req)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-brand-violet hover:bg-brand-violet-light text-white shadow transition-all cursor-pointer"
                    >
                      <Brain size={13} />
                      AI Matching
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Volunteer Matching Slideout Drawer */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          {/* Backdrop Dismiss Area */}
          <div className="flex-1" onClick={handleCloseMatching} />

          {/* Drawer Body */}
          <div className="w-full max-w-xl bg-brand-bg border-l border-brand-border h-full flex flex-col shadow-2xl">
            {/* Header */}
            <div className="px-6 py-4 bg-brand-surface border-b border-brand-border flex items-center justify-between">
              <div className="flex items-center gap-2 text-brand-violet-light">
                <Brain size={20} className="pulse-subtle" />
                <h3 className="font-outfit font-semibold text-base uppercase tracking-wider text-brand-text-primary">
                  AI Volunteer Match Maker
                </h3>
              </div>
              <button
                onClick={handleCloseMatching}
                className="p-1 rounded-lg hover:bg-white/5 text-brand-text-secondary hover:text-brand-text-primary cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Request Summary Banner */}
            <div className="p-4 bg-brand-violet/5 border-b border-brand-border/40 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-brand-text-secondary font-mono">EMERGENCY REQUEST #{selectedRequest.id}</span>
                <StatusBadge status={selectedRequest.priority} type="priority" />
              </div>
              <p className="text-xs font-medium text-brand-text-primary line-clamp-2 leading-relaxed">
                {selectedRequest.description}
              </p>
              <div className="flex items-center justify-between pt-1">
                <div className="text-[10px] text-brand-text-muted flex items-center gap-1">
                  <MapPin size={10} /> {selectedRequest.location_name}
                </div>
                {selectedRequest.injured && (
                  <span className="text-[10px] font-bold text-brand-rose uppercase">Injured reported</span>
                )}
              </div>
            </div>

            {/* Task creation parameters form */}
            <div className="px-6 py-4 border-b border-brand-border/40 bg-brand-surface/20 flex flex-col gap-3">
              <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider block">
                Deployment Task Type Definition
              </label>
              <input
                type="text"
                placeholder="e.g. MEDICAL_FIRST_AID, FLOOD_WATER_RESCUE..."
                value={customTaskType}
                onChange={(e) => setCustomTaskType(e.target.value.toUpperCase())}
                className="w-full px-3 py-1.5 text-xs glass-input"
              />
              <p className="text-[9px] text-brand-text-muted leading-relaxed">
                * Assigning a recommended volunteer will instantiate a deployment task of this type linked to emergency request #{selectedRequest.id}.
              </p>
            </div>

            {/* Recommendations List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {matchingLoading ? (
                <div className="space-y-4 py-8 text-center flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full border-2 border-brand-violet/20 border-t-brand-violet animate-spin" />
                  <span className="text-xs text-brand-text-secondary animate-pulse uppercase tracking-wider">
                    Calculating matchmaking rankings...
                  </span>
                </div>
              ) : recommendations.length === 0 ? (
                <EmptyState
                  title="No Recommendations Available"
                  description="Ensure volunteers are registered, marked as available, and skill profiles match the request category."
                  icon={Users}
                />
              ) : (
                <div className="space-y-4">
                  {recommendations.map((rec, index) => {
                    // Match visual score styling
                    const score = rec.score;
                    const matchStrength = 
                      score >= 80 ? 'Strong Match' :
                      score >= 50 ? 'Moderate Match' : 'Weak Match';
                    const scoreColor =
                      score >= 80 ? 'text-brand-emerald' :
                      score >= 50 ? 'text-brand-amber' : 'text-brand-rose';

                    return (
                      <div
                        key={rec.volunteer_id}
                        className="p-4 rounded-xl border border-brand-border bg-brand-surface/20 hover:border-brand-violet/20 transition-all flex flex-col gap-3"
                      >
                        {/* Header: Score & Name */}
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-brand-violet-light uppercase">
                                Recommendation #{index + 1}
                              </span>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded bg-white/5 border border-brand-border ${scoreColor}`}>
                                {matchStrength}
                              </span>
                            </div>
                            <h4 className="font-semibold text-sm text-brand-text-primary mt-1">
                              Volunteer Operator #{rec.volunteer_id} (User ID: {rec.user_id})
                            </h4>
                          </div>

                          <div className="text-right">
                            <span className={`text-xl font-bold font-mono ${scoreColor}`}>
                              {score}%
                            </span>
                            <div className="text-[10px] text-brand-text-muted mt-0.5">
                              Match Score
                            </div>
                          </div>
                        </div>

                        {/* Match Details */}
                        <div className="text-xs text-brand-text-secondary space-y-1">
                          <div className="flex items-center gap-1.5">
                            <MapPin size={12} className="text-brand-text-muted" />
                            <span>Location Distance: <strong className="text-brand-text-primary">{rec.distance_km} km</strong> away</span>
                          </div>

                          {/* Reasons checklist */}
                          <div className="mt-2.5 space-y-1 bg-black/10 p-2.5 rounded border border-brand-border/40">
                            <div className="text-[10px] font-semibold text-brand-text-muted uppercase tracking-wider mb-1.5">
                              Ranking Evaluation Reasons
                            </div>
                            {rec.reasons.map((reason, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                                <CheckCircle size={10} className="text-brand-teal flex-shrink-0" />
                                <span>{reason}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Action Assign */}
                        <div className="pt-2 border-t border-brand-border/40 flex justify-end">
                          <button
                            onClick={() => handleAssignVolunteer(rec.volunteer_id)}
                            disabled={matchingLoading}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-teal hover:bg-brand-teal-light text-white transition-all cursor-pointer"
                          >
                            <UserCheck size={14} />
                            Deploy & Assign
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
