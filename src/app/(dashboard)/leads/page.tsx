'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import {
  Plus, Search, Filter, Building2, Phone, Mail, MapPin,
  User, Star, ChevronLeft, ChevronRight, Loader2, ExternalLink,
  MessageCircle, Download, RefreshCw, Trash2, Edit
} from 'lucide-react';
import { clsx } from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import LeadModal from '@/components/leads/LeadModal';
import { exportToExcel, exportToPDF } from '@/lib/utils/export';

interface Lead {
  _id: string; name: string; email: string; phone: string;
  propertyInterest: string; location: string; budget: number;
  status: string; priority: string; score: number; source: string;
  assignedTo?: { _id: string; name: string; email: string } | null;
  followUpDate?: string; createdAt: string; notes: string;
}

const STATUS_COLORS: Record<string, string> = {
  New: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  Contacted: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  'In Progress': 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  Negotiation: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  Closed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  Lost: 'bg-red-500/15 text-red-400 border-red-500/20',
};

export default function LeadsPage() {
  const { data: session } = useSession();
  const user = session?.user as { role?: string; name?: string } | undefined;
  const isAdmin = user?.role === 'admin';

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });
  const [showFilters, setShowFilters] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '15' });
    if (filters.status) params.set('status', filters.status);
    if (filters.priority) params.set('priority', filters.priority);
    if (filters.search) params.set('search', filters.search);

    try {
      const res = await fetch(`/api/leads?${params}`);
      const data = await res.json();
      setLeads(data.leads || []);
      setTotal(data.pagination?.total || 0);
    } catch {
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  // Polling for real-time updates every 15s
  useEffect(() => {
    const interval = setInterval(fetchLeads, 15000);
    return () => clearInterval(interval);
  }, [fetchLeads]);

  const deleteLead = async (id: string, name: string) => {
    if (!confirm(`Delete lead "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Lead deleted'); fetchLeads(); }
    else toast.error('Failed to delete lead');
  };

  const handleExportCSV = async () => {
    const res = await fetch('/api/export?format=csv');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `leads-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const handleExportExcel = async () => {
    const res = await fetch('/api/export');
    const data = await res.json();
    exportToExcel(data.leads);
    toast.success('Excel exported');
  };

  const handleExportPDF = async () => {
    const res = await fetch('/api/export');
    const data = await res.json();
    exportToPDF(data.leads);
    toast.success('PDF exported');
  };

  const totalPages = Math.ceil(total / 15);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="page-header mb-0">
          <h1 className="page-title">{isAdmin ? 'All Leads' : 'My Leads'}</h1>
          <p className="page-subtitle">{total} total leads</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && (
            <div className="relative group">
              <button className="btn-secondary">
                <Download className="w-4 h-4" /> Export
              </button>
              <div className="absolute right-0 top-full mt-1 w-40 bg-slate-800 border border-white/10 rounded-lg overflow-hidden shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                <button onClick={handleExportCSV} className="w-full px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 text-left">CSV</button>
                <button onClick={handleExportExcel} className="w-full px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 text-left">Excel (.xlsx)</button>
                <button onClick={handleExportPDF} className="w-full px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 text-left">PDF</button>
              </div>
            </div>
          )}
          <button onClick={fetchLeads} className="btn-secondary" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => { setEditLead(null); setShowModal(true); }} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Lead
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text" placeholder="Search leads..."
            value={filters.search}
            onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }}
            className="input pl-9"
          />
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={clsx('btn-secondary', showFilters && 'border border-brand-500/40 text-brand-400')}>
          <Filter className="w-4 h-4" /> Filters
          {(filters.status || filters.priority) && <span className="w-2 h-2 rounded-full bg-brand-500" />}
        </button>
      </div>

      {showFilters && (
        <div className="flex gap-3 flex-wrap p-4 bg-slate-800/50 rounded-xl border border-white/5 animate-slide-up">
          <div>
            <label className="label text-xs">Status</label>
            <select value={filters.status} onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}
              className="input w-40 text-sm">
              <option value="">All Statuses</option>
              {['New', 'Contacted', 'In Progress', 'Negotiation', 'Closed', 'Lost'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-xs">Priority</label>
            <select value={filters.priority} onChange={e => { setFilters(f => ({ ...f, priority: e.target.value })); setPage(1); }}
              className="input w-36 text-sm">
              <option value="">All Priorities</option>
              {['High', 'Medium', 'Low'].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          {(filters.status || filters.priority) && (
            <div className="flex items-end">
              <button onClick={() => { setFilters({ status: '', priority: '', search: filters.search }); setPage(1); }}
                className="btn-secondary text-xs h-10">Clear</button>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No leads found</p>
            <button onClick={() => setShowModal(true)} className="btn-primary mx-auto mt-4">
              <Plus className="w-4 h-4" /> Add First Lead
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-slate-900/50">
                  {['Lead', 'Contact', 'Interest / Budget', 'Status', 'Priority', 'Agent', 'Added', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leads.map(lead => (
                  <tr key={lead._id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={clsx(
                          'w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0',
                          lead.priority === 'High' ? 'bg-red-500/20 text-red-400' :
                          lead.priority === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                        )}>
                          {lead.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <Link href={`/leads/${lead._id}`} className="font-medium text-slate-200 hover:text-brand-400 transition-colors">
                            {lead.name}
                          </Link>
                          <p className="text-xs text-slate-500">{lead.source}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Phone className="w-3 h-3" />
                          <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                            className="hover:text-emerald-400 transition-colors">{lead.phone}</a>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="w-3 h-3" /> {lead.location}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-200 text-sm">{lead.propertyInterest}</p>
                      <p className="text-xs text-brand-400 font-semibold">PKR {(lead.budget / 1_000_000).toFixed(1)}M</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx('status-badge border text-xs', STATUS_COLORS[lead.status])}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx(
                        lead.priority === 'High' ? 'badge-high' :
                        lead.priority === 'Medium' ? 'badge-medium' : 'badge-low'
                      )}>
                        <Star className="w-3 h-3" /> {lead.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {lead.assignedTo ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded bg-slate-700 flex items-center justify-center text-xs text-slate-400 font-bold">
                            {lead.assignedTo.name[0]}
                          </div>
                          <span className="text-xs text-slate-400">{lead.assignedTo.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/leads/${lead._id}`} title="View"
                          className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                          title="WhatsApp" className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400 transition-colors">
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                        <button onClick={() => { setEditLead(lead); setShowModal(true); }} title="Edit"
                          className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {isAdmin && (
                          <button onClick={() => deleteLead(lead._id, lead.name)} title="Delete"
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary p-2 disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-slate-400 px-2">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary p-2 disabled:opacity-40">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Lead Modal */}
      {showModal && (
        <LeadModal
          lead={editLead}
          onClose={() => { setShowModal(false); setEditLead(null); }}
          onSaved={() => { fetchLeads(); setShowModal(false); setEditLead(null); }}
        />
      )}
    </div>
  );
}
