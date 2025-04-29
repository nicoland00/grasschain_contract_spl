import mongoose, { Schema, Document, model, models } from 'mongoose';

export interface ICryptoInvestor extends Document {
  contract: string;
  investor: string;
  nftMint: string;
  ranchId: string;
  // …otros campos que necesites
}

const CryptoInvestorSchema = new Schema({
  contract:   { type: String, required: true },
  investor:   { type: String, required: true },
  nftMint:    { type: String, required: true },
  ranchId:    { type: String, required: true },
  // …añade aquí createdAt, updatedAt, etc.
}, { timestamps: true });

export default models.CryptoInvestor ||
  model<ICryptoInvestor>('CryptoInvestor', CryptoInvestorSchema, 'cryptoinvestors');
