// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';

// Real database connection
import connectToDatabase from '@/lib/database';
import Application from '@/models/Application';
import User from '@/models/User';
import { triggerGlobalHooksAsync } from '@/lib/hooks/globalHookSystem';
import AccessKey from '@/models/AccessKey';
import { randomUUID } from 'crypto';
import { getSessionFromRequest, requireRole, requireTenant, requireCriticalActionApproval } from '@/lib/api/sessionAuth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSessionFromRequest(request);
    requireTenant(session);
    requireRole(session, ['boss_owner', 'ceo', 'super_admin']);
    requireCriticalActionApproval(request);

    const applicationId = params.id;

    // Connect to real database
    await connectToDatabase();
    
    // Find application
    const application = await Application.findById(applicationId);
    
    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Update application status
    application.status = 'APPROVED';
    await application.save();

    // Update user role and status
    await User.findByIdAndUpdate(application.userId, {
      role: application.roleType,
      status: 'ACTIVE'
    });

    await AccessKey.create({
      userId: String(application.userId || ''),
      accessKey: `ak_${randomUUID().replace(/-/g, '')}`,
      tenantId: 'global',
      status: 'active',
    });

    triggerGlobalHooksAsync({
      event: 'approved',
      module: 'applications',
      payload: {
        application_id: String(application._id),
        role: String(application.roleType || ''),
        user_id: String(application.userId || ''),
      },
      hookType: 'post_action_hook',
    });

    return NextResponse.json({
      success: true,
      message: 'Application approved successfully'
    });

  } catch (error) {
    console.error('Approve application error:', error);
    return NextResponse.json(
      { error: 'Failed to approve application' },
      { status: 500 }
    );
  }
}
