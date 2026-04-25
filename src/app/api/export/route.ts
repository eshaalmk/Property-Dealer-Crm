import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Lead from '@/models/Lead';
import { requireAuth } from '@/lib/middleware/authHelper';

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') || 'json';

  try {
    await connectDB();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};
    if (user!.role === 'agent') query.assignedTo = user!.id;

    const leads = await Lead.find(query)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    if (format === 'csv') {
      const headers = ['Name', 'Email', 'Phone', 'Property Interest', 'Location', 'Budget (PKR)', 'Status', 'Priority', 'Score', 'Source', 'Assigned To', 'Follow-up Date', 'Created At'];
      const rows = leads.map((l) => [
        l.name,
        l.email,
        l.phone,
        l.propertyInterest,
        l.location,
        l.budget,
        l.status,
        l.priority,
        l.score,
        l.source,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (l.assignedTo as any)?.name || 'Unassigned',
        l.followUpDate ? new Date(l.followUpDate).toLocaleDateString() : '',
        new Date(l.createdAt).toLocaleDateString(),
      ]);

      const csv = [headers, ...rows]
        .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="leads-${Date.now()}.csv"`,
        },
      });
    }

    // Default JSON export
    return NextResponse.json({ leads, exportedAt: new Date(), total: leads.length });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
