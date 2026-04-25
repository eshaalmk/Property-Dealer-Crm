'use client';
import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, UserCircle, Bell, LogOut, Menu, X,
  Building2, ChevronRight, Settings, TrendingUp, Clock
} from 'lucide-react';
import { clsx } from 'clsx';

const adminNav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/leads', icon: Building2, label: 'All Leads' },
  { href: '/agents', icon: Users, label: 'Agents' },
  { href: '/analytics', icon: TrendingUp, label: 'Analytics' },
  { href: '/reminders', icon: Clock, label: 'Reminders' },
];

const agentNav = [
  { href: '/leads', icon: Building2, label: 'My Leads' },
  { href: '/reminders', icon: Clock, label: 'Follow-ups' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState(0);

  const user = session?.user as { name?: string; email?: string; role?: string } | undefined;
  const isAdmin = user?.role === 'admin';
  const navItems = isAdmin ? adminNav : agentNav;

  useEffect(() => {
    // Fetch overdue reminders count
    fetch('/api/reminders')
      .then(r => r.json())
      .then(d => {
        if (d.overdue) setNotifications(d.overdue.length + (d.dueToday?.length || 0));
      })
      .catch(() => {});
  }, []);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-brand-500/30 text-lg flex-shrink-0">
            P
          </div>
          <div>
            <p className="font-display font-bold text-white text-base leading-none">PropertyCRM</p>
            <p className="text-xs text-slate-500 mt-0.5">Real Estate Management</p>
          </div>
        </div>
      </div>

      {/* Role badge */}
      <div className="px-4 py-3">
        <div className={clsx(
          'text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5',
          isAdmin ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20' : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
        )}>
          <div className={clsx('w-1.5 h-1.5 rounded-full', isAdmin ? 'bg-brand-400' : 'bg-blue-400')} />
          {isAdmin ? 'Administrator' : 'Agent'}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link key={href} href={href} onClick={() => setSidebarOpen(false)}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                active
                  ? 'bg-brand-500/15 text-brand-300 border border-brand-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              )}>
              <Icon className={clsx('w-4 h-4 flex-shrink-0', active ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300')} />
              <span className="flex-1">{label}</span>
              {label === 'Follow-ups' && notifications > 0 && (
                <span className="bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {notifications > 9 ? '9+' : notifications}
                </span>
              )}
              {active && <ChevronRight className="w-3 h-3 text-brand-400" />}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="px-3 py-3 border-t border-white/5">
        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-900/60">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-200 truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <button onClick={handleSignOut} title="Sign out"
            className="text-slate-500 hover:text-red-400 transition-colors p-1">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-slate-900 border-r border-white/5 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-slate-900 border-r border-white/5 flex flex-col z-10">
            <button onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-slate-900/80 backdrop-blur-sm border-b border-white/5 flex items-center px-4 gap-3 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-white transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <Link href="/reminders" className="relative text-slate-400 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-bold">
                {notifications > 9 ? '9+' : notifications}
              </span>
            )}
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
