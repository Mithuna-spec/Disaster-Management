import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../context/ToastContext';
import * as tasksApi from '../api/tasks';
import * as volunteersApi from '../api/volunteers';
import * as emergencyApi from '../api/emergencyRequests';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import {
  CheckSquare,
  Plus,
  Trash2,
  UserPlus,
  Clock,
  Briefcase,
  Search,
  Filter,
  Users,
  AlertCircle,
  FileText,
  MapPin,
  X,
} from 'lucide-react';

export default function Tasks() {
  const { showSuccess, showError } = useToast();
  const [tasks, setTasks] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals / Actions
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Form Fields for task creation
  const [newEmergencyId, setNewEmergencyId] = useState('');
  const [newTaskType, setNewTaskType] = useState('RESCUE_DEPLOYMENT');
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tasksData, volunteersData, emergenciesData] = await Promise.all([
        tasksApi.getTasks(),
        volunteersApi.getVolunteers(),
        emergencyApi.getEmergencyRequests(),
      ]);
      setTasks(tasksData);
      setVolunteers(volunteersData);
      setEmergencies(emergenciesData);
    } catch (err) {
      console.error('Failed to load tasks data:', err);
      setError('Failed to synchronize deployment tasks with the central EOC. Verify connections.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newEmergencyId) {
      showError('Please select a linked emergency request.');
      return;
    }

    setActionLoading(true);
    try {
      const task = await tasksApi.createTask(newEmergencyId, newTaskType);
      showSuccess(`Deployment Task #${task.id} initialized.`);
      setShowCreateModal(false);
      setNewEmergencyId('');
      
      // Refresh tasks
      const updated = await tasksApi.getTasks();
      setTasks(updated);
    } catch (err) {
      showError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await tasksApi.updateTaskStatus(taskId, newStatus);
      showSuccess(`Task status changed to ${newStatus}`);
      const updated = await tasksApi.getTasks();
      setTasks(updated);
    } catch (err) {
      showError(err.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task? All linked volunteer assignments will be cancelled.')) {
      return;
    }
    try {
      await tasksApi.deleteTask(taskId);
      showSuccess('Task deleted successfully');
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) {
      showError(err.message);
    }
  };

  const openAssignModal = (task) => {
    setSelectedTask(task);
    setShowAssignModal(true);
  };

  const closeAssignModal = () => {
    setSelectedTask(null);
    setShowAssignModal(false);
  };

  const handleAssignVolunteer = async (volunteerId) => {
    if (!selectedTask) return;
    setActionLoading(true);
    try {
      await tasksApi.assignVolunteer(selectedTask.id, volunteerId);
      showSuccess(`Volunteer #${volunteerId} assigned to Task #${selectedTask.id}`);
      
      // Refresh tasks
      const updated = await tasksApi.getTasks();
      setTasks(updated);
      
      // Update selectedTask local assignments representation
      const refreshedTask = updated.find(t => t.id === selectedTask.id);
      setSelectedTask(refreshedTask);
    } catch (err) {
      showError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter list
  const filteredTasks = tasks.filter((t) => {
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || t.task_type === typeFilter;
    
    // Search by task ID, type or linked emergency request location/description
    const req = emergencies.find(e => e.id === t.emergency_request_id);
    const searchString = `${t.id} ${t.task_type} ${req?.description || ''} ${req?.location_name || ''}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesType && matchesSearch;
  });

  // Extract unique task types for filters
  const taskTypes = [...new Set(tasks.map(t => t.task_type))];

  return (
    <div className="p-6 space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="text-brand-violet-light" size={20} />
          <h3 className="font-outfit font-semibold text-sm uppercase tracking-wider text-brand-text-primary">
            Deployment Tasks Log
          </h3>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-brand-violet hover:bg-brand-violet-light text-white rounded-lg transition-all cursor-pointer"
        >
          <Plus size={14} /> Initialize Task
        </button>
      </div>

      {/* Filters Dashboard */}
      <div className="glass-panel p-4 rounded-xl border border-brand-border flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-text-muted">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search by ID, type, emergency..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm glass-input"
          />
        </div>

        {/* Filters Select */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-brand-text-secondary">
            <Filter size={12} /> Filter:
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded bg-brand-surface border border-brand-border text-xs text-brand-text-primary focus:outline-none focus:border-brand-violet"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING_ACCEPTANCE">PENDING_ACCEPTANCE</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="REJECTED">REJECTED</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded bg-brand-surface border border-brand-border text-xs text-brand-text-primary focus:outline-none focus:border-brand-violet"
          >
            <option value="ALL">All Types</option>
            {taskTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Tasks */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          title="No Deployment Tasks Logs"
          description="Initialize a deployment task or clear filters to review logs."
          icon={CheckSquare}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => {
            const req = emergencies.find((e) => e.id === task.emergency_request_id);

            return (
              <div
                key={task.id}
                className="glass-card p-6 rounded-xl border border-brand-border flex flex-col justify-between"
              >
                <div>
                  {/* Title & Status */}
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <StatusBadge status={task.status} type="status" />
                      <div className="text-[9px] text-brand-text-muted mt-1 font-mono uppercase tracking-wider">
                        Deployment Type
                      </div>
                      <h4 className="font-outfit font-bold text-sm text-brand-text-primary mt-0.5">
                        {task.task_type}
                      </h4>
                    </div>
                    <div className="text-[10px] text-brand-text-muted font-mono">
                      TASK #{task.id}
                    </div>
                  </div>

                  {/* Linked Emergency Request Summary */}
                  {req && (
                    <div className="mt-4 p-3 rounded bg-black/20 border border-brand-border/40 text-xs">
                      <div className="font-semibold text-brand-text-secondary flex items-center gap-1">
                        <AlertCircle size={12} className="text-brand-rose" />
                        Linked Emergency Request #{req.id}
                      </div>
                      <p className="text-brand-text-secondary mt-1 line-clamp-2 italic">
                        "{req.description}"
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-brand-text-muted mt-2">
                        <MapPin size={10} /> {req.location_name}
                      </div>
                    </div>
                  )}

                  {/* Multiple Assigned Volunteers list */}
                  <div className="mt-5 space-y-2">
                    <div className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                      <Users size={12} className="text-brand-teal" />
                      Assigned Operators
                    </div>
                    
                    {task.volunteer_assignments && task.volunteer_assignments.length > 0 ? (
                      <div className="space-y-1.5">
                        {task.volunteer_assignments.map((assignment) => (
                          <div
                            key={assignment.id}
                            className="flex items-center justify-between text-xs bg-brand-surface p-2 rounded border border-brand-border/50"
                          >
                            <div className="truncate pr-2">
                              <span className="font-semibold text-brand-text-primary">
                                Vol #{assignment.volunteer_id}
                              </span>
                              {assignment.volunteer?.user?.name && (
                                <span className="text-brand-text-secondary text-[11px] ml-1">
                                  ({assignment.volunteer.user.name})
                                </span>
                              )}
                            </div>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                              assignment.status === 'ACCEPTED'
                                ? 'bg-[#607D6C]/15 text-[#4F6759] border-[#607D6C]/25'
                                : assignment.status === 'REJECTED'
                                ? 'bg-[#C26D5C]/15 text-[#C26D5C] border-[#C26D5C]/25'
                                : 'bg-[#D4A373]/15 text-[#B88555] border-[#D4A373]/25'
                            }`}>
                              {assignment.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-brand-text-muted italic py-1">
                        No volunteer operators currently assigned.
                      </div>
                    )}
                  </div>

                  {/* Timestamps */}
                  <div className="mt-4 pt-3 border-t border-brand-border/30 grid grid-cols-2 gap-2 text-[10px] text-brand-text-muted">
                    <div className="flex items-center gap-1">
                      <Clock size={10} />
                      <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
                    </div>
                    {task.completed_at && (
                      <div className="text-right text-brand-emerald font-semibold">
                        Done: {new Date(task.completed_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="border-t border-brand-border/40 pt-4 mt-6 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <select
                      value={task.status}
                      onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                      className="px-2 py-1 bg-brand-surface border border-brand-border rounded text-[11px] text-brand-text-primary focus:outline-none focus:border-brand-violet cursor-pointer"
                    >
                      <option value="PENDING_ACCEPTANCE">PENDING_ACCEPTANCE</option>
                      <option value="ASSIGNED">ASSIGNED</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 text-brand-text-secondary hover:text-brand-rose hover:bg-brand-rose/10 rounded transition-colors cursor-pointer"
                      title="Delete Deployment"
                    >
                      <Trash2 size={14} />
                    </button>

                    {task.status !== 'COMPLETED' && (
                      <button
                        onClick={() => openAssignModal(task)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded bg-brand-teal hover:bg-brand-teal-light text-white transition-all cursor-pointer"
                      >
                        <UserPlus size={13} />
                        Assign
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Initialize Deployment Task */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-brand-bg border border-brand-border rounded-xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-brand-surface border-b border-brand-border flex items-center justify-between">
              <h3 className="font-outfit font-semibold text-sm uppercase tracking-wider text-brand-text-primary">
                Initialize Deployment Task
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded hover:bg-white/5 text-brand-text-secondary cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider block">
                  Select Active Emergency Request
                </label>
                <select
                  required
                  value={newEmergencyId}
                  onChange={(e) => setNewEmergencyId(e.target.value)}
                  className="w-full p-2.5 text-sm font-medium glass-input appearance-none cursor-pointer"
                >
                  <option value="">-- Choose Emergency Request --</option>
                  {emergencies
                    .filter((e) => e.status !== 'RESOLVED')
                    .map((e) => (
                      <option key={e.id} value={e.id}>
                        [REQ #{e.id}] {e.description.substring(0, 45)}... ({e.location_name})
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider block">
                  Task Deployment Type
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FOOD_DELIVERY, MEDICAL_ASSISTANCE..."
                  value={newTaskType}
                  onChange={(e) => setNewTaskType(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-sm glass-input"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold uppercase bg-brand-surface border border-brand-border rounded-lg text-brand-text-primary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-semibold uppercase bg-brand-violet hover:bg-brand-violet-light text-white rounded-lg transition-all cursor-pointer"
                >
                  {actionLoading ? 'Initializing...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Volunteer to Task */}
      {showAssignModal && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg bg-brand-bg border border-brand-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 bg-brand-surface border-b border-brand-border flex items-center justify-between">
              <div>
                <h3 className="font-outfit font-semibold text-sm uppercase tracking-wider text-brand-text-primary">
                  Assign Volunteer Operators
                </h3>
                <span className="text-[10px] text-brand-text-secondary font-mono">
                  TASK #{selectedTask.id} • {selectedTask.task_type}
                </span>
              </div>
              <button
                onClick={closeAssignModal}
                className="p-1 rounded hover:bg-white/5 text-brand-text-secondary cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* List of Available Volunteers */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="text-xs text-brand-text-secondary mb-3">
                Below are the currently registered volunteer profiles. You can assign multiple operators to a task.
              </div>

              {volunteers.length === 0 ? (
                <EmptyState
                  title="No Volunteers Registered"
                  description="Register operators and configure profiles to initialize task dispatching."
                />
              ) : (
                <div className="space-y-3">
                  {volunteers.map((vol) => {
                    const isAlreadyAssigned = selectedTask.volunteer_assignments?.some(
                      (va) => va.volunteer_id === vol.id
                    );

                    return (
                      <div
                        key={vol.id}
                        className={`p-3 rounded-lg border flex items-center justify-between gap-4 transition-colors ${
                          isAlreadyAssigned
                            ? 'bg-brand-violet/5 border-brand-violet/20 opacity-70'
                            : 'bg-brand-surface/30 border-brand-border hover:border-brand-border-active'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-brand-text-primary">
                              Volunteer Operator #{vol.id}
                            </span>
                            {vol.user?.name && (
                              <span className="text-xs text-brand-text-secondary">
                                ({vol.user.name})
                              </span>
                            )}
                            <span className={`w-2 h-2 rounded-full ${vol.availability ? 'bg-brand-emerald animate-pulse' : 'bg-brand-rose'}`} />
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {vol.medical_training && (
                              <span className="text-[9px] bg-brand-rose/15 border border-brand-rose/20 text-brand-rose px-1.5 py-0.2 rounded font-bold uppercase">
                                Medical Training
                              </span>
                            )}
                            {vol.vehicle_available && (
                              <span className="text-[9px] bg-brand-teal/15 border border-brand-teal/20 text-brand-teal-light px-1.5 py-0.2 rounded font-bold uppercase">
                                Vehicle ({vol.vehicle_type || 'Yes'})
                              </span>
                            )}
                            <span className="text-[9px] text-brand-text-muted">
                              Skills: {vol.skills ? vol.skills.join(', ') : 'None'}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleAssignVolunteer(vol.id)}
                          disabled={isAlreadyAssigned || !vol.availability || actionLoading}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                            isAlreadyAssigned
                              ? 'bg-brand-surface text-brand-text-muted border border-brand-border'
                              : !vol.availability
                              ? 'bg-transparent text-brand-rose border border-brand-rose/20 cursor-not-allowed'
                              : 'bg-brand-teal hover:bg-brand-teal-light text-white shadow'
                          }`}
                        >
                          {isAlreadyAssigned ? 'Assigned' : 'Assign'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-brand-surface border-t border-brand-border flex justify-end">
              <button
                onClick={closeAssignModal}
                className="px-4 py-2 text-xs font-semibold uppercase bg-brand-surface border border-brand-border rounded-lg text-brand-text-primary cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
