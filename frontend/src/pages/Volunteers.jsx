import React, { useState, useEffect, useCallback } from 'react';
import * as volunteersApi from '../api/volunteers';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import { Users, Search, Mail, MapPin, Shield, Check, X, Award, Truck } from 'lucide-react';

export default function Volunteers() {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadVolunteers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await volunteersApi.getVolunteers();
      setVolunteers(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch volunteer operator roster from EOC directory.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVolunteers();
  }, [loadVolunteers]);

  const filteredVolunteers = volunteers.filter((vol) => {
    const name = vol.user?.name || '';
    const email = vol.user?.email || '';
    const searchString = `${vol.id} ${name} ${email} ${vol.skills.join(' ')} ${vol.location_name}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="p-6">
        <LoadingState variant="table" count={8} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState message={error} retry={loadVolunteers} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Search & Statistics bar */}
      <div className="glass-panel p-4 rounded-xl border border-brand-border flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-text-muted">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search by name, skills, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm glass-input"
          />
        </div>

        {/* Counter stats */}
        <div className="flex gap-4 text-xs text-brand-text-secondary">
          <div>Roster Count: <strong className="text-brand-text-primary">{volunteers.length}</strong></div>
          <div className="border-l border-brand-border pl-4">
            Available: <strong className="text-brand-emerald">{volunteers.filter(v => v.availability).length}</strong>
          </div>
          <div className="border-l border-brand-border pl-4">
            Medics: <strong className="text-brand-rose">{volunteers.filter(v => v.medical_training).length}</strong>
          </div>
        </div>
      </div>

      {/* Roster list */}
      {filteredVolunteers.length === 0 ? (
        <EmptyState
          title="No Volunteers Found"
          description="Ensure operators have successfully registered and established profiles."
          icon={Users}
        />
      ) : (
        <div className="glass-panel rounded-2xl border border-brand-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-brand-border bg-brand-surface/40 text-brand-text-secondary">
                  <th className="py-3 px-4 font-semibold uppercase">Operator ID</th>
                  <th className="py-3 px-4 font-semibold uppercase">Name</th>
                  <th className="py-3 px-4 font-semibold uppercase">Availability</th>
                  <th className="py-3 px-4 font-semibold uppercase">Skills Profile</th>
                  <th className="py-3 px-4 font-semibold uppercase">Training / Assets</th>
                  <th className="py-3 px-4 font-semibold uppercase">Base Coordinates</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/45">
                {filteredVolunteers.map((vol) => (
                  <tr key={vol.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-brand-text-muted">
                      VOL #{vol.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-brand-text-primary">
                        {vol.user?.name || 'Unregistered Name'}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-brand-text-muted mt-0.5">
                        <Mail size={10} /> {vol.user?.email || 'N/A'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${vol.availability ? 'bg-brand-emerald animate-pulse' : 'bg-brand-rose'}`} />
                        <span className="font-medium text-brand-text-primary">
                          {vol.availability ? 'Available for Dispatch' : 'Standby / Busy'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {vol.skills && vol.skills.map((skill) => (
                          <span key={skill} className="inline-flex items-center text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-brand-border text-brand-text-secondary">
                            {skill}
                          </span>
                        ))}
                        {(!vol.skills || vol.skills.length === 0) && (
                          <span className="text-[10px] text-brand-text-muted italic">No skills listed</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        {vol.medical_training ? (
                          <div className="flex items-center gap-1 text-[10px] text-brand-rose font-bold uppercase">
                            <Award size={12} /> Medical First Aid
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px] text-brand-text-muted">
                            <X size={10} /> No Medical Training
                          </div>
                        )}
                        {vol.vehicle_available ? (
                          <div className="flex items-center gap-1 text-[10px] text-brand-teal-light font-bold">
                            <Truck size={12} /> Vehicle: {vol.vehicle_type || 'Yes'}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px] text-brand-text-muted">
                            <X size={10} /> No Transport
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-brand-text-secondary">
                        <MapPin size={12} className="text-brand-text-muted flex-shrink-0" />
                        <span className="truncate max-w-[150px]" title={vol.location_name}>{vol.location_name}</span>
                      </div>
                      <div className="text-[9px] text-brand-text-muted font-mono mt-0.5">
                        ({vol.location_lat.toFixed(3)}, {vol.location_lng.toFixed(3)})
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
