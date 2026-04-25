import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  req: NextRequest,
  role: 'admin' | 'agent' | 'unknown' = 'unknown'
) {
  // Admins have no limit
  if (role === 'admin') return null;

  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const key = `${ip}:${role}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = role === 'agent' ? 50 : 100;

  const existing = rateLimitStore.get(key);

  if (!existing || now > existing.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return null;
  }

  if (existing.count >= maxRequests) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((existing.resetTime - now) / 1000)),
          'X-RateLimit-Limit': String(maxRequests),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  existing.count++;
  return null;
}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) rateLimitStore.delete(key);
  }
}, 5 * 60 * 1000);
