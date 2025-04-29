// models/Contrato.ts
import mongoose, { Schema, model, models } from 'mongoose';

export interface IContrato extends Document {
  contractId: string;
  ranchId: string;
  wallet: string;
  nftMint: string;
}

const ContratoSchema = new Schema({
  contractId: { type: String, required: true, unique: true },
  ranchId: { type: String, required: true },
  wallet: { type: String, required: true },
  nftMint: { type: String, required: true },
}, { timestamps: true });

// El tercer parámetro indica el nombre EXACTO de la colección en MongoDB Atlas:
export default models.Contrato || model('Contrato', ContratoSchema, 'Contratos');
