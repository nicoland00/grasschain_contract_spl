// src/models/Notification.ts
import mongoose, { Document, Model } from "mongoose";

export interface INotification extends Document {
  title: string;
  message: string;
  contract?: string;       // if set, only investors in that contract see it
  createdAt: Date;
}

const NotificationSchema = new mongoose.Schema<INotification>(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    contract: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default (mongoose.models.Notification as Model<INotification>) ??
  mongoose.model<INotification>("Notification", NotificationSchema);
