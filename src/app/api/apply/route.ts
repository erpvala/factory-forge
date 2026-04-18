// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Real database connection
import { connectToDatabase } from '@/lib/database';
import User from '@/models/User';
import Application from '@/models/Application';
import { triggerGlobalHooksAsync } from '@/lib/hooks/globalHookSystem';

export async function POST(request: NextRequest) {
  try {
    const { role, ...formData } = await request.json();

    // Connect to real database
    const db = await connectToDatabase();
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: formData.email });
    let user;

    if (existingUser) {
      user = existingUser;
    } else {
      // Create real user with hashed password
      const hashedPassword = await bcrypt.hash('defaultPassword123', 10);
      
      user = new User({
        _id: uuidv4(),
        name: formData.name,
        email: formData.email,
        phone: formData.phone || '',
        passwordHash: hashedPassword,
        role: null, // Will be set on approval
        status: 'PENDING',
        createdAt: new Date()
      });

      await user.save();
    }

    // Create real application
    const application = new Application({
      _id: uuidv4(),
      userId: user._id,
      roleType: role,
      data: formData,
      status: 'PENDING',
      createdAt: new Date()
    });

    await application.save();

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

    return NextResponse.json({
      success: true,
      applicationId: application._id,
      message: 'Application submitted successfully'
    });

  } catch (error) {
    console.error('Application error:', error);
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    // Connect to real database
    const db = await connectToDatabase();
    
    // Build real query
    const query: any = {};
    if (status) {
      query.status = status;
    }
    
    // Fetch real applications with user data
    const applications = await Application.find(query)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      applications: applications.map(app => ({
        id: app._id,
        user: app.userId,
        role: app.roleType,
        data: app.data,
        status: app.status,
        createdAt: app.createdAt
      }))
    });

  } catch (error) {
    console.error('Get applications error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}
