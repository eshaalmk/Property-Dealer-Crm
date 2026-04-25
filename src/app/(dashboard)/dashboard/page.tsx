'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import {
  Users, Building2, TrendingUp, AlertTriangle,
  Clock, CheckCircle, Star, Activity
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Analytics {
  summary: { totalLeads: number; unassigned: number; highPriority: number; overdueFollowUps: number };
  statusDistribution: { _id: string; count: number }[];
  priorityDistribution: { _id: string; count: number }[];
  sourceDistribution: { _id: string; count: number }[];
  agentPerformance: { _id: string; name: string; totalLeads: number; closedLeads: number; highPriorityLeads: number }[];
  leadsOverTime: { _id: string; count: number }[];
  recentActivities: { _id: string; description: string; type: string; createdAt: string; performedBy: { name: string }; lead: { name: string } }[];
}

const STATUS_COLORS: Record<string, string> = {
  New: '#3b82f6', Contacted: '#f59e0b', 'In Progress': '#8b5cf6',
  Negotiation: '#f0720f', Closed: '#10b981', Lost: '#ef4444',
};
const PRIORITY_COLORS: Record<string, string> = { High: '#ef4444', Medium: '#f59e0b', Low: '#10b981' };

const StatCard = ({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: number | string; sub?: string; color: string;
}) => (
  <div className="card hover:bg-slate-700/50 transition-colors">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-slate-400 text-sm font-medium">{label}</p>
        <p className="text-3xl font-bold text-white mt-1 font-display">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center`} style={{ background: color + '20' }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  const user = session?.user as { role?: string } | undefined;

  useEffect(() => {
    if (user?.role === 'agent') { router.push('/leads'); return; }
    fetch('/api/analytics')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user, router]);

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="card h-28 skeleton" />)}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="card h-64 skeleton" />)}
      </div>
    </div>
  );

  if (!data) return <div className="text-slate-400 text-center py-20">Failed to load analytics</div>;

  const { summary, statusDistribution, priorityDistribution, agentPerformance, leadsOverTime, recentActivities, sourceDistribution } = data;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back, {session?.user?.name} — here&apos;s your CRM overview</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Total Leads" value={summary.totalLeads} sub="All time" color="#3b82f6" />
        <StatCard icon={AlertTriangle} label="High Priority" value={summary.highPriority} sub="Needs attention" color="#ef4444" />
        <StatCard icon={Users} label="Unassigned" value={summary.unassigned} sub="Needs assignment" color="#f59e0b" />
        <StatCard icon={Clock} label="Overdue Follow-ups" value={summary.overdueFollowUps} sub="Immediate action" color="#f0720f" />
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Leads over time */}
        <div className="card lg:col-span-2">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-400" /> Lead Activity (30 days)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={leadsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} labelStyle={{ color: '#94a3b8' }} itemStyle={{ color: '#f0720f' }} />
              <Line type="monotone" dataKey="count" stroke="#f0720f" strokeWidth={2} dot={false} name="Leads" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Priority distribution */}
        <div className="card">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-brand-400" /> Priority Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={priorityDistribution} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={65} label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {priorityDistribution.map((entry, i) => (
                  <Cell key={i} fill={PRIORITY_COLORS[entry._id] || '#64748b'} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-3 mt-2">
            {priorityDistribution.map(p => (
              <div key={p._id} className="flex items-center gap-1.5 text-xs text-slate-400">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: PRIORITY_COLORS[p._id] || '#64748b' }} />
                {p._id}: <span className="text-white font-medium">{p.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Status distribution */}
        <div className="card">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-brand-400" /> Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statusDistribution} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis dataKey="_id" type="category" tick={{ fontSize: 11, fill: '#94a3b8' }} width={80} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} itemStyle={{ color: '#f1f5f9' }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Leads">
                {statusDistribution.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry._id] || '#64748b'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Agent performance */}
        <div className="card">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-400" /> Agent Performance
          </h3>
          {agentPerformance.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-10">No agents yet</p>
          ) : (
            <div className="space-y-3">
              {agentPerformance.slice(0, 5).map(agent => {
                const rate = agent.totalLeads > 0 ? Math.round((agent.closedLeads / agent.totalLeads) * 100) : 0;
                return (
                  <div key={agent._id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {agent.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <p className="text-sm font-medium text-slate-200 truncate">{agent.name}</p>
                        <p className="text-xs text-slate-500 ml-2 flex-shrink-0">{agent.totalLeads} leads · {rate}% closed</p>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-1.5">
                        <div className="bg-brand-500 h-1.5 rounded-full transition-all" style={{ width: `${rate}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Source distribution */}
        <div className="card">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-400" /> Lead Sources
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={sourceDistribution}>
              <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} itemStyle={{ color: '#f0720f' }} />
              <Bar dataKey="count" fill="#f0720f" radius={[4, 4, 0, 0]} name="Leads" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent activity feed */}
        <div className="card">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-400" /> Recent Activity
          </h3>
          {recentActivities.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-10">No recent activity</p>
          ) : (
            <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
              {recentActivities.map(act => (
                <div key={act._id} className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300 leading-snug">{act.description}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {act.performedBy?.name} · {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
