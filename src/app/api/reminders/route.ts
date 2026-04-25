import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Lead from '@/models/Lead';
import { requireAuth } from '@/lib/middleware/authHelper';
import { subDays } from 'date-fns';

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  try {
    await connectDB();

    const now = new Date();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const baseQuery: any = { status: { $nin: ['Closed', 'Lost'] } };
    if (user!.role === 'agent') baseQuery.assignedTo = user!.id;

    const [overdue, dueToday, stale, upcoming] = await Promise.all([
      // Overdue follow-ups (past due date)
      Lead.find({
        ...baseQuery,
        followUpDate: { $lt: now, $ne: null },
      }).populate('assignedTo', 'name').sort({ followUpDate: 1 }).limit(20),

      // Due today
      Lead.find({
        ...baseQuery,
        followUpDate: {
          $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
        },
      }).populate('assignedTo', 'name').sort({ followUpDate: 1 }).limit(20),

      // Stale - no activity in 7 days
      Lead.find({
        ...baseQuery,
        lastActivityAt: { $lt: subDays(now, 7) },
      }).populate('assignedTo', 'name').sort({ lastActivityAt: 1 }).limit(20),

      // Upcoming (next 3 days)
      Lead.find({
        ...baseQuery,
        followUpDate: {
          $gt: now,
          $lt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        },
      }).populate('assignedTo', 'name').sort({ followUpDate: 1 }).limit(20),
    ]);

    return NextResponse.json({ overdue, dueToday, stale, upcoming });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
