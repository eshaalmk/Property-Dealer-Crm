import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'agent';
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session.user as SessionUser;
}

export async function requireAuth(role?: 'admin' | 'agent') {
  const user = await getSessionUser();
  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  if (role && user.role !== role) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Forbidden: insufficient permissions' }, { status: 403 }),
    };
  }
  return { user, error: null };
}
