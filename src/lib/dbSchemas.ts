import mongoose, { Schema, model, models, Document } from 'mongoose';

// CryptoInvestor (on‑chain)
export interface ICryptoInvestor extends Document {
  contract:   string;
  investor:   string;
  nftMint:    string;
  txSignature:string;
  amount:      number;
}
const CryptoInvestorSchema = new Schema<ICryptoInvestor>({
  contract:    { type: String, required: true },
  investor:    { type: String, required: true },
  nftMint:     { type: String, required: true },
  txSignature: { type: String, required: true },
  amount:      { type: Number, required: true },
}, { timestamps: true });
export const CryptoInvestor =
  models.CryptoInvestor ||
  model<ICryptoInvestor>('CryptoInvestor', CryptoInvestorSchema);

// FiatInvestor (Stripe)
export interface IFiatInvestor extends Document {
  contract:        string;
  email:           string;
  amountPaid:      number;
  paymentMethod:   string;
  paymentIntentId: string;
  maskedCard?:     string;
}
const FiatInvestorSchema = new Schema<IFiatInvestor>({
  contract:        { type: String, required: true },
  email:           { type: String, required: true },
  amountPaid:      { type: Number, required: true },
  paymentMethod:   { type: String, required: true },
  paymentIntentId: { type: String, required: true },
  maskedCard:      { type: String },
}, { timestamps: true });
export const FiatInvestor =
  models.FiatInvestor ||
  model<IFiatInvestor>('FiatInvestor', FiatInvestorSchema);
