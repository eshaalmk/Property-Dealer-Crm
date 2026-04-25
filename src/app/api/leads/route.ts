import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Lead from '@/models/Lead';
import Activity from '@/models/Activity';
import { requireAuth } from '@/lib/middleware/authHelper';
import { rateLimit } from '@/lib/middleware/rateLimit';
import { validateBody, leadSchema } from '@/lib/middleware/validation';
import { sendNewLeadEmail } from '@/lib/email';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const rl = rateLimit(req, user!.role);
  if (rl) return rl;

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const source = searchParams.get('source');
    const assignedTo = searchParams.get('assignedTo');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};

    // Agents only see their assigned leads
    if (user!.role === 'agent') {
      query.assignedTo = user!.id;
    } else if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (source) query.source = source;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const [leads, total] = await Promise.all([
      Lead.find(query)
        .populate('assignedTo', 'name email')
        .sort({ score: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Lead.countDocuments(query),
    ]);

    return NextResponse.json({
      leads,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('Get leads error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const rl = rateLimit(req, user!.role);
  if (rl) return rl;

  try {
    const body = await req.json();
    const validation = validateBody(leadSchema, body);
    if (!validation.valid) return validation.error;

    await connectDB();

    const leadData = validation.data!;
    const lead = await Lead.create(leadData);
    await lead.populate('assignedTo', 'name email');

    // Create activity
    await Activity.create({
      lead: lead._id,
      performedBy: user!.id,
      type: 'created',
      description: `Lead created by ${user!.name}`,
      metadata: { source: leadData.source, priority: lead.priority },
    });

    // Email notification to all admins
    try {
      const admins = await User.find({ role: 'admin', isActive: true });
      for (const admin of admins) {
        await sendNewLeadEmail(admin.email, {
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          propertyInterest: lead.propertyInterest,
          budget: lead.budget,
          priority: lead.priority,
          source: lead.source,
        });
      }
    } catch (emailErr) {
      console.error('Email notification failed:', emailErr);
    }

    return NextResponse.json({ lead }, { status: 201 });
  } catch (err) {
    console.error('Create lead error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
