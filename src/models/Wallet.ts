// @ts-nocheck
import mongoose, { Schema, Document } from 'mongoose';

export interface IWallet extends Document {
  _id: string;
  userId: string;
  tenantId: string;
  balance: number;
  currency: string;
  updatedAt: Date;
}

const WalletSchema: Schema = new Schema(
  {
    _id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    userId: {
      type: String,
      ref: 'User',
      required: true,
      unique: true,
    },
    tenantId: {
      type: String,
      required: true,
      default: 'global',
    },
    balance: {
      type: Number,
      default: 0,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
      required: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

WalletSchema.index({ tenantId: 1 });

export default mongoose.models.Wallet || mongoose.model<IWallet>('Wallet', WalletSchema);
