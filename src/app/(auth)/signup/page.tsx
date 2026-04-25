'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2, Mail, User, Phone, Lock } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error('Please fill in all required fields'); return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters'); return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role: 'agent' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Account created! Please sign in.');
      router.push('/login');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card gradient-border animate-slide-up">
      <h2 className="font-display text-xl font-bold text-white mb-1">Create Account</h2>
      <p className="text-slate-400 text-sm mb-6">Join as an agent — admin will assign you leads</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Full Name *</label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="input pl-9" placeholder="Muhammad Ali" />
          </div>
        </div>
        <div>
          <label className="label">Email Address *</label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              className="input pl-9" placeholder="you@example.com" />
          </div>
        </div>
        <div>
          <label className="label">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              className="input pl-9" placeholder="923001234567" />
          </div>
        </div>
        <div>
          <label className="label">Password *</label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input type={showPassword ? 'text' : 'password'} value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="input pl-9 pr-10" placeholder="Min. 6 characters" />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Creating account...</> : 'Create Account'}
        </button>
      </form>

      <div className="mt-4 pt-4 border-t border-white/5 text-center">
        <p className="text-sm text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
