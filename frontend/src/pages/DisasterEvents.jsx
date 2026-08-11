import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../context/ToastContext';
import * as disastersApi from '../api/disasters';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import { Flame, Plus, Trash2, X, MapPin, Calendar, Activity, AlertTriangle } from 'lucide-react';

export default function DisasterEvents() {
  const { showSuccess, showError } = useToast();
  const [disasters, setDisasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [disasterType, setDisasterType] = useState('FLOOD');
  const [severity, setSeverity] = useState('HIGH');
  const [statusVal, setStatusVal] = useState('ACTIVE');
  const [centerLat, setCenterLat] = useState('17.40');
  const [centerLng, setCenterLng] = useState('78.50');
  const [areaName, setAreaName] = useState('Hyderabad');
  const [formLoading, setFormLoading] = useState(false);

  const loadDisasters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await disastersApi.getDisasters();
      setDisasters(data);
    } catch (err) {
      console.error(err);
      setError('Failed to sync active disasters tracking log.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDisasters();
  }, [loadDisasters]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name || !areaName) {
      showError('Disaster name and area location are required.');
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        name,
        description,
        disaster_type: disasterType,
        severity,
        status_value: statusVal,
        center_lat: parseFloat(centerLat || 0),
        center_lng: parseFloat(centerLng || 0),
        area_name: areaName,
      };

      await disastersApi.createDisaster(payload);
      showSuccess(`Disaster zone "${name}" successfully registered.`);
      setShowCreateModal(false);
      
      // Reset form
      setName('');
      setDescription('');
      
      // Reload
      const updated = await disastersApi.getDisasters();
      setDisasters(updated);
    } catch (err) {
      showError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this disaster zone? This action is logged for security audits.')) {
      return;
    }
    try {
      await disastersApi.deleteDisaster(id);
      showSuccess('Disaster event deleted');
      setDisasters(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      showError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <LoadingState variant="card" count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState message={error} retry={loadDisasters} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="text-brand-rose" size={20} />
          <h3 className="font-outfit font-semibold text-sm uppercase tracking-wider text-brand-text-primary">
            Active Disaster Control Desk
          </h3>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-brand-violet hover:bg-brand-violet-light text-white rounded-lg transition-all cursor-pointer"
        >
          <Plus size={14} /> Register Crisis Zone
        </button>
      </div>

      {/* Grid List */}
      {disasters.length === 0 ? (
        <EmptyState
          title="No Crisis Zones Active"
          description="EOC ledger has no active disaster events logged. Good status."
          icon={Flame}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {disasters.map((d) => (
            <div
              key={d.id}
              className={`glass-card p-6 rounded-xl border flex flex-col justify-between ${
                d.status === 'ACTIVE' ? 'border-brand-rose/25 bg-brand-rose/5' : 'border-brand-border'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-[10px] text-brand-text-muted font-mono block">ZONE #{d.id}</span>
                    <h4 className="font-outfit font-bold text-sm text-brand-text-primary mt-0.5">
                      {d.name}
                    </h4>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={d.status} type="status" />
                    <StatusBadge status={d.severity} type="priority" />
                  </div>
                </div>

                {/* Info tags */}
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-brand-border text-[9px] text-brand-violet-light w-fit mt-3 uppercase tracking-wider font-semibold">
                  Type: {d.disaster_type}
                </div>

                {/* Description */}
                <p className="text-xs text-brand-text-secondary mt-4 leading-relaxed line-clamp-3">
                  {d.description || 'No detailed situation report available.'}
                </p>

                {/* Coords */}
                <div className="mt-5 space-y-2 text-xs text-brand-text-secondary">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-brand-text-muted" />
                    <span>{d.area_name}</span>
                    <span className="text-[10px] text-brand-text-muted">
                      ({d.center_lat.toFixed(3)}, {d.center_lng.toFixed(3)})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-brand-text-muted">
                    <Calendar size={13} />
                    <span>Reported: {new Date(d.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Action delete */}
              <div className="border-t border-brand-border/40 pt-4 mt-6 flex justify-end">
                <button
                  onClick={() => handleDelete(d.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded text-brand-text-secondary hover:text-brand-rose hover:bg-brand-rose/10 transition-colors cursor-pointer"
                >
                  <Trash2 size={13} />
                  Terminate Tracking
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create Disaster */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg bg-brand-bg border border-brand-border rounded-xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-brand-surface border-b border-brand-border flex items-center justify-between">
              <h3 className="font-outfit font-semibold text-sm uppercase tracking-wider text-brand-text-primary">
                Register New Crisis Zone
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded hover:bg-white/5 text-brand-text-secondary cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider block">
                    Disaster Event Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Monsoon Flooding 2026"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-sm glass-input"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider block">
                    Disaster Type
                  </label>
                  <select
                    value={disasterType}
                    onChange={(e) => setDisasterType(e.target.value)}
                    className="w-full p-2 text-xs glass-input cursor-pointer"
                  >
                    <option value="FLOOD">FLOOD</option>
                    <option value="MEDICAL">MEDICAL CRISIS</option>
                    <option value="FIRE">FIRE OUTBREAK</option>
                    <option value="EARTHQUAKE">EARTHQUAKE</option>
                    <option value="HURRICANE">HURRICANE / STORM</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider block">
                    Severity Index
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full p-2 text-xs glass-input cursor-pointer"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider block">
                    Tracking Status
                  </label>
                  <select
                    value={statusVal}
                    onChange={(e) => setStatusVal(e.target.value)}
                    className="w-full p-2 text-xs glass-input cursor-pointer"
                  >
                    <option value="ACTIVE">ACTIVE TRACKING</option>
                    <option value="RESOLVED">RESOLVED / ARCHIVED</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider block">
                    Area Location Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hyderabad"
                    value={areaName}
                    onChange={(e) => setAreaName(e.target.value)}
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
                    value={centerLat}
                    onChange={(e) => setCenterLat(e.target.value)}
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
                    value={centerLng}
                    onChange={(e) => setCenterLng(e.target.value)}
                    className="w-full px-3 py-2 text-sm glass-input"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider block">
                  Detailed Description / Situation Report
                </label>
                <textarea
                  rows="3"
                  placeholder="Provide an active overview of the emergency zone situation..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs glass-input resize-none"
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
                  disabled={formLoading}
                  className="px-4 py-2 text-xs font-semibold uppercase bg-brand-violet hover:bg-brand-violet-light text-white rounded-lg transition-all cursor-pointer"
                >
                  {formLoading ? 'Registering...' : 'Register Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
