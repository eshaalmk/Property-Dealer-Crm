'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Users, Plus, Mail, Phone, Building2, CheckCircle,
  TrendingUp, Loader2, X, Save, UserX, UserCheck
} from 'lucide-react';
import { clsx } from 'clsx';

interface Agent {
  _id: string; name: string; email: string; phone?: string;
  isActive: boolean; createdAt: string;
  stats: { totalLeads: number; closedLeads: number };
}

export default function AgentsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const user = session?.user as { role?: string } | undefined;

  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.role && user.role !== 'admin') { router.push('/leads'); return; }
    fetchAgents();
  }, [user, router]);

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/agents');
      const data = await res.json();
      setAgents(data.agents || []);
    } catch { toast.error('Failed to load agents'); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { toast.error('Fill all required fields'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Agent created!');
      setShowModal(false);
      setForm({ name: '', email: '', password: '', phone: '' });
      fetchAgents();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create agent');
    } finally { setSaving(false); }
  };

  const toggleActive = async (agent: Agent) => {
    const res = await fetch(`/api/agents/${agent._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !agent.isActive }),
    });
    if (res.ok) { toast.success(`Agent ${agent.isActive ? 'deactivated' : 'activated'}`); fetchAgents(); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Agents</h1>
          <p className="page-subtitle">{agents.length} agents registered</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Agent
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
        </div>
      ) : agents.length === 0 ? (
        <div className="card text-center py-16">
          <Users className="w-10 h-10 mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400">No agents yet</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mx-auto mt-4">
            <Plus className="w-4 h-4" /> Add First Agent
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map(agent => {
            const rate = agent.stats.totalLeads > 0
              ? Math.round((agent.stats.closedLeads / agent.stats.totalLeads) * 100) : 0;
            return (
              <div key={agent._id} className={clsx(
                'card hover:bg-slate-700/50 transition-colors',
                !agent.isActive && 'opacity-60'
              )}>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-lg">
                      {agent.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{agent.name}</p>
                      <p className={clsx('text-xs font-medium', agent.isActive ? 'text-emerald-400' : 'text-slate-500')}>
                        {agent.isActive ? '● Active' : '○ Inactive'}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => toggleActive(agent)} title={agent.isActive ? 'Deactivate' : 'Activate'}
                    className={clsx('p-1.5 rounded-lg transition-colors text-sm',
                      agent.isActive ? 'hover:bg-red-500/10 text-slate-400 hover:text-red-400' : 'hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400'
                    )}>
                    {agent.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                  </button>
                </div>

                {/* Info */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" /> <span className="truncate">{agent.email}</span>
                  </div>
                  {agent.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Phone className="w-3.5 h-3.5" /> {agent.phone}
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-900/50 rounded-xl">
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{agent.stats.totalLeads}</p>
                    <p className="text-xs text-slate-500">Total</p>
                  </div>
                  <div className="text-center border-x border-white/5">
                    <p className="text-lg font-bold text-emerald-400">{agent.stats.closedLeads}</p>
                    <p className="text-xs text-slate-500">Closed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-brand-400">{rate}%</p>
                    <p className="text-xs text-slate-500">Rate</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="w-full bg-slate-700 rounded-full h-1.5">
                    <div className="bg-brand-500 h-1.5 rounded-full transition-all" style={{ width: `${rate}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Agent Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-slate-800 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h2 className="font-display font-bold text-white">New Agent</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="label">Full Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="input" placeholder="Agent Name" required />
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="input" placeholder="agent@example.com" required />
              </div>
              <div>
                <label className="label">Phone</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="input" placeholder="923001234567" />
              </div>
              <div>
                <label className="label">Password *</label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="input" placeholder="Min. 6 characters" required />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
