import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../context/ToastContext';
import * as resourcesApi from '../api/resources';
import * as tasksApi from '../api/tasks';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import {
  Package,
  Plus,
  RefreshCw,
  TrendingDown,
  Trash2,
  X,
  PlusCircle,
  MinusCircle,
  Sliders,
  History,
  AlertTriangle,
} from 'lucide-react';

export default function Resources() {
  const { showSuccess, showError } = useToast();
  const [resources, setResources] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected resource for transaction drawer & log viewer
  const [selectedResource, setSelectedResource] = useState(null);
  const [inventoryLogs, setInventoryLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionType, setTransactionType] = useState('RESTOCK'); // 'RESTOCK' | 'ISSUE' | 'ADJUSTMENT'

  // Create Form Fields
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('OTHER');
  const [newQty, setNewQty] = useState('');
  const [newUnit, setNewUnit] = useState('ITEMS');
  const [newMinThreshold, setNewMinThreshold] = useState('0');

  // Transaction Form Fields
  const [txQty, setTxQty] = useState('');
  const [txTaskId, setTxTaskId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resData, tasksData] = await Promise.all([
        resourcesApi.getResources(),
        tasksApi.getTasks(),
      ]);
      setResources(resData);
      setTasks(tasksData);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch supply inventory list from EOC warehouse.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load inventory log timeline
  const loadInventoryLogs = async (id) => {
    setLogsLoading(true);
    try {
      const data = await resourcesApi.getInventoryLogs(id);
      setInventoryLogs(data || []);
    } catch (err) {
      showError(`Failed to load inventory timeline: ${err.message}`);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleSelectResource = (resource) => {
    setSelectedResource(resource);
    loadInventoryLogs(resource.id);
  };

  const handleCreateResource = async (e) => {
    e.preventDefault();
    if (!newName || !newType || !newQty || !newUnit) {
      showError('Please populate all required fields.');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        name: newName,
        resource_type: newType,
        quantity: parseFloat(newQty),
        unit: newUnit,
        minimum_threshold: parseFloat(newMinThreshold || 0),
      };

      const res = await resourcesApi.createResource(payload);
      showSuccess(`Supply Item "${res.name}" added to registry.`);
      setShowCreateModal(false);
      
      // Reset form
      setNewName('');
      setNewQty('');
      setNewMinThreshold('0');

      // Refresh list
      const updated = await resourcesApi.getResources();
      setResources(updated);
    } catch (err) {
      showError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransaction = async (e) => {
    e.preventDefault();
    if (!selectedResource || !txQty) {
      showError('Please specify the quantity change.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await resourcesApi.updateInventory(
        selectedResource.id,
        transactionType,
        parseFloat(txQty),
        txTaskId ? parseInt(txTaskId) : null
      );

      showSuccess(`Inventory updated: ${transactionType} transaction registered.`);
      setShowTransactionModal(false);
      setTxQty('');
      setTxTaskId('');

      // Refresh list & current resource logs representation
      const updated = await resourcesApi.getResources();
      setResources(updated);
      const refreshed = updated.find(r => r.id === selectedResource.id);
      setSelectedResource(refreshed);
      loadInventoryLogs(refreshed.id);
    } catch (err) {
      showError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteResource = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this resource line item?')) {
      return;
    }
    try {
      await resourcesApi.deleteResource(id);
      showSuccess('Resource removed from registry.');
      setResources(prev => prev.filter(r => r.id !== id));
      if (selectedResource?.id === id) {
        setSelectedResource(null);
        setInventoryLogs([]);
      }
    } catch (err) {
      showError(err.message);
    }
  };

  // Determine stock state locally
  const getStockHealth = (r) => {
    if (r.quantity <= 0) return 'DEPLETED';
    if (r.quantity <= r.minimum_threshold) return 'LOW_STOCK';
    return 'HEALTHY';
  };

  if (loading) {
    return (
      <div className="p-6">
        <LoadingState variant="stats" count={2} />
        <LoadingState variant="table" count={8} />
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
    <div className="p-6 space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="text-brand-violet-light" size={20} />
          <h3 className="font-outfit font-semibold text-sm uppercase tracking-wider text-brand-text-primary">
            EOC Warehouse Inventory
          </h3>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-brand-violet hover:bg-brand-violet-light text-white rounded-lg transition-all cursor-pointer"
        >
          <Plus size={14} /> Add Supply Item
        </button>
      </div>

      {/* Main split screen */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Inventory list (span 2) */}
        <div className="glass-panel p-6 rounded-2xl border border-brand-border xl:col-span-2 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-brand-border text-brand-text-secondary">
                  <th className="py-3 px-4 font-semibold uppercase">Supply Name</th>
                  <th className="py-3 px-4 font-semibold uppercase">Type</th>
                  <th className="py-3 px-4 font-semibold uppercase text-right">In-Stock Quantity</th>
                  <th className="py-3 px-4 font-semibold uppercase text-right">Min Threshold</th>
                  <th className="py-3 px-4 font-semibold uppercase text-center">Status</th>
                  <th className="py-3 px-4 font-semibold uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/45">
                {resources.map((r) => {
                  const health = getStockHealth(r);
                  const isSelected = selectedResource?.id === r.id;

                  return (
                    <tr
                      key={r.id}
                      onClick={() => handleSelectResource(r)}
                      className={`transition-colors cursor-pointer ${
                        isSelected ? 'bg-brand-violet/10 hover:bg-brand-violet/15' : 'hover:bg-white/5'
                      }`}
                    >
                      <td className="py-3 px-4 font-medium text-brand-text-primary">
                        {r.name}
                      </td>
                      <td className="py-3 px-4 text-brand-text-secondary">
                        {r.resource_type}
                      </td>
                      <td className="py-3 px-4 font-bold font-mono text-right text-brand-text-primary">
                        {r.quantity} <span className="text-[10px] text-brand-text-secondary font-sans font-normal uppercase">{r.unit}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-right text-brand-text-muted">
                        {r.minimum_threshold} <span className="text-[9px] uppercase">{r.unit}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={health} type="status" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setSelectedResource(r);
                              setTransactionType('RESTOCK');
                              setShowTransactionModal(true);
                            }}
                            className="p-1 text-brand-text-secondary hover:text-brand-teal hover:bg-brand-teal/10 rounded transition-colors cursor-pointer"
                            title="Restock"
                          >
                            <PlusCircle size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedResource(r);
                              setTransactionType('ISSUE');
                              setShowTransactionModal(true);
                            }}
                            className="p-1 text-brand-text-secondary hover:text-brand-amber hover:bg-brand-amber/10 rounded transition-colors cursor-pointer"
                            title="Issue Supplies"
                          >
                            <MinusCircle size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteResource(r.id)}
                            className="p-1 text-brand-text-secondary hover:text-brand-rose hover:bg-brand-rose/10 rounded transition-colors cursor-pointer"
                            title="Remove Supply Item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {resources.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-brand-text-muted">
                      No supplies registered in the warehouse database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transaction log / detailed view (span 1) */}
        <div className="glass-panel p-6 rounded-2xl border border-brand-border h-[calc(100vh-12rem)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-brand-border pb-3">
              <History size={16} className="text-brand-teal-light" />
              <h4 className="font-outfit font-semibold text-xs uppercase tracking-wider text-brand-text-primary">
                Supply Transaction History
              </h4>
            </div>

            {selectedResource ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-sm text-brand-text-primary">{selectedResource.name}</h4>
                  <span className="text-[10px] text-brand-text-muted font-mono block mt-0.5">
                    SUPPLY LINE #{selectedResource.id} • TYPE: {selectedResource.resource_type}
                  </span>
                </div>

                {/* Audit log list */}
                <div className="space-y-3 overflow-y-auto max-h-[45vh] pr-1">
                  {logsLoading ? (
                    <div className="text-center py-6 text-xs text-brand-text-secondary animate-pulse uppercase">
                      Syncing ledger timeline...
                    </div>
                  ) : inventoryLogs.length === 0 ? (
                    <div className="text-center py-10 text-xs text-brand-text-muted italic">
                      No transaction transactions logged on this line.
                    </div>
                  ) : (
                    inventoryLogs.map((log) => {
                      const date = new Date(log.created_at).toLocaleString();
                      const sign = log.change_type === 'RESTOCK' ? '+' : log.change_type === 'ISSUE' ? '-' : '';
                      const qtyColor = 
                        log.change_type === 'RESTOCK' ? 'text-brand-emerald' : 
                        log.change_type === 'ISSUE' ? 'text-brand-rose' : 'text-brand-amber';

                      return (
                        <div key={log.id} className="p-3 rounded bg-black/20 border border-brand-border/40 text-[11px] space-y-1">
                          <div className="flex justify-between items-center">
                            <span className={`font-bold uppercase tracking-wider ${qtyColor}`}>
                              {log.change_type}
                            </span>
                            <span className="text-[9px] text-brand-text-muted">{date}</span>
                          </div>
                          
                          <div className="flex justify-between items-center text-brand-text-secondary mt-1">
                            <span>Adjusted: <strong className={qtyColor}>{sign}{log.quantity}</strong></span>
                            <span>Stock: {log.previous_quantity} → {log.new_quantity}</span>
                          </div>

                          {log.task_id && (
                            <div className="text-[9px] text-brand-text-muted border-t border-brand-border/30 pt-1 mt-1">
                              Issued for Task #{log.task_id}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-xs text-brand-text-muted italic">
                Select a supply item to review transaction history ledger.
              </div>
            )}
          </div>

          {selectedResource && (
            <div className="border-t border-brand-border pt-4 mt-4 flex gap-2">
              <button
                onClick={() => {
                  setTransactionType('ADJUSTMENT');
                  setShowTransactionModal(true);
                }}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold uppercase tracking-wider rounded bg-brand-surface border border-brand-border hover:border-brand-violet/30 hover:bg-brand-surface-light text-brand-text-primary transition-colors cursor-pointer"
              >
                <Sliders size={12} /> Audit Adjustment
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Resource */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-brand-bg border border-brand-border rounded-xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-brand-surface border-b border-brand-border flex items-center justify-between">
              <h3 className="font-outfit font-semibold text-sm uppercase tracking-wider text-brand-text-primary">
                Add Supply Item to Registry
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded hover:bg-white/5 text-brand-text-secondary cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateResource} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider block">
                    Supply Item Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Drinking Water"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 text-sm glass-input"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider block">
                    Resource Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full p-2 text-xs glass-input cursor-pointer"
                  >
                    <option value="FOOD">FOOD / RATIONS</option>
                    <option value="WATER">WATER / BEVERAGES</option>
                    <option value="MEDICAL">MEDICAL INVENTORY</option>
                    <option value="EQUIPMENT">LOGISTICS EQUIPMENT</option>
                    <option value="OTHER">OTHER UTILITY</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider block">
                    Measurement Unit
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LITERS, KGS, BOXES"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-sm glass-input"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider block">
                    Initial Stock Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="0"
                    value={newQty}
                    onChange={(e) => setNewQty(e.target.value)}
                    className="w-full px-3 py-2 text-sm glass-input"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider block">
                    Safety Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="0"
                    value={newMinThreshold}
                    onChange={(e) => setNewMinThreshold(e.target.value)}
                    className="w-full px-3 py-2 text-sm glass-input"
                  />
                </div>
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
                  {actionLoading ? 'Creating...' : 'Register Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Transaction (Restock / Issue / Adjust) */}
      {showTransactionModal && selectedResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-brand-bg border border-brand-border rounded-xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-brand-surface border-b border-brand-border flex items-center justify-between">
              <div>
                <h3 className="font-outfit font-semibold text-sm uppercase tracking-wider text-brand-text-primary">
                  {transactionType} Supplies
                </h3>
                <span className="text-[10px] text-brand-text-secondary font-mono">
                  {selectedResource.name} ({selectedResource.quantity} {selectedResource.unit} current)
                </span>
              </div>
              <button
                onClick={() => setShowTransactionModal(false)}
                className="p-1 rounded hover:bg-white/5 text-brand-text-secondary cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleTransaction} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider block">
                  Adjustment Quantity ({selectedResource.unit})
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  placeholder={`Amount in ${selectedResource.unit}`}
                  value={txQty}
                  onChange={(e) => setTxQty(e.target.value)}
                  className="w-full px-3 py-2 text-sm glass-input"
                />
              </div>

              {transactionType === 'ISSUE' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider block">
                    Link Task ID (Optional)
                  </label>
                  <select
                    value={txTaskId}
                    onChange={(e) => setTxTaskId(e.target.value)}
                    className="w-full p-2.5 text-sm font-medium glass-input appearance-none cursor-pointer"
                  >
                    <option value="">-- No linked deployment task --</option>
                    {tasks
                      .filter((t) => t.status !== 'COMPLETED')
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          Task #{t.id} - {t.task_type}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowTransactionModal(false)}
                  className="px-4 py-2 text-xs font-semibold uppercase bg-brand-surface border border-brand-border rounded-lg text-brand-text-primary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-semibold uppercase bg-brand-teal hover:bg-brand-teal-light text-white rounded-lg transition-all cursor-pointer"
                >
                  {actionLoading ? 'Updating...' : 'Register Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
