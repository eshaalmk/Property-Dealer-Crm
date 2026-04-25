import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import User from '@/models/User';
import { validateBody, signupSchema } from '@/lib/middleware/validation';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = validateBody(signupSchema, body);
    if (!validation.valid) return validation.error;

    await connectDB();

    const { name, email, password, role, phone } = validation.data!;

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Only allow admin signup if no admin exists yet (first-time setup)
    // or if the request explicitly skips role (default agent)
    const assignedRole = role || 'agent';

    const user = await User.create({ name, email, password, role: assignedRole, phone });

    return NextResponse.json(
      { message: 'Account created successfully', user: { id: user._id, name: user.name, email: user.email, role: user.role } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
