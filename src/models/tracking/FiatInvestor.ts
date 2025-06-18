import mongoose, { Schema, Document, model, models } from 'mongoose';

export interface IFiatInvestor extends Document {
  contract: string;
  email: string;
  amountPaid: number;
  paymentMethod: string;
  maskedCard: string;
  ranchId: string;
  lotId?: string;
  // …otros campos
}

const FiatInvestorSchema = new Schema({
  contract:      { type: String, required: true },
  email:         { type: String, required: true, index: true },
  amountPaid:    { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  maskedCard:    { type: String, required: true },
  ranchId:       { type: String, required: true },
  lotId:         { type: String },
  // …añade timestamps si quieres
}, { timestamps: true });

export default models.FiatInvestor ||
  model<IFiatInvestor>('FiatInvestor', FiatInvestorSchema, 'fiatinvestors');
