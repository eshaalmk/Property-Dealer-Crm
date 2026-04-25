'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, AlertTriangle, Calendar, Activity, Loader2, ChevronRight } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';

interface Lead {
  _id: string; name: string; phone: string; priority: string;
  status: string; followUpDate?: string; lastActivityAt: string;
  assignedTo?: { name: string } | null;
}

interface Reminders {
  overdue: Lead[]; dueToday: Lead[]; stale: Lead[]; upcoming: Lead[];
}

const Section = ({ title, icon: Icon, leads, color, emptyMsg }: {
  title: string; icon: React.ElementType; leads: Lead[];
  color: string; emptyMsg: string;
}) => (
  <div className="card">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-semibold text-white flex items-center gap-2">
        <Icon className={clsx('w-4 h-4', color)} /> {title}
        {leads.length > 0 && (
          <span className="ml-1 px-2 py-0.5 bg-slate-700 text-slate-300 rounded-full text-xs font-bold">{leads.length}</span>
        )}
      </h3>
    </div>
    {leads.length === 0 ? (
      <p className="text-slate-500 text-sm text-center py-6">{emptyMsg} ✓</p>
    ) : (
      <div className="space-y-2">
        {leads.map(lead => (
          <Link key={lead._id} href={`/leads/${lead._id}`}
            className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 hover:bg-slate-700/50 transition-colors group">
            <div className={clsx(
              'w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0',
              lead.priority === 'High' ? 'bg-red-500/20 text-red-400' :
              lead.priority === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
            )}>
              {lead.name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-200 text-sm truncate">{lead.name}</p>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                <span>{lead.status}</span>
                <span>·</span>
                <span>{lead.priority} Priority</span>
                {lead.followUpDate && (
                  <>
                    <span>·</span>
                    <span className={clsx(new Date(lead.followUpDate) < new Date() ? 'text-red-400' : 'text-slate-500')}>
                      {format(new Date(lead.followUpDate), 'MMM d')}
                    </span>
                  </>
                )}
                {lead.assignedTo && (
                  <>
                    <span>·</span>
                    <span>{lead.assignedTo.name}</span>
                  </>
                )}
              </div>
            </div>
            <div className="text-xs text-slate-600 group-hover:text-slate-400 transition-colors flex items-center gap-1">
              {!lead.followUpDate && `Last active ${formatDistanceToNow(new Date(lead.lastActivityAt), { addSuffix: true })}`}
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        ))}
      </div>
    )}
  </div>
);

export default function RemindersPage() {
  const [data, setData] = useState<Reminders | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reminders').then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-brand-400" /></div>;

  const totalAlerts = (data?.overdue.length || 0) + (data?.dueToday.length || 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Clock className="w-6 h-6 text-brand-400" /> Follow-ups & Reminders
        </h1>
        <p className="page-subtitle">
          {totalAlerts > 0 ? `${totalAlerts} urgent items need your attention` : 'All follow-ups are on track'}
        </p>
      </div>

      {totalAlerts > 0 && (
        <div className="flex items-center gap-3 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span><strong>{totalAlerts} leads</strong> need immediate follow-up action.</span>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <Section title="Overdue Follow-ups" icon={AlertTriangle} leads={data?.overdue || []}
          color="text-red-400" emptyMsg="No overdue follow-ups" />
        <Section title="Due Today" icon={Calendar} leads={data?.dueToday || []}
          color="text-amber-400" emptyMsg="Nothing due today" />
        <Section title="Upcoming (Next 3 Days)" icon={Clock} leads={data?.upcoming || []}
          color="text-blue-400" emptyMsg="No upcoming follow-ups" />
        <Section title="Stale Leads (7+ Days Inactive)" icon={Activity} leads={data?.stale || []}
          color="text-slate-400" emptyMsg="No stale leads" />
      </div>
    </div>
  );
}
