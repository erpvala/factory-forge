// @ts-nocheck
import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  _id: string;
  userId: string;
  tenantId: string;
  productId: string;
  amount: number;
  currency: string;
  status: 'CREATED' | 'PAID' | 'DELIVERED' | 'FAILED' | 'CANCELLED';
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema = new Schema(
  {
    _id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    userId: {
      type: String,
      ref: 'User',
      required: true,
    },
    tenantId: {
      type: String,
      required: true,
      default: 'global',
    },
    productId: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
    },
    status: {
      type: String,
      enum: ['CREATED', 'PAID', 'DELIVERED', 'FAILED', 'CANCELLED'],
      default: 'CREATED',
    },
    paymentId: {
      type: String,
      ref: 'Payment',
    },
  },
  {
    timestamps: true,
  }
);

OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ tenantId: 1, status: 1 });

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
