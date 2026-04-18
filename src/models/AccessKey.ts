import mongoose, { Schema, Document } from 'mongoose';

export interface IAccessKey extends Document {
  _id: string;
  userId: string;
  accessKey: string;
  tenantId: string;
  status: 'active' | 'revoked';
  createdAt: Date;
  updatedAt: Date;
}

const AccessKeySchema: Schema = new Schema(
  {
    _id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    userId: {
      type: String,
      ref: 'User',
      required: true,
      index: true,
    },
    accessKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    tenantId: {
      type: String,
      required: true,
      default: 'global',
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'revoked'],
      default: 'active',
      index: true,
    },
  },
  { timestamps: true },
);

export default mongoose.models.AccessKey || mongoose.model<IAccessKey>('AccessKey', AccessKeySchema);
