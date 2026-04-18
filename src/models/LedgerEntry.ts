// @ts-nocheck
import mongoose, { Schema, Document } from 'mongoose';

export interface ILedgerEntry extends Document {
  _id: string;
  tenantId: string;
  orderId: string;
  paymentId: string;
  entryType: 'DEBIT_USER' | 'CREDIT_SYSTEM';
  amount: number;
  currency: string;
  createdAt: Date;
}

const LedgerEntrySchema: Schema = new Schema(
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
    entryType: {
      type: String,
      enum: ['DEBIT_USER', 'CREDIT_SYSTEM'],
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

LedgerEntrySchema.index({ orderId: 1, createdAt: -1 });
LedgerEntrySchema.index({ paymentId: 1 });

export default mongoose.models.LedgerEntry || mongoose.model<ILedgerEntry>('LedgerEntry', LedgerEntrySchema);
