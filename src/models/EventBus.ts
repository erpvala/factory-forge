// @ts-nocheck
import mongoose, { Schema, Document } from 'mongoose';

export interface IEventBus extends Document {
  _id: string;
  eventType: string;
  source: string;
  data: Record<string, any>;
  userId?: string;
  sessionId?: string;
  processed: boolean;
  processedAt?: Date;
  error?: string;
  timestamp: Date;
}

const EventBusSchema: Schema = new Schema({
  _id: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  eventType: {
    type: String,
    required: true
  },
  source: {
    type: String,
    required: true
  },
  data: {
    type: Schema.Types.Mixed,
    required: true
  },
  userId: {
    type: String,
    ref: 'User'
  },
  sessionId: {
    type: String
  },
  processed: {
    type: Boolean,
    default: false
  },
  processedAt: {
    type: Date
  },
  error: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

// Indexes for performance
EventBusSchema.index({ eventType: 1 });
EventBusSchema.index({ source: 1 });
EventBusSchema.index({ userId: 1 });
EventBusSchema.index({ processed: 1 });
EventBusSchema.index({ timestamp: -1 });

export default mongoose.models.EventBus || mongoose.model<IEventBus>('EventBus', EventBusSchema);
