import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Lead from '@/models/Lead';
import User from '@/models/User';
import Activity from '@/models/Activity';
import { requireAuth } from '@/lib/middleware/authHelper';
import { subDays, startOfDay } from 'date-fns';

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth('admin');
  if (error) return error;

  try {
    await connectDB();

    const [
      totalLeads,
      statusDist,
      priorityDist,
      sourceDist,
      agentPerformance,
      leadsOverTime,
      recentActivities,
    ] = await Promise.all([
      Lead.countDocuments(),

      Lead.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      Lead.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),

      Lead.aggregate([
        { $group: { _id: '$source', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      User.aggregate([
        { $match: { role: 'agent', isActive: true } },
        {
          $lookup: {
            from: 'leads',
            localField: '_id',
            foreignField: 'assignedTo',
            as: 'leads',
          },
        },
        {
          $project: {
            name: 1,
            email: 1,
            totalLeads: { $size: '$leads' },
            closedLeads: {
              $size: {
                $filter: { input: '$leads', as: 'l', cond: { $eq: ['$$l.status', 'Closed'] } },
              },
            },
            highPriorityLeads: {
              $size: {
                $filter: { input: '$leads', as: 'l', cond: { $eq: ['$$l.priority', 'High'] } },
              },
            },
          },
        },
        { $sort: { totalLeads: -1 } },
      ]),

      // Leads created in last 30 days
      Lead.aggregate([
        { $match: { createdAt: { $gte: subDays(new Date(), 30) } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      Activity.find()
        .populate('performedBy', 'name role')
        .populate('lead', 'name')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    // Compute summary
    const unassigned = await Lead.countDocuments({ assignedTo: null });
    const highPriority = await Lead.countDocuments({ priority: 'High' });
    const overdueFollowUps = await Lead.countDocuments({
      followUpDate: { $lt: new Date() },
      status: { $nin: ['Closed', 'Lost'] },
    });

    return NextResponse.json({
      summary: { totalLeads, unassigned, highPriority, overdueFollowUps },
      statusDistribution: statusDist,
      priorityDistribution: priorityDist,
      sourceDistribution: sourceDist,
      agentPerformance,
      leadsOverTime,
      recentActivities,
    });
  } catch (err) {
    console.error('Analytics error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
