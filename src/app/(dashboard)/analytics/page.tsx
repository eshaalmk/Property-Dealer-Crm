'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, Legend
} from 'recharts';
import { TrendingUp, Loader2 } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  New: '#3b82f6', Contacted: '#f59e0b', 'In Progress': '#8b5cf6',
  Negotiation: '#f0720f', Closed: '#10b981', Lost: '#ef4444',
};
const PRIORITY_COLORS: Record<string, string> = { High: '#ef4444', Medium: '#f59e0b', Low: '#10b981' };

interface Analytics {
  summary: { totalLeads: number; unassigned: number; highPriority: number; overdueFollowUps: number };
  statusDistribution: { _id: string; count: number }[];
  priorityDistribution: { _id: string; count: number }[];
  sourceDistribution: { _id: string; count: number }[];
  agentPerformance: { _id: string; name: string; totalLeads: number; closedLeads: number; highPriorityLeads: number }[];
  leadsOverTime: { _id: string; count: number }[];
}

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const user = session?.user as { role?: string } | undefined;

  useEffect(() => {
    if (user?.role && user.role !== 'admin') { router.push('/leads'); return; }
    fetch('/api/analytics').then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, [user, router]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-brand-400" /></div>;
  if (!data) return null;

  const { statusDistribution, priorityDistribution, agentPerformance, leadsOverTime, sourceDistribution, summary } = data;

  // Radar data for agent comparison
  const radarData = agentPerformance.slice(0, 5).map(a => ({
    name: a.name.split(' ')[0],
    'Total Leads': a.totalLeads,
    'Closed': a.closedLeads,
    'High Priority': a.highPriorityLeads,
  }));

  const conversionData = agentPerformance.map(a => ({
    name: a.name.split(' ')[0],
    rate: a.totalLeads > 0 ? Math.round((a.closedLeads / a.totalLeads) * 100) : 0,
    total: a.totalLeads,
  }));

  const tooltipStyle = { background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2"><TrendingUp className="w-6 h-6 text-brand-400" /> Analytics</h1>
        <p className="page-subtitle">Full performance overview of your CRM</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads', value: summary.totalLeads, color: '#3b82f6' },
          { label: 'High Priority', value: summary.highPriority, color: '#ef4444' },
          { label: 'Unassigned', value: summary.unassigned, color: '#f59e0b' },
          { label: 'Overdue Follow-ups', value: summary.overdueFollowUps, color: '#f0720f' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center">
            <p className="text-3xl font-display font-bold" style={{ color }}>{value}</p>
            <p className="text-slate-400 text-sm mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Leads over time */}
        <div className="card">
          <h3 className="font-semibold text-white mb-4">Lead Volume (30 Days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={leadsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#94a3b8' }} itemStyle={{ color: '#f0720f' }} />
              <Line type="monotone" dataKey="count" stroke="#f0720f" strokeWidth={2.5} dot={{ fill: '#f0720f', r: 3 }} name="Leads" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Status breakdown */}
        <div className="card">
          <h3 className="font-semibold text-white mb-4">Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusDistribution} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis dataKey="_id" type="category" tick={{ fontSize: 11, fill: '#94a3b8' }} width={80} />
              <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#f1f5f9' }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Leads">
                {statusDistribution.map((e, i) => <Cell key={i} fill={STATUS_COLORS[e._id] || '#64748b'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Priority pie */}
        <div className="card">
          <h3 className="font-semibold text-white mb-4">Priority Distribution</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="55%" height={200}>
              <PieChart>
                <Pie data={priorityDistribution} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                  {priorityDistribution.map((e, i) => <Cell key={i} fill={PRIORITY_COLORS[e._id] || '#64748b'} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {priorityDistribution.map(p => (
                <div key={p._id} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: PRIORITY_COLORS[p._id] }} />
                  <span className="text-sm text-slate-400">{p._id}</span>
                  <span className="text-sm font-bold text-white ml-auto pl-4">{p.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Source distribution */}
        <div className="card">
          <h3 className="font-semibold text-white mb-4">Lead Sources</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sourceDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#f0720f' }} />
              <Bar dataKey="count" fill="#f0720f" radius={[4, 4, 0, 0]} name="Leads" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Agent section */}
      {agentPerformance.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Conversion rate */}
          <div className="card">
            <h3 className="font-semibold text-white mb-4">Agent Conversion Rates (%)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={conversionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 100]} unit="%" />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'Conversion Rate']} />
                <Bar dataKey="rate" fill="#10b981" radius={[4, 4, 0, 0]} name="Conversion Rate" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Radar chart */}
          {radarData.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-white mb-4">Agent Performance Radar</h3>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Radar name="Total" dataKey="Total Leads" stroke="#f0720f" fill="#f0720f" fillOpacity={0.15} />
                  <Radar name="Closed" dataKey="Closed" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                  <Legend formatter={v => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Agent table */}
      {agentPerformance.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-white mb-4">Agent Performance Table</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Agent', 'Total Leads', 'Closed', 'High Priority', 'Conversion Rate', 'Performance'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-xs text-slate-500 uppercase font-semibold tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {agentPerformance.map(a => {
                  const rate = a.totalLeads > 0 ? Math.round((a.closedLeads / a.totalLeads) * 100) : 0;
                  return (
                    <tr key={a._id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-xs text-white font-bold">
                            {a.name[0]}
                          </div>
                          <span className="font-medium text-slate-200">{a.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{a.totalLeads}</td>
                      <td className="py-3 px-3 text-emerald-400 font-semibold">{a.closedLeads}</td>
                      <td className="py-3 px-3 text-red-400">{a.highPriorityLeads}</td>
                      <td className="py-3 px-3 text-brand-400 font-bold">{rate}%</td>
                      <td className="py-3 px-3 w-36">
                        <div className="w-full bg-slate-700 rounded-full h-1.5">
                          <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${rate}%` }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
