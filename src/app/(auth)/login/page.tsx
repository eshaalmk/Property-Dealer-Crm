'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill in all fields'); return; }

    setLoading(true);
    const res = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);

    if (res?.error) {
      toast.error('Invalid email or password');
    } else {
      toast.success('Welcome back!');
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="card gradient-border animate-slide-up">
      <h2 className="font-display text-xl font-bold text-white mb-1">Sign In</h2>
      <p className="text-slate-400 text-sm mb-6">Access your CRM dashboard</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input pl-9"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
        </div>

        <div>
          <label className="label">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input pl-9 pr-10"
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="btn-primary w-full justify-center py-2.5 mt-2">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : 'Sign In'}
        </button>
      </form>

      <div className="mt-4 pt-4 border-t border-white/5 text-center">
        <p className="text-sm text-slate-400">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
            Create one
          </Link>
        </p>
      </div>

      <div className="mt-4 p-3 bg-slate-900/60 rounded-lg text-xs text-slate-500 space-y-1">
        <p className="font-medium text-slate-400">Demo Credentials:</p>
        <p>Admin: admin@propertycrm.com / admin123</p>
        <p>Agent: agent@propertycrm.com / agent123</p>
      </div>
    </div>
  );
}
