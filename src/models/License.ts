// @ts-nocheck
import mongoose, { Schema, Document } from 'mongoose';

export interface ILicense extends Document {
  _id: string;
  userId: string;
  productId: string;
  licenseKey: string;
  type: 'TRIAL' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE';
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED';
  expiresAt: Date;
  features: string[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const LicenseSchema: Schema = new Schema({
  _id: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  userId: {
    type: String,
    ref: 'User',
    required: true
  },
  productId: {
    type: String,
    required: true
  },
  licenseKey: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['TRIAL', 'STANDARD', 'PREMIUM', 'ENTERPRISE'],
    default: 'STANDARD'
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'EXPIRED', 'SUSPENDED', 'CANCELLED'],
    default: 'ACTIVE'
  },
  expiresAt: {
    type: Date,
    required: true
  },
  features: {
    type: [String],
    default: []
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for performance
LicenseSchema.index({ userId: 1 });
LicenseSchema.index({ licenseKey: 1 });
LicenseSchema.index({ status: 1 });
LicenseSchema.index({ expiresAt: 1 });
LicenseSchema.index({ productId: 1 });

export default mongoose.models.License || mongoose.model<ILicense>('License', LicenseSchema);
