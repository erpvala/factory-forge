// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';

// Real database connection
import { connectToDatabase } from '@/lib/database';
import Application from '@/models/Application';
import User from '@/models/User';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const applicationId = params.id;

    // Connect to real database
    const db = await connectToDatabase();
    
    // Find application
    const application = await Application.findById(applicationId);
    
    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Update application status
    application.status = 'REJECTED';
    await application.save();

    // Update user status
    await User.findByIdAndUpdate(application.userId, {
      status: 'REJECTED'
    });

    return NextResponse.json({
      success: true,
      message: 'Application rejected successfully'
    });

  } catch (error) {
    console.error('Reject application error:', error);
    return NextResponse.json(
      { error: 'Failed to reject application' },
      { status: 500 }
    );
  }
}
