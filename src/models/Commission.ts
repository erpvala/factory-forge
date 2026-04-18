// @ts-nocheck
import mongoose, { Schema, Document } from 'mongoose';

export interface ICommission extends Document {
  _id: string;
  tenantId: string;
  orderId: string;
  paymentId: string;
  recipientType: 'SYSTEM' | 'RESELLER' | 'FRANCHISE' | 'INFLUENCER';
  amount: number;
  currency: string;
  createdAt: Date;
}

const CommissionSchema: Schema = new Schema(
  {
    _id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    tenantId: {
      type: String,
      required: true,
      default: 'global',
    },
    orderId: {
      type: String,
      ref: 'Order',
      required: true,
    },
    paymentId: {
      type: String,
      ref: 'Payment',
      required: true,
    },
    recipientType: {
      type: String,
      enum: ['SYSTEM', 'RESELLER', 'FRANCHISE', 'INFLUENCER'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

CommissionSchema.index({ orderId: 1, createdAt: -1 });
CommissionSchema.index({ recipientType: 1 });

export default mongoose.models.Commission || mongoose.model<ICommission>('Commission', CommissionSchema);
