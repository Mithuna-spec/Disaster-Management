import React, { useState, useEffect, useCallback } from 'react';
import * as auditLogsApi from '../api/auditLogs';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import { FileSpreadsheet, Search, Filter, Calendar, ShieldCheck, User, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [actionFilter, setActionFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await auditLogsApi.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
      setError('Failed to sync immutable security logs from EOC node.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Extract unique filter keys
  const uniqueActions = [...new Set(logs.map(l => l.action))];
  const uniqueEntities = [...new Set(logs.map(l => l.entity_type))];

  const filteredLogs = logs.filter((log) => {
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    const matchesEntity = entityFilter === 'ALL' || log.entity_type === entityFilter;
    
    const actorName = log.user?.name || '';
    const searchString = `${log.id} ${actorName} ${log.action} ${log.entity_type} ${log.details}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());

    return matchesAction && matchesEntity && matchesSearch;
  });

  // Client-side pagination logic
  const totalCount = filteredLogs.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Reset page if it exceeds totalPages
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredLogs, totalPages, currentPage]);

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePageSizeChange = (e) => {
    setPageSize(parseInt(e.target.value));
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="p-6">
        <LoadingState variant="table" count={10} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState message={error} retry={loadLogs} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 text-[#2C3531]">
      {/* Filters block */}
      <div className="glass-panel p-4 rounded-xl border border-brand-border bg-[#FFFFFF] flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-text-muted">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm glass-input"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-brand-text-secondary">
            <Filter size={12} /> Filter:
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-1.5 rounded bg-brand-surface border border-brand-border text-xs text-[#2C3531] focus:outline-none focus:border-[#607D6C] cursor-pointer"
          >
            <option value="ALL">All Actions</option>
            {uniqueActions.map(act => (
              <option key={act} value={act}>{act}</option>
            ))}
          </select>

          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-3 py-1.5 rounded bg-brand-surface border border-brand-border text-xs text-[#2C3531] focus:outline-none focus:border-[#607D6C] cursor-pointer"
          >
            <option value="ALL">All Entities</option>
            {uniqueEntities.map(ent => (
              <option key={ent} value={ent}>{ent}</option>
            ))}
          </select>

          {/* Page Size Selector */}
          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            className="px-3 py-1.5 rounded bg-brand-surface border border-brand-border text-xs text-[#2C3531] focus:outline-none focus:border-[#607D6C] cursor-pointer"
          >
            <option value="10">10 entries</option>
            <option value="25">25 entries</option>
            <option value="50">50 entries</option>
            <option value="100">100 entries</option>
          </select>
        </div>
      </div>

      {/* Grid listing */}
      {filteredLogs.length === 0 ? (
        <EmptyState
          title="No Logs Recorded"
          description="EOC ledger has no matching logs for current search filters."
          icon={FileSpreadsheet}
        />
      ) : (
        <div className="glass-panel rounded-2xl border border-brand-border bg-[#FFFFFF] overflow-hidden flex flex-col justify-between">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-brand-border bg-brand-bg/50 text-[#2C3531] font-bold">
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Actor</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Action</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Entity</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Entity ID</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Timestamp</th>
                  <th className="py-3 px-4 font-semibold uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/45">
                {paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-brand-bg/30 transition-colors text-brand-text-secondary">
                    {/* Actor Column */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-bold text-[#2C3531]">
                        <User size={13} className="text-brand-text-muted" />
                        {log.user ? log.user.name : `ID: ${log.user_id}`}
                      </div>
                      <div className="text-[9px] text-[#D4A373] font-bold uppercase tracking-wider pl-4">
                        {log.user?.role || 'SYSTEM'}
                      </div>
                    </td>

                    {/* Action Column */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 font-mono font-bold uppercase ${
                        log.action === 'CREATE' ? 'text-[#607D6C]' :
                        log.action === 'DELETE' ? 'text-[#C26D5C]' :
                        log.action === 'UPDATE_STATUS' ? 'text-[#D4A373]' : 'text-[#2C3531]'
                      }`}>
                        <ShieldCheck size={12} className="opacity-80" />
                        {log.action}
                      </span>
                    </td>

                    {/* Entity Column */}
                    <td className="py-3.5 px-4 font-semibold uppercase tracking-wide">
                      {log.entity_type}
                    </td>

                    {/* Entity ID Column */}
                    <td className="py-3.5 px-4 font-mono text-brand-text-muted">
                      #{log.entity_id}
                    </td>

                    {/* Timestamp Column */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-brand-text-secondary font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="opacity-70 text-[#607D6C]" />
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </td>

                    {/* Details Column */}
                    <td className="py-3.5 px-4 max-w-sm truncate font-medium" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Client-Side Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-brand-border bg-brand-bg/20 text-xs">
            <div className="text-brand-text-secondary">
              Showing <span className="font-semibold text-[#2C3531]">{Math.min(totalCount, (currentPage - 1) * pageSize + 1)}</span> to{' '}
              <span className="font-semibold text-[#2C3531]">{Math.min(totalCount, currentPage * pageSize)}</span> of{' '}
              <span className="font-semibold text-[#2C3531]">{totalCount}</span> entries
            </div>

            <div className="flex items-center gap-1">
              {/* Previous button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded border border-brand-border hover:bg-brand-bg disabled:opacity-50 disabled:hover:bg-transparent text-brand-text-secondary hover:text-[#2C3531] transition-all cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>

              {/* Page indicators */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Limit page numbers display to prevent crowding
                if (totalPages > 6 && Math.abs(page - currentPage) > 1 && page !== 1 && page !== totalPages) {
                  if (page === 2 || page === totalPages - 1) {
                    return <span key={page} className="px-1 text-brand-text-muted">...</span>;
                  }
                  return null;
                }

                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                      currentPage === page
                        ? 'bg-[#607D6C] text-[#FFFFFF]'
                        : 'border border-transparent hover:bg-brand-bg text-brand-text-secondary hover:text-[#2C3531]'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              {/* Next button */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded border border-brand-border hover:bg-brand-bg disabled:opacity-50 disabled:hover:bg-transparent text-brand-text-secondary hover:text-[#2C3531] transition-all cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
