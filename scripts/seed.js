// @ts-nocheck
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../src/models/User');
const Application = require('../src/models/Application');

async function seed() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/factory-forge');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Application.deleteMany({});
    console.log('Cleared existing data');

    // Create demo users
    const demoUsers = [
      {
        _id: 'admin-001',
        name: 'Admin User',
        email: 'admin@factory.com',
        passwordHash: await bcrypt.hash('admin123', 10),
        role: 'boss',
        status: 'ACTIVE',
        createdAt: new Date()
      },
      {
        _id: 'dev-001',
        name: 'John Developer',
        email: 'developer@factory.com',
        passwordHash: await bcrypt.hash('dev123', 10),
        role: 'developer',
        status: 'ACTIVE',
        createdAt: new Date()
      },
      {
        _id: 'reseller-001',
        name: 'Jane Reseller',
        email: 'reseller@factory.com',
        passwordHash: await bcrypt.hash('reseller123', 10),
        role: 'reseller',
        status: 'ACTIVE',
        createdAt: new Date()
      }
    ];

    const createdUsers = await User.insertMany(demoUsers);
    console.log('Created demo users');

    // Create demo applications
    const demoApplications = [
      {
        _id: 'app-001',
        userId: 'pending-user-001',
        roleType: 'developer',
        data: {
          name: 'Pending Developer',
          email: 'pending@dev.com',
          phone: '+1 234 567 8900',
          experience: '3+ years in full-stack development',
          skills: 'React, Node.js, Python, AWS',
          github: 'https://github.com/pendingdev',
          linkedin: 'https://linkedin.com/in/pendingdev',
          whyJoin: 'Excited to work on cutting-edge projects'
        },
        status: 'PENDING',
        createdAt: new Date()
      },
      {
        _id: 'app-002',
        userId: 'pending-user-002',
        roleType: 'reseller',
        data: {
          name: 'Pending Reseller',
          email: 'pending@resell.com',
          phone: '+1 234 567 8901',
          company: 'Pending Enterprises',
          experience: '5+ years in B2B sales',
          targetMarket: 'Small to medium businesses',
          website: 'https://pendingenterprises.com',
          whyJoin: 'Strong network in tech sector'
        },
        status: 'PENDING',
        createdAt: new Date()
      }
    ];

    await Application.insertMany(demoApplications);
    console.log('Created demo applications');

    console.log('Database seeded successfully!');
    console.log('\nDemo Accounts:');
    console.log('Admin: admin@factory.com / admin123');
    console.log('Developer: developer@factory.com / dev123');
    console.log('Reseller: reseller@factory.com / reseller123');

  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
