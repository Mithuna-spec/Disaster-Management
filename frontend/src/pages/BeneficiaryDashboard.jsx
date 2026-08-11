import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import * as emergencyApi from '../api/emergencyRequests';
import * as disastersApi from '../api/disasters';
import * as notificationsApi from '../api/notifications';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import {
  ShieldAlert,
  Plus,
  Clock,
  MapPin,
  Users,
  HeartPulse,
  Send,
  AlertTriangle,
  Flame,
  Activity,
  Compass,
  Check,
  AlertCircle,
  FileText,
  ChevronLeft,
  Bell,
} from 'lucide-react';

export default function BeneficiaryDashboard() {
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();
  
  const [requests, setRequests] = useState([]);
  const [disasters, setDisasters] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReportForm, setShowReportForm] = useState(false);

  // Form Fields
  const [category, setCategory] = useState('Flood'); // Predefined types
  const [customCategory, setCustomCategory] = useState(''); // Specific if Other
  const [description, setDescription] = useState('');
  const [peopleAffected, setPeopleAffected] = useState(1);
  const [injured, setInjured] = useState(false);
  const [priority, setPriority] = useState('MEDIUM');
  const [urgencyReason, setUrgencyReason] = useState('');
  const [locName, setLocName] = useState('');
  const [locLat, setLocLat] = useState('');
  const [locLng, setLocLng] = useState('');
  const [disasterId, setDisasterId] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Geolocation states for form
  const [locationStatus, setLocationStatus] = useState('idle'); // 'idle' | 'detecting' | 'success' | 'denied'
  const [locationError, setLocationError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reqs, dists, notifs] = await Promise.all([
        emergencyApi.getEmergencyRequests(),
        disastersApi.getDisasters(),
        notificationsApi.getNotifications().catch(() => []),
      ]);
      // Filter requests submitted by this beneficiary (current_user ID matches the beneficiary user_id)
      // Note: We can filter on client side.
      setRequests(reqs.filter(r => r.beneficiary?.user_id === user?.id || r.beneficiary_id === user?.id));
      setDisasters(dists);
      setNotifications(notifs.slice(0, 5)); // Show top 5 notifications
    } catch (err) {
      console.error(err);
      setError('Failed to sync support requests database with EOC central.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      setLocationError('Geolocation is not supported by your browser.');
      showError('Geolocation is not supported by your browser.');
      return;
    }

    setLocationStatus('detecting');
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLocLat(lat.toFixed(4));
        setLocLng(lng.toFixed(4));
        setLocationStatus('success');
        showSuccess('Coordinates successfully detected.');
        if (!locName) {
          setLocName('Hyderabad, Telangana'); // reasonable default
        }
      },
      (error) => {
        console.error(error);
        setLocationStatus('denied');
        setLocationError('Location access was denied. Please enter your location manually.');
        showWarning('Location access was denied. Please enter your location manually.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();

    const finalCategory = category === 'Other' ? customCategory.trim() : category;

    if (!description.trim()) {
      showError('Emergency description is required.');
      return;
    }
    if (!finalCategory) {
      showError('Please select or specify the emergency type.');
      return;
    }
    if (!locName.trim()) {
      showError('Location name is required.');
      return;
    }
    if (!locLat || !locLng) {
      showError('Coordinates are required. Please use current location or input coordinates.');
      return;
    }

    const latVal = parseFloat(locLat);
    const lngVal = parseFloat(locLng);
    if (isNaN(latVal) || latVal < -90 || latVal > 90) {
      showError('Latitude must be a valid number between -90 and 90.');
      return;
    }
    if (isNaN(lngVal) || lngVal < -180 || lngVal > 180) {
      showError('Longitude must be a valid number between -180 and 180.');
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        description: description.trim(),
        location_name: locName.trim(),
        location_lat: latVal,
        location_lng: lngVal,
        category: finalCategory,
        priority,
        people_affected: parseInt(peopleAffected || 1),
        injured,
        urgency_reason: urgencyReason.trim() || null,
        disaster_event_id: disasterId ? parseInt(disasterId) : null,
      };

      await emergencyApi.createEmergencyRequest(payload);
      showSuccess('Emergency support request successfully transmitted to the EOC.');
      
      // Reset form fields
      setDescription('');
      setCategory('Flood');
      setCustomCategory('');
      setPeopleAffected(1);
      setInjured(false);
      setPriority('MEDIUM');
      setUrgencyReason('');
      setLocName('');
      setLocLat('');
      setLocLng('');
      setDisasterId('');
      setLocationStatus('idle');
      setShowReportForm(false);
      
      // Refresh requests list
      loadData();
    } catch (err) {
      showError(`Transmission failed: ${err.message}`);
    } finally {
      setFormLoading(false);
    }
  };

  const getDisasterName = (id) => {
    const d = disasters.find(item => item.id === parseInt(id));
    return d ? `${d.name} (${d.area_name})` : 'None';
  };

  if (loading) {
    return (
      <div className="p-6">
        <LoadingState variant="stats" count={2} />
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

  const activeRequests = requests.filter(r => r.status !== 'RESOLVED');
  const resolvedRequests = requests.filter(r => r.status === 'RESOLVED');

  return (
    <div className="p-6 space-y-6 bg-brand-bg min-h-screen text-[#2C3531]">
      
      {/* Top Welcome Panel */}
      <div className="glass-panel p-6 rounded-2xl border border-brand-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#FFFFFF]">
        <div>
          <h2 className="font-outfit font-bold text-xl text-[#2C3531]">
            Welcome to the Support Control Desk
          </h2>
          <p className="text-xs text-brand-text-secondary mt-1">
            Beneficiary Operator: <strong className="text-[#2C3531]">{user?.name} ({user?.email})</strong>
          </p>
        </div>

        {/* Action button & statistics */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-4">
            <div className="px-4 py-2 rounded-lg bg-brand-bg border border-brand-border text-center">
              <span className="text-[10px] text-brand-text-secondary uppercase tracking-wider block">Submitted</span>
              <span className="font-bold text-lg text-[#2C3531]">{requests.length}</span>
            </div>
            <div className="px-4 py-2 rounded-lg bg-[#D4A373]/15 border border-[#D4A373]/30 text-center">
              <span className="text-[10px] text-[#B88555] uppercase tracking-wider block">Pending</span>
              <span className="font-bold text-lg text-[#B88555]">{activeRequests.length}</span>
            </div>
          </div>

          {!showReportForm && (
            <button
              onClick={() => {
                setShowReportForm(true);
                // Prefill location from default if we want or let them search
              }}
              className="flex items-center gap-2 py-3 px-6 rounded-xl bg-[#607D6C] hover:bg-[#607D6C]/95 text-[#FFFFFF] shadow-md font-outfit font-bold text-sm tracking-wider uppercase transition-all cursor-pointer"
            >
              <Plus size={16} /> Report an Emergency
            </button>
          )}
        </div>
      </div>

      {showReportForm ? (
        // EMERGENCY REPORT FORM (6-step structured view)
        <div className="glass-panel p-8 rounded-2xl border border-brand-border bg-[#FFFFFF] max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between border-b border-brand-border pb-4">
            <div className="flex items-center gap-2 text-[#C26D5C]">
              <ShieldAlert size={22} className="animate-pulse" />
              <h3 className="font-outfit font-bold text-base uppercase tracking-wider">
                Emergency Assistance Request
              </h3>
            </div>
            <button
              onClick={() => setShowReportForm(false)}
              className="flex items-center gap-1 text-xs text-brand-text-secondary hover:text-[#2C3531] transition-all cursor-pointer"
            >
              <ChevronLeft size={16} /> Back to Dashboard
            </button>
          </div>

          <form onSubmit={handleSubmitRequest} className="space-y-6">
            
            {/* 1. Emergency Details */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#D4A373] uppercase tracking-widest border-b border-brand-border pb-1.5 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#D4A373]/10 text-[#D4A373] flex items-center justify-center font-mono text-[10px]">1</span>
                Emergency Details
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#2C3531] uppercase tracking-wider block">
                    Emergency Type
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-sm glass-input cursor-pointer"
                  >
                    <option value="Medical Emergency">Medical Emergency</option>
                    <option value="Fire">Fire</option>
                    <option value="Flood">Flood</option>
                    <option value="Earthquake">Earthquake</option>
                    <option value="Cyclone">Cyclone</option>
                    <option value="Landslide">Landslide</option>
                    <option value="Building Collapse">Building Collapse</option>
                    <option value="Road Accident">Road Accident</option>
                    <option value="Severe Weather">Severe Weather</option>
                    <option value="Missing Person">Missing Person</option>
                    <option value="Food Emergency">Food Emergency</option>
                    <option value="Water Emergency">Water Emergency</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#2C3531] uppercase tracking-wider block">
                    Link Crisis Zone / Disaster Event (Optional)
                  </label>
                  <select
                    value={disasterId}
                    onChange={(e) => setDisasterId(e.target.value)}
                    className="w-full text-sm glass-input cursor-pointer"
                  >
                    <option value="">-- No linked disaster event --</option>
                    {disasters.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.area_name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {category === 'Other' && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="text-[10px] font-bold text-[#2C3531] uppercase tracking-wider block">
                    Specify Emergency Type
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Describe category, e.g. Hazardous Spill"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full text-sm glass-input"
                  />
                </div>
              )}
            </div>

            {/* 2. What Happened? */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#D4A373] uppercase tracking-widest border-b border-brand-border pb-1.5 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#D4A373]/10 text-[#D4A373] flex items-center justify-center font-mono text-[10px]">2</span>
                What Happened?
              </h4>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#2C3531] uppercase tracking-wider block">
                  Describe what happened
                </label>
                <textarea
                  required
                  rows="4"
                  placeholder="Describe the emergency, what happened, who is affected, and what kind of help is needed..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-sm glass-input resize-none font-medium text-[#2C3531]"
                />
              </div>
            </div>

            {/* 3. People Affected */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#D4A373] uppercase tracking-widest border-b border-brand-border pb-1.5 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#D4A373]/10 text-[#D4A373] flex items-center justify-center font-mono text-[10px]">3</span>
                People Affected
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#2C3531] uppercase tracking-wider block">
                    Estimated People Affected
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={peopleAffected}
                    onChange={(e) => setPeopleAffected(e.target.value)}
                    className="w-full text-sm glass-input"
                  />
                </div>
                <div className="pt-4">
                  <label className="flex items-center gap-3 text-xs font-bold text-[#2C3531] uppercase cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={injured}
                      onChange={(e) => setInjured(e.target.checked)}
                      className="rounded border-[#607D6C] text-[#607D6C] focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    Injured People Present
                  </label>
                </div>
              </div>
            </div>

            {/* 4. Urgency */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#D4A373] uppercase tracking-widest border-b border-brand-border pb-1.5 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#D4A373]/10 text-[#D4A373] flex items-center justify-center font-mono text-[10px]">4</span>
                Urgency & Priority
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#2C3531] uppercase tracking-wider block">
                    Requested Urgency Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full text-sm glass-input cursor-pointer"
                  >
                    <option value="CRITICAL">CRITICAL (Immediate danger to life)</option>
                    <option value="HIGH">HIGH (Severe threat, rapid escalation)</option>
                    <option value="MEDIUM">MEDIUM (Moderate impact, stable)</option>
                    <option value="LOW">LOW (No direct threat to life)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#2C3531] uppercase tracking-wider block">
                    Reason for Urgency
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. rising water levels, medical trauma"
                    value={urgencyReason}
                    onChange={(e) => setUrgencyReason(e.target.value)}
                    className="w-full text-sm glass-input"
                  />
                </div>
              </div>
            </div>

            {/* 5. Location */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#D4A373] uppercase tracking-widest border-b border-brand-border pb-1.5 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#D4A373]/10 text-[#D4A373] flex items-center justify-center font-mono text-[10px]">5</span>
                Incident Location
              </h4>
              
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={locationStatus === 'detecting'}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#607D6C]/10 border border-[#607D6C]/30 text-[#607D6C] hover:bg-[#607D6C]/15 transition-all text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  <Compass size={14} className={locationStatus === 'detecting' ? 'animate-spin' : ''} />
                  Use my current location
                </button>

                {locationStatus === 'success' && (
                  <div className="flex items-center gap-2 text-xs text-[#607D6C] font-semibold bg-[#607D6C]/10 p-2.5 rounded-lg border border-[#607D6C]/25">
                    <Check size={16} className="flex-shrink-0" />
                    <span>✓ Location detected</span>
                  </div>
                )}

                {locationStatus === 'denied' && (
                  <div className="flex items-start gap-2 text-xs text-[#C26D5C] bg-[#C26D5C]/10 p-2.5 rounded-lg border border-[#C26D5C]/25">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <span>Location access was denied. Please enter your location manually.</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#2C3531] uppercase tracking-wider block">
                    Location Name / Landmark
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hyderabad, Telangana"
                    value={locName}
                    onChange={(e) => setLocName(e.target.value)}
                    className="w-full text-sm glass-input"
                  />
                </div>

                {locationStatus === 'denied' || !locLat ? (
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-brand-bg border border-brand-border">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-brand-text-secondary uppercase block">
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="e.g. 17.4000"
                        value={locLat}
                        onChange={(e) => setLocLat(e.target.value)}
                        className="w-full px-2.5 py-1 text-xs glass-input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-brand-text-secondary uppercase block">
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        placeholder="e.g. 78.5000"
                        value={locLng}
                        onChange={(e) => setLocLng(e.target.value)}
                        className="w-full px-2.5 py-1 text-xs glass-input"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-brand-text-secondary font-mono flex gap-4 pl-1">
                    <span>Latitude: <strong className="text-[#2C3531]">{locLat}</strong></span>
                    <span>Longitude: <strong className="text-[#2C3531]">{locLng}</strong></span>
                  </div>
                )}
              </div>
            </div>

            {/* 6. Review & Submit */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#D4A373] uppercase tracking-widest border-b border-brand-border pb-1.5 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#D4A373]/10 text-[#D4A373] flex items-center justify-center font-mono text-[10px]">6</span>
                Review & Submit
              </h4>
              
              <div className="p-4 rounded-xl border border-brand-border bg-brand-bg/40 space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-brand-text-muted uppercase block">Emergency Type</span>
                    <span className="font-semibold text-[#2C3531]">{category === 'Other' ? customCategory || 'Other' : category}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-brand-text-muted uppercase block">Priority Level</span>
                    <span className="font-semibold text-[#2C3531]">{priority}</span>
                  </div>
                </div>
                
                <div>
                  <span className="text-[10px] font-bold text-brand-text-muted uppercase block">Incident Description</span>
                  <p className="font-medium text-[#2C3531] mt-0.5 leading-relaxed break-words">{description || '—'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-brand-text-muted uppercase block">Location Name</span>
                    <span className="font-semibold text-[#2C3531]">{locName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-brand-text-muted uppercase block">Coordinates</span>
                    <span className="font-mono font-medium text-[#2C3531]">{locLat && locLng ? `${locLat}, ${locLng}` : 'Not Specified'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-brand-text-muted uppercase block">People Affected / Injuries</span>
                    <span className="font-semibold text-[#2C3531]">{peopleAffected} affected {injured ? '(Injured logged)' : '(No injuries)'}</span>
                  </div>
                  {urgencyReason && (
                    <div>
                      <span className="text-[10px] font-bold text-brand-text-muted uppercase block">Reason for Urgency</span>
                      <span className="font-semibold text-[#2C3531]">{urgencyReason}</span>
                    </div>
                  )}
                </div>

                {disasterId && (
                  <div>
                    <span className="text-[10px] font-bold text-brand-text-muted uppercase block">Linked Crisis Event</span>
                    <span className="font-semibold text-[#2C3531]">{getDisasterName(disasterId)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={formLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-[#C26D5C] hover:bg-[#C26D5C]/95 text-[#FFFFFF] shadow-md font-outfit font-bold text-sm tracking-wider uppercase transition-all cursor-pointer"
            >
              {formLoading ? (
                <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              ) : (
                <>
                  <Send size={16} /> Submit Emergency Request
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        // DASHBOARD VIEW (Aggregate requests + Notifications)
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Side: Active Requests Feed */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Active Alerts Panel */}
            <div className="glass-panel p-6 rounded-2xl border border-brand-border bg-[#FFFFFF] space-y-4">
              <div className="flex items-center gap-2 border-b border-brand-border pb-3">
                <Activity className="text-[#C26D5C]" size={18} />
                <h3 className="font-outfit font-bold text-sm uppercase tracking-wider text-[#2C3531]">
                  Active Emergency Requests Feed
                </h3>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {activeRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-xl border border-brand-border bg-brand-bg/25 space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={req.status} type="status" />
                        <StatusBadge status={req.priority} type="priority" />
                      </div>
                      <span className="text-[10px] text-brand-text-muted font-mono">REQ #{req.id}</span>
                    </div>

                    <p className="text-xs text-[#2C3531] font-semibold leading-relaxed">
                      {req.description}
                    </p>

                    {req.urgency_reason && (
                      <div className="p-2 rounded bg-[#D4A373]/10 text-xs text-[#B88555] border border-[#D4A373]/20 flex items-start gap-1.5">
                        <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
                        <span>{req.urgency_reason}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-4 text-[10px] text-brand-text-secondary pt-2 border-t border-brand-border/40">
                      <div className="flex items-center gap-2">
                        <MapPin size={10} />
                        <span>{req.location_name}</span>
                      </div>
                      <div className="flex gap-3 font-medium">
                        <span>{req.people_affected} affected</span>
                        {req.injured && <span className="text-[#C26D5C] font-bold">Injuries logged</span>}
                      </div>
                    </div>
                  </div>
                ))}
                {activeRequests.length === 0 && (
                  <EmptyState
                    title="No Active Requests Logged"
                    description="Your profile is currently secure. Use the emergency report console if support is needed."
                    icon={ShieldAlert}
                  />
                )}
              </div>
            </div>

            {/* Resolved Alerts Panel */}
            {resolvedRequests.length > 0 && (
              <div className="glass-panel p-6 rounded-2xl border border-brand-border bg-[#FFFFFF] space-y-4">
                <div className="flex items-center gap-2 border-b border-brand-border pb-3">
                  <Check className="text-[#607D6C]" size={18} />
                  <h3 className="font-outfit font-bold text-sm uppercase tracking-wider text-[#2C3531]">
                    Resolved Requests
                  </h3>
                </div>

                <div className="space-y-4 max-h-[30vh] overflow-y-auto pr-2">
                  {resolvedRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 rounded-xl border border-brand-border bg-brand-bg/10 opacity-75 space-y-2"
                    >
                      <div className="flex justify-between items-center text-[10px]">
                        <StatusBadge status={req.status} type="status" />
                        <span className="font-mono text-brand-text-muted">REQ #{req.id}</span>
                      </div>
                      <p className="text-xs text-brand-text-secondary truncate">{req.description}</p>
                      <div className="text-[9px] text-brand-text-muted flex items-center gap-1">
                        <MapPin size={8} /> {req.location_name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Side: Notifications & Location Summary */}
          <div className="space-y-6">
            
            {/* Location Summary */}
            <div className="glass-panel p-6 rounded-2xl border border-brand-border bg-[#FFFFFF] space-y-4">
              <h3 className="font-outfit font-bold text-sm uppercase tracking-wider text-[#2C3531] border-b border-brand-border pb-3">
                Operator Security Location
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-[#607D6C]" />
                  <div>
                    <div className="font-bold text-[#2C3531]">Registered Hub</div>
                    <div className="text-brand-text-secondary text-[11px] mt-0.5">Hyderabad, Telangana (Active Node)</div>
                  </div>
                </div>
                
                <div className="p-3 bg-brand-bg/50 border border-brand-border rounded-lg text-[10px] font-mono text-brand-text-secondary space-y-1">
                  <div>Deployment Mode: ACTIVE SUPPORT</div>
                  <div>Primary EOC Link: CENTRAL</div>
                </div>
              </div>
            </div>

            {/* In-app Notifications Panel */}
            <div className="glass-panel p-6 rounded-2xl border border-brand-border bg-[#FFFFFF] space-y-4">
              <div className="flex items-center justify-between border-b border-brand-border pb-3">
                <div className="flex items-center gap-2">
                  <Bell className="text-[#607D6C]" size={16} />
                  <h3 className="font-outfit font-bold text-sm uppercase tracking-wider text-[#2C3531]">
                    System Notifications
                  </h3>
                </div>
              </div>

              <div className="space-y-3.5">
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-xs text-brand-text-muted">
                    No active notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="text-xs border-b border-brand-border/40 pb-3 last:border-b-0 last:pb-0">
                      <div className="font-bold text-[#2C3531]">{n.title}</div>
                      <p className="text-brand-text-secondary text-[11px] mt-0.5 leading-relaxed">{n.message}</p>
                      <span className="text-[9px] text-brand-text-muted mt-1 block">
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
