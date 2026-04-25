import { NextRequest } from 'next/server';

// Socket.io is handled via custom server in server.js
// This route provides polling fallback endpoint
export async function GET(req: NextRequest) {
  return new Response(JSON.stringify({ status: 'Socket server running on /api/socket' }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
