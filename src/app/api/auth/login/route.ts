// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { randomUUID } from 'crypto';

// Real database connection (replace with your DB)
import connectToDatabase from '@/lib/database';
import User from '@/models/User';
import AccessKey from '@/models/AccessKey';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Connect to real database
    const db = await connectToDatabase();
    
    // Find user in real database
    const user = await User.findOne({ email });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (!user.role) {
      return NextResponse.json(
        { error: 'Role not assigned yet' },
        { status: 403 }
      );
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'User is not active' },
        { status: 403 }
      );
    }

    // Verify password with real bcrypt
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const accessKey = await AccessKey.findOne({ userId: String(user._id), status: 'active' }).sort({ createdAt: -1 });
    if (!accessKey) {
      return NextResponse.json(
        { error: 'Access key missing or inactive' },
        { status: 403 }
      );
    }

    // Create real JWT token
    const token = sign(
      { 
        userId: user._id,
        email: user.email,
        role: user.role,
        status: user.status 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Set real HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    const deviceId = request.cookies.get('device_id')?.value || randomUUID();
    response.cookies.set('device_id', deviceId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
    });

    response.cookies.set('tenant_id', accessKey.tenantId || 'global', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
    });

    response.cookies.set('access_key_status', 'active', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
