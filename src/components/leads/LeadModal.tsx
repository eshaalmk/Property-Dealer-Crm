'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { X, Loader2, Save, DollarSign } from 'lucide-react';

interface Agent { _id: string; name: string; email: string; }
interface Lead {
  _id?: string; name?: string; email?: string; phone?: string;
  propertyInterest?: string; location?: string; budget?: number;
  status?: string; notes?: string; source?: string;
  assignedTo?: { _id: string; name: string } | null;
  followUpDate?: string;
}

interface Props {
  lead: Lead | null;
  onClose: () => void;
  onSaved: () => void;
}

const PROPERTY_TYPES = ['Residential', 'Commercial', 'Plot', 'Apartment', 'Villa', 'Office'];
const SOURCES = ['Facebook Ads', 'Walk-in', 'Website', 'Referral', 'Other'];
const STATUSES = ['New', 'Contacted', 'In Progress', 'Negotiation', 'Closed', 'Lost'];

export default function LeadModal({ lead, onClose, onSaved }: Props) {
  const { data: session } = useSession();
  const user = session?.user as { role?: string } | undefined;
  const isAdmin = user?.role === 'admin';

  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: lead?.name || '',
    email: lead?.email || '',
    phone: lead?.phone || '',
    propertyInterest: lead?.propertyInterest || 'Residential',
    location: lead?.location || '',
    budget: lead?.budget?.toString() || '',
    status: lead?.status || 'New',
    notes: lead?.notes || '',
    source: lead?.source || 'Other',
    assignedTo: (lead?.assignedTo as { _id: string } | null)?._id || '',
    followUpDate: lead?.followUpDate ? new Date(lead.followUpDate).toISOString().split('T')[0] : '',
  });

  useEffect(() => {
    if (isAdmin) {
      fetch('/api/agents').then(r => r.json()).then(d => setAgents(d.agents || []));
    }
  }, [isAdmin]);

  const budgetM = parseFloat(form.budget) / 1_000_000;
  const priority = budgetM > 20 ? 'High' : budgetM >= 10 ? 'Medium' : 'Low';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.budget || !form.location) {
      toast.error('Please fill in all required fields'); return;
    }

    setLoading(true);
    try {
      const body = {
        ...form,
        budget: parseFloat(form.budget),
        assignedTo: form.assignedTo || null,
        followUpDate: form.followUpDate || null,
      };

      const url = lead?._id ? `/api/leads/${lead._id}` : '/api/leads';
      const method = lead?._id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      toast.success(lead?._id ? 'Lead updated!' : 'Lead created!');
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error saving lead');
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-800 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 sticky top-0 bg-slate-800 z-10">
          <h2 className="font-display font-bold text-white text-lg">
            {lead?._id ? 'Edit Lead' : 'New Lead'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Budget preview */}
          {form.budget && (
            <div className={`flex items-center gap-3 p-3 rounded-xl border text-sm ${
              priority === 'High' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
              priority === 'Medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
              'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}>
              <DollarSign className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium">
                PKR {(parseFloat(form.budget) / 1_000_000).toFixed(2)}M — <strong>{priority} Priority</strong>
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} className="input" placeholder="Muhammad Ali" required />
            </div>
            <div>
              <label className="label">Email *</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="input" placeholder="client@example.com" required />
            </div>
            <div>
              <label className="label">Phone * (with country code)</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} className="input" placeholder="923001234567" required />
              <p className="text-xs text-slate-600 mt-1">Format: 923001234567 (no + sign)</p>
            </div>
            <div>
              <label className="label">Location *</label>
              <input value={form.location} onChange={e => set('location', e.target.value)} className="input" placeholder="DHA Phase 6, Lahore" required />
            </div>
            <div>
              <label className="label">Budget (PKR) *</label>
              <input type="number" value={form.budget} onChange={e => set('budget', e.target.value)} className="input" placeholder="25000000" required min="0" />
            </div>
            <div>
              <label className="label">Property Interest</label>
              <select value={form.propertyInterest} onChange={e => set('propertyInterest', e.target.value)} className="input">
                {PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Lead Source</label>
              <select value={form.source} onChange={e => set('source', e.target.value)} className="input">
                {SOURCES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className="input">
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            {isAdmin && (
              <div>
                <label className="label">Assign to Agent</label>
                <select value={form.assignedTo} onChange={e => set('assignedTo', e.target.value)} className="input">
                  <option value="">— Unassigned —</option>
                  {agents.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="label">Follow-up Date</label>
              <input type="date" value={form.followUpDate} onChange={e => set('followUpDate', e.target.value)} className="input" />
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              className="input min-h-24 resize-none" placeholder="Additional notes about this lead..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> {lead?._id ? 'Update Lead' : 'Create Lead'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
