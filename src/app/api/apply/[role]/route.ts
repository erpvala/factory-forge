import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { triggerGlobalHooksAsync } from '@/lib/hooks/globalHookSystem';
import connectToDatabase from '@/lib/database';
import User from '@/models/User';
import Application from '@/models/Application';

export async function POST(request: NextRequest, { params }: { params: { role: string } }) {
  try {
    const role = String(params.role || '').trim();
    if (!role) {
      return NextResponse.json({ success: false, error: 'apply_role_required' }, { status: 400 });
    }

    const formData = await request.json();
    await connectToDatabase();

    const existingUser = await User.findOne({ email: formData.email });
    let user = existingUser;

    if (!user) {
      const hashedPassword = await bcrypt.hash('defaultPassword123', 10);
      user = await User.create({
        _id: uuidv4(),
        name: formData.name,
        email: formData.email,
        phone: formData.phone || '',
        passwordHash: hashedPassword,
        role: null,
        status: 'PENDING',
        createdAt: new Date(),
      });
    }

    const application = await Application.create({
      _id: uuidv4(),
      userId: user._id,
      roleType: role,
      data: formData,
      status: 'PENDING',
      createdAt: new Date(),
    });

    triggerGlobalHooksAsync({
      event: 'apply_created',
      module: 'applications',
      payload: {
        application_id: String(application._id),
        role,
        user_id: String(user._id),
      },
      hookType: 'post_action_hook',
    });

    return NextResponse.json({ success: true, applicationId: application._id, message: 'Application submitted' });
  } catch {
    return NextResponse.json({ success: false, error: 'apply_failed' }, { status: 500 });
  }
}
