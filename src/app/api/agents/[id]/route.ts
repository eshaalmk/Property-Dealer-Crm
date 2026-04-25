import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import User from '@/models/User';
import { requireAuth } from '@/lib/middleware/authHelper';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAuth('admin');
  if (error) return error;

  try {
    await connectDB();
    const body = await req.json();
    const { name, phone, isActive } = body;

    const agent = await User.findByIdAndUpdate(
      params.id,
      { ...(name && { name }), ...(phone !== undefined && { phone }), ...(isActive !== undefined && { isActive }) },
      { new: true }
    ).select('-password');

    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

    return NextResponse.json({ agent });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAuth('admin');
  if (error) return error;

  try {
    await connectDB();
    await User.findByIdAndUpdate(params.id, { isActive: false });
    return NextResponse.json({ message: 'Agent deactivated' });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
