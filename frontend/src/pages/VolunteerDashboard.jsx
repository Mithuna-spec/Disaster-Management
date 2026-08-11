import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import * as tasksApi from '../api/tasks';
import * as volunteerApi from '../api/volunteers';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import {
  CheckSquare,
  Clock,
  ThumbsUp,
  ThumbsDown,
  MapPin,
  HeartPulse,
  Truck,
  User,
  Radio,
  Plus,
  BookOpen,
  Calendar,
  AlertTriangle,
  X,
  FileText,
} from 'lucide-react';

export default function VolunteerDashboard() {
  const { user, volunteerProfile, refreshVolunteerProfile } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Profile Form (if profile doesn't exist yet)
  const [skillsInput, setSkillsInput] = useState('');
  const [interestsInput, setInterestsInput] = useState('');
  const [vehicleAvailable, setVehicleAvailable] = useState(false);
  const [vehicleType, setVehicleType] = useState('');
  const [medicalTraining, setMedicalTraining] = useState(false);
  const [locName, setLocName] = useState('EOC Central');
  const [locLat, setLocLat] = useState('17.40');
  const [locLng, setLocLng] = useState('78.50');
  const [formLoading, setFormLoading] = useState(false);

  // Selected Task for Details Modal/Drawer
  const [selectedTask, setSelectedTask] = useState(null);

  const loadData = useCallback(async () => {
    if (!volunteerProfile) return;
    setLoading(true);
    setError(null);
    try {
      const tasksData = await tasksApi.getTasks();
      setTasks(tasksData);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch volunteer deployment board.');
    } finally {
      setLoading(false);
    }
  }, [volunteerProfile]);

  useEffect(() => {
    if (volunteerProfile) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [volunteerProfile, loadData]);

  // Open details modal if query parameter review_task_id is present
  useEffect(() => {
    const reviewTaskId = searchParams.get('review_task_id');
    if (reviewTaskId && tasks.length > 0) {
      const taskToReview = tasks.find(t => t.id === parseInt(reviewTaskId));
      if (taskToReview) {
        setSelectedTask(taskToReview);
        // Clear search parameters to avoid reopening on reload
        setSearchParams({});
      }
    }
  }, [searchParams, setSearchParams, tasks]);

  // Handle volunteer profile creation
  const handleCreateProfile = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const skills = skillsInput.split(',').map(s => s.trim()).filter(Boolean);
      const interests = interestsInput.split(',').map(i => i.trim()).filter(Boolean);
      
      const payload = {
        skills,
        interests,
        vehicle_available: vehicleAvailable,
        vehicle_type: vehicleAvailable ? vehicleType : null,
        medical_training: medicalTraining,
        location_name: locName,
        location_lat: parseFloat(locLat || 0),
        location_lng: parseFloat(locLng || 0),
      };

      await volunteerApi.createVolunteerProfile(payload);
      showSuccess('Volunteer profile successfully registered in EOC roster.');
      await refreshVolunteerProfile();
    } catch (err) {
      showError(`Profile registration failed: ${err.message}`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleAccept = async (taskId) => {
    try {
      await tasksApi.acceptTask(taskId);
      showSuccess('Task accepted successfully.');
      setSelectedTask(null);
      loadData();
    } catch (err) {
      showError('Unable to accept this task. Please try again.');
      console.error('Accept task API failed:', err);
    }
  };

  const handleReject = async (taskId) => {
    if (!window.confirm('Are you sure you want to reject this task?')) {
      return;
    }
    try {
      await tasksApi.rejectTask(taskId);
      showSuccess('Task rejected.');
      setSelectedTask(null);
      loadData();
    } catch (err) {
      showError('Unable to reject this task. Please try again.');
      console.error('Reject task API failed:', err);
    }
  };

  // Profile not initialized state
  if (!volunteerProfile && !loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6 text-[#2C3531]">
        <div className="glass-panel p-6 rounded-2xl border border-brand-border bg-[#FFFFFF] text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#607D6C]/10 border border-[#607D6C]/30 text-[#607D6C] mx-auto mb-4">
            <Radio size={22} className="pulse-subtle" />
          </div>
          <h2 className="font-outfit font-bold text-lg text-[#2C3531] mb-1">
            Initialize Volunteer Profile
          </h2>
          <p className="text-xs text-brand-text-secondary leading-relaxed">
            Welcome, {user?.name}. To join rescue missions, you must register your skill set, location, and training.
          </p>
        </div>

        <form onSubmit={handleCreateProfile} className="glass-panel p-6 rounded-2xl border border-brand-border bg-[#FFFFFF] space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider block">
                Skills (comma-separated)
              </label>
              <input
                type="text"
                required
                placeholder="e.g. FIRST_AID, DISASTER_RESPONSE, WATER_RESCUE"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                className="w-full px-3 py-2 text-sm glass-input"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider block">
                Interests (comma-separated)
              </label>
              <input
                type="text"
                required
                placeholder="e.g. FOOD_DISTRIBUTION, DISASTER_RESPONSE"
                value={interestsInput}
                onChange={(e) => setInterestsInput(e.target.value)}
                className="w-full px-3 py-2 text-sm glass-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider block">
                Base Location Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Hyderabad"
                value={locName}
                onChange={(e) => setLocName(e.target.value)}
                className="w-full px-3 py-2 text-sm glass-input"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider block">
                Latitude Coordinate
              </label>
              <input
                type="number"
                step="0.0001"
                required
                value={locLat}
                onChange={(e) => setLocLat(e.target.value)}
                className="w-full px-3 py-2 text-sm glass-input"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider block">
                Longitude Coordinate
              </label>
              <input
                type="number"
                step="0.0001"
                required
                value={locLng}
                onChange={(e) => setLocLng(e.target.value)}
                className="w-full px-3 py-2 text-sm glass-input"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-brand-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={medicalTraining}
                onChange={(e) => setMedicalTraining(e.target.checked)}
                className="rounded border-brand-border bg-brand-surface text-[#607D6C] focus:ring-0 w-4 h-4 cursor-pointer"
              />
              Has Professional Medical Training
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-brand-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={vehicleAvailable}
                onChange={(e) => setVehicleAvailable(e.target.checked)}
                className="rounded border-brand-border bg-brand-surface text-[#607D6C] focus:ring-0 w-4 h-4 cursor-pointer"
              />
              Has Transport Vehicle Available
            </label>
          </div>

          {vehicleAvailable && (
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider block">
                Vehicle Type Description
              </label>
              <input
                type="text"
                placeholder="e.g. 4x4 Truck, Ambulance, Motorcycle"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full px-3 py-2 text-sm glass-input"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={formLoading}
            className="w-full flex items-center justify-center gap-2 py-3 mt-4 text-xs font-bold tracking-wider uppercase bg-[#607D6C] hover:bg-[#607D6C]/90 disabled:bg-brand-bg text-white rounded-lg transition-all cursor-pointer"
          >
            {formLoading ? 'Submitting Registry...' : 'Initialize Volunteer Profile'}
          </button>
        </form>
      </div>
    );
  }

  // Detect if task assignments schema is missing from the backend response
  const isMissingAssignments = tasks.length > 0 && tasks.every((t) => t.volunteer_assignments === undefined);

  // Filter tasks: find tasks assigned to the current volunteer profile
  const myAssignedTasks = tasks.filter((t) =>
    t.volunteer_assignments?.some((va) => va.volunteer_id === volunteerProfile?.id)
  );

  // Grouped by assignment status
  const pendingAcceptanceTasks = myAssignedTasks.filter((t) =>
    t.volunteer_assignments?.some(
      (va) => va.volunteer_id === volunteerProfile?.id && va.status === 'PENDING'
    )
  );

  const activeDeploymentsTasks = myAssignedTasks.filter((t) =>
    t.volunteer_assignments?.some(
      (va) => va.volunteer_id === volunteerProfile?.id && va.status === 'ACCEPTED'
    ) && t.status !== 'COMPLETED'
  );

  const completedDeploymentsTasks = myAssignedTasks.filter((t) =>
    t.volunteer_assignments?.some(
      (va) => va.volunteer_id === volunteerProfile?.id && va.status === 'ACCEPTED'
    ) && t.status === 'COMPLETED'
  );

  // Find user's own assignment status on a task
  const getMyAssignmentStatus = (task) => {
    const assignment = task.volunteer_assignments?.find(
      (va) => va.volunteer_id === volunteerProfile?.id
    );
    return assignment ? assignment.status : null;
  };

  if (loading) {
    return (
      <div className="p-6">
        <LoadingState variant="stats" count={3} />
        <LoadingState variant="card" count={3} />
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
    <div className="p-6 space-y-6 text-[#2C3531]">
      
      {/* Profile Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-4 rounded-xl flex items-center gap-3 bg-[#FFFFFF]">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#607D6C]/10 border border-[#607D6C]/20 text-[#607D6C]">
            <User size={18} />
          </div>
          <div>
            <div className="text-[10px] text-brand-text-secondary uppercase tracking-wider">
              Operator ID
            </div>
            <div className="text-sm font-semibold text-[#2C3531]">
              Volunteer Operator #{volunteerProfile?.id}
            </div>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl flex items-center gap-3 bg-[#FFFFFF]">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#D4A373]/15 border border-[#D4A373]/30 text-[#B88555]">
            <MapPin size={18} />
          </div>
          <div>
            <div className="text-[10px] text-brand-text-secondary uppercase tracking-wider">
              Active Coordinates
            </div>
            <div className="text-sm font-semibold text-[#2C3531] truncate max-w-[200px]" title={volunteerProfile?.location_name}>
              {volunteerProfile?.location_name} ({volunteerProfile?.location_lat}, {volunteerProfile?.location_lng})
            </div>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl flex items-center gap-3 bg-[#FFFFFF]">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#607D6C]/10 border border-[#607D6C]/20 text-[#607D6C]">
            <Truck size={18} />
          </div>
          <div>
            <div className="text-[10px] text-brand-text-secondary uppercase tracking-wider">
              Logistics Support
            </div>
            <div className="text-sm font-semibold text-[#2C3531]">
              {volunteerProfile?.vehicle_available ? `${volunteerProfile.vehicle_type || 'Vehicle'} Ready` : 'No Transport'}
            </div>
          </div>
        </div>
      </div>

      {/* Grid panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns (span 2): Pending and Active tasks */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* ACTION REQUIRED: Pending Task Assignments */}
          <div className="glass-panel p-6 rounded-2xl border border-brand-border bg-[#FFFFFF] space-y-4">
            <div className="border-b border-brand-border pb-3">
              <div className="text-[10px] font-bold text-[#D4A373] uppercase tracking-widest block">ACTION REQUIRED</div>
              <h3 className="font-outfit font-extrabold text-lg text-[#2C3531] mt-0.5">
                Pending Task Assignments
              </h3>
            </div>

            <div className="space-y-4">
              {isMissingAssignments ? (
                // Clearly report if the required relationship fields are missing from backend response
                <div className="p-4 rounded-xl border border-[#C26D5C]/35 bg-[#C26D5C]/10 text-xs text-[#C26D5C] space-y-2">
                  <div className="font-bold flex items-center gap-1.5 uppercase">
                    <AlertTriangle size={14} />
                    Unable to load task assignment details.
                  </div>
                  <p className="leading-relaxed">
                    The backend endpoint <code>GET /tasks/</code> does not expose the task-to-volunteer relationships in its serialized response. Eager loading (e.g. <code>joinedload</code>) is required to resolve assignments.
                  </p>
                </div>
              ) : (
                pendingAcceptanceTasks.map((task) => {
                  const req = task.emergency_request;
                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="p-5 rounded-xl border border-[#D4A373]/30 bg-[#D4A373]/5 hover:border-[#D4A373] transition-all cursor-pointer space-y-3.5 relative"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] text-[#B88555] font-mono font-bold block uppercase">Task #{task.id}</span>
                          <h4 className="font-bold text-sm text-[#2C3531] mt-0.5">{task.task_type}</h4>
                        </div>
                        <StatusBadge status="PENDING_ACCEPTANCE" type="status" />
                      </div>

                      {req && (
                        <p className="text-xs text-brand-text-secondary leading-relaxed border-t border-[#D4A373]/15 pt-2.5 font-medium italic">
                          "{req.description}"
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-brand-text-secondary pt-2 border-t border-brand-border/40">
                        <span className="flex items-center gap-1">
                          <MapPin size={10} className="text-[#607D6C]" /> {req?.location_name || 'N/A'}
                        </span>
                        {req?.injured && (
                          <span className="flex items-center gap-1 text-[#C26D5C] font-bold uppercase">
                            <HeartPulse size={10} /> Injury alert
                          </span>
                        )}
                      </div>

                      {/* Accept/Decline Inline Actions */}
                      <div className="flex gap-3 pt-2.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleReject(task.id)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-4 text-xs font-bold uppercase rounded-lg border border-[#C26D5C]/35 text-[#C26D5C] hover:bg-[#C26D5C]/10 transition-colors cursor-pointer"
                        >
                          <ThumbsDown size={12} /> Reject
                        </button>
                        <button
                          onClick={() => handleAccept(task.id)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-4 text-xs font-bold uppercase rounded-lg bg-[#607D6C] hover:bg-[#607D6C]/95 text-white shadow-sm transition-all cursor-pointer"
                        >
                          <ThumbsUp size={12} /> Accept Task
                        </button>
                      </div>
                    </div>
                  );
                })
              )}

              {!isMissingAssignments && pendingAcceptanceTasks.length === 0 && (
                <div className="py-8 text-center text-xs text-brand-text-secondary italic">
                  No pending assignments requiring acceptance response.
                </div>
              )}
            </div>
          </div>

          {/* Active Deployments Section */}
          <div className="glass-panel p-6 rounded-2xl border border-brand-border bg-[#FFFFFF] space-y-4">
            <div className="flex items-center gap-2 border-b border-brand-border pb-3">
              <CheckSquare className="text-[#607D6C]" size={18} />
              <h3 className="font-outfit font-bold text-sm uppercase tracking-wider text-[#2C3531]">
                Active Deployments ({activeDeploymentsTasks.length})
              </h3>
            </div>

            <div className="space-y-4">
              {isMissingAssignments ? (
                <div className="py-8 text-center text-xs text-brand-text-muted italic">
                  Assignments data unavailable.
                </div>
              ) : (
                activeDeploymentsTasks.map((task) => {
                  const req = task.emergency_request;
                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="p-5 rounded-xl border border-brand-border hover:border-[#607D6C] transition-all cursor-pointer bg-brand-bg/20 space-y-3.5"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] text-brand-text-muted font-mono block">TASK #{task.id}</span>
                          <h4 className="font-bold text-sm text-[#2C3531] mt-0.5">{task.task_type}</h4>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <StatusBadge status={getMyAssignmentStatus(task)} type="status" />
                          <StatusBadge status={task.status} type="status" />
                        </div>
                      </div>

                      {req && (
                        <div className="text-xs text-brand-text-secondary leading-relaxed border-t border-brand-border/40 pt-2.5 space-y-2">
                          <p className="italic font-medium">"{req.description}"</p>
                          <div className="grid grid-cols-2 gap-2 p-2 rounded bg-brand-bg border border-brand-border/50 text-[10px]">
                            <div>Affected: <strong className="text-[#2C3531]">{req.people_affected} people</strong></div>
                            <div>Injured: <strong className={req.injured ? 'text-[#C26D5C]' : 'text-[#2C3531]'}>{req.injured ? 'Yes' : 'No'}</strong></div>
                          </div>
                        </div>
                      )}

                      {/* Notice about locked status transitions */}
                      <div className="p-2.5 rounded-lg bg-brand-bg border border-brand-border text-[10px] text-brand-text-secondary flex items-start gap-1.5 leading-relaxed font-semibold">
                        <AlertTriangle size={12} className="text-[#D4A373] flex-shrink-0 mt-0.5" />
                        <span>Task status transitions are managed by administrators. Further workflow states are locked.</span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-brand-text-muted border-t border-brand-border/30 pt-2.5">
                        <span className="flex items-center gap-1">
                          <MapPin size={10} className="text-[#607D6C]" /> {req?.location_name || 'N/A'}
                        </span>
                        <span>Assigned: {task.assigned_at ? new Date(task.assigned_at).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                  );
                })
              )}
              {!isMissingAssignments && activeDeploymentsTasks.length === 0 && (
                <div className="py-12 text-center text-xs text-brand-text-muted italic">
                  No active deployments currently assigned.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Completed Deployments */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-brand-border bg-[#FFFFFF] space-y-4">
            <h3 className="font-outfit font-bold text-sm uppercase tracking-wider text-[#2C3531] border-b border-brand-border pb-3">
              Completed Missions ({completedDeploymentsTasks.length})
            </h3>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {isMissingAssignments ? (
                <div className="py-8 text-center text-xs text-brand-text-muted italic">
                  Data unavailable.
                </div>
              ) : (
                completedDeploymentsTasks.map((task) => {
                  const req = task.emergency_request;
                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="p-4 rounded-xl border border-brand-border bg-brand-bg/10 opacity-70 hover:opacity-100 transition-all cursor-pointer space-y-2"
                    >
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-mono text-brand-text-muted">TASK #{task.id}</span>
                        <StatusBadge status={task.status} type="status" />
                      </div>
                      <h4 className="font-bold text-xs text-brand-text-primary">{task.task_type}</h4>
                      <p className="text-[11px] text-brand-text-secondary truncate font-medium">"{req?.description}"</p>
                      <div className="text-[9px] text-brand-text-muted flex justify-between pt-1">
                        <span>{req?.location_name}</span>
                        <span>Completed</span>
                      </div>
                    </div>
                  );
                })
              )}
              {!isMissingAssignments && completedDeploymentsTasks.length === 0 && (
                <div className="py-8 text-center text-xs text-brand-text-muted italic">
                  No completed missions logged.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Task Details Drawer/Modal Overlay */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#FFFFFF] border border-brand-border w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh] animate-fadeIn text-[#2C3531]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-brand-bg/30 border-b border-brand-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-[#607D6C]" />
                <span className="font-bold text-xs uppercase tracking-wider text-[#2C3531]">Deployment Task Details</span>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1 rounded-lg hover:bg-brand-bg text-brand-text-secondary hover:text-[#2C3531] cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              
              {/* Core Information */}
              <div className="grid grid-cols-2 gap-4 border-b border-brand-border/40 pb-4">
                <div>
                  <span className="text-[9px] font-bold text-brand-text-muted uppercase block">Task ID</span>
                  <span className="font-bold text-sm text-[#2C3531]">#{selectedTask.id}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-brand-text-muted uppercase block">Task Type</span>
                  <span className="font-bold text-sm text-[#2C3531]">{selectedTask.task_type}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-brand-text-muted uppercase block">Task Status</span>
                  <div className="mt-1"><StatusBadge status={selectedTask.status} type="status" /></div>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-brand-text-muted uppercase block">My Assignment Status</span>
                  <div className="mt-1"><StatusBadge status={getMyAssignmentStatus(selectedTask)} type="status" /></div>
                </div>
              </div>

              {/* Emergency Request Details */}
              {selectedTask.emergency_request && (
                <div className="space-y-3.5 border-b border-brand-border/40 pb-4">
                  <h4 className="font-bold text-[10px] text-[#D4A373] uppercase tracking-wider block">
                    Linked Emergency Request Details
                  </h4>
                  
                  <div>
                    <span className="text-[9px] font-bold text-brand-text-muted uppercase block">Request ID</span>
                    <span className="font-semibold text-[#2C3531]">#{selectedTask.emergency_request.id}</span>
                  </div>

                  <div>
                    <span className="text-[9px] font-bold text-brand-text-muted uppercase block">Description / Situation</span>
                    <p className="font-medium text-brand-text-secondary mt-0.5 leading-relaxed bg-brand-bg/30 p-2.5 rounded-lg border border-brand-border/40 break-words">
                      "{selectedTask.emergency_request.description}"
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] font-bold text-brand-text-muted uppercase block">Location Landmark</span>
                      <span className="font-semibold text-[#2C3531]">{selectedTask.emergency_request.location_name}</span>
                    </div>
                    {selectedTask.emergency_request.location_lat && (
                      <div>
                        <span className="text-[9px] font-bold text-brand-text-muted uppercase block">Coordinates</span>
                        <span className="font-mono font-medium text-[#2C3531]">
                          {selectedTask.emergency_request.location_lat}, {selectedTask.emergency_request.location_lng}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] font-bold text-brand-text-muted uppercase block">People Affected</span>
                      <span className="font-semibold text-[#2C3531]">{selectedTask.emergency_request.people_affected} people</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-brand-text-muted uppercase block">Injuries Present</span>
                      <span className={`font-semibold ${selectedTask.emergency_request.injured ? 'text-[#C26D5C]' : 'text-[#2C3531]'}`}>
                        {selectedTask.emergency_request.injured ? 'Injuries Reported' : 'No Injuries'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Assignment Information */}
              <div className="space-y-3.5 pb-2">
                <h4 className="font-bold text-[10px] text-[#D4A373] uppercase tracking-wider block">
                  Assignment Timeline
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] font-bold text-brand-text-muted uppercase block">Created Timestamp</span>
                    <span className="font-medium text-brand-text-secondary">
                      {new Date(selectedTask.created_at).toLocaleString()}
                    </span>
                  </div>
                  {selectedTask.assigned_at && (
                    <div>
                      <span className="text-[9px] font-bold text-brand-text-muted uppercase block">Assigned Timestamp</span>
                      <span className="font-medium text-brand-text-secondary">
                        {new Date(selectedTask.assigned_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status workflow locked message (for accepted tasks) */}
              {getMyAssignmentStatus(selectedTask) === 'ACCEPTED' && (
                <div className="p-3 rounded-lg bg-brand-bg border border-brand-border text-[10px] text-brand-text-secondary flex items-start gap-2 leading-relaxed font-semibold">
                  <AlertTriangle size={14} className="text-[#D4A373] flex-shrink-0 mt-0.5" />
                  <span>Further task status transitions are currently unavailable to volunteer operators. Standard status workflows are locked.</span>
                </div>
              )}
            </div>

            {/* Modal Action Footer */}
            {getMyAssignmentStatus(selectedTask) === 'PENDING' && (
              <div className="px-6 py-4 bg-brand-bg/20 border-t border-brand-border flex gap-3">
                <button
                  onClick={() => handleReject(selectedTask.id)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-bold uppercase rounded-lg border border-[#C26D5C]/35 text-[#C26D5C] hover:bg-[#C26D5C]/10 transition-colors cursor-pointer"
                >
                  <ThumbsDown size={14} /> Reject Task
                </button>
                <button
                  onClick={() => handleAccept(selectedTask.id)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-bold uppercase rounded-lg bg-[#607D6C] hover:bg-[#607D6C]/95 text-white shadow transition-all cursor-pointer"
                >
                  <ThumbsUp size={14} /> Accept Task
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
