import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Activity from '@/models/Activity';
import Lead from '@/models/Lead';
import { requireAuth } from '@/lib/middleware/authHelper';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth();
  if (error) return error;

  try {
    await connectDB();

    const lead = await Lead.findById(params.id);
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    if (user!.role === 'agent' && lead.assignedTo?.toString() !== user!.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const activities = await Activity.find({ lead: params.id })
      .populate('performedBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({ activities });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
