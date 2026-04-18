// @ts-nocheck
import mongoose, { Schema, Document } from 'mongoose';

export interface IApplication extends Document {
  _id: string;
  userId: string;
  roleType: string;
  data: Record<string, any>;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema: Schema = new Schema({
  _id: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  userId: {
    type: String,
    ref: 'User',
    required: true
  },
  roleType: {
    type: String,
    enum: ['developer', 'reseller', 'franchise', 'influencer', 'job'],
    required: true
  },
  data: {
    type: Schema.Types.Mixed,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  }
}, {
  timestamps: true
});

// Index for performance
ApplicationSchema.index({ userId: 1 });
ApplicationSchema.index({ status: 1 });
ApplicationSchema.index({ roleType: 1 });
ApplicationSchema.index({ createdAt: -1 });

export default mongoose.models.Application || mongoose.model<IApplication>('Application', ApplicationSchema);
