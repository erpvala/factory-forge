// @ts-nocheck
import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemMetrics extends Document {
  _id: string;
  metricType: 'CPU' | 'MEMORY' | 'DISK' | 'NETWORK' | 'USERS' | 'REVENUE' | 'ERRORS' | 'PERFORMANCE';
  value: number;
  unit: string;
  tags: Record<string, string>;
  timestamp: Date;
}

const SystemMetricsSchema: Schema = new Schema({
  _id: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  metricType: {
    type: String,
    enum: ['CPU', 'MEMORY', 'DISK', 'NETWORK', 'USERS', 'REVENUE', 'ERRORS', 'PERFORMANCE'],
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  tags: {
    type: Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

// Indexes for performance
SystemMetricsSchema.index({ metricType: 1 });
SystemMetricsSchema.index({ timestamp: -1 });
SystemMetricsSchema.index({ tags: 1 });

export default mongoose.models.SystemMetrics || mongoose.model<ISystemMetrics>('SystemMetrics', SystemMetricsSchema);
