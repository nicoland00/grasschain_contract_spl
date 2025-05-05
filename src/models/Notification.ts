// src/models/Notification.ts
import mongoose, { Document, Model } from "mongoose";

export type StageKey =
  | "bought"
  | "verification"
  | "active"
  | "settling"
  | "settled"
  | "defaulted";

export interface INotification extends Document {
  title:   string;
  message: string;
  contract: string | null;   // contract ID (or null for global)
  stage:   StageKey;         // <-- new!
  createdAt: Date;
}

const NotificationSchema = new mongoose.Schema<INotification>(
  {
    title:   { type: String, required: true },
    message: { type: String, required: true },
    contract:{ type: String, default: null },
    stage:   {
      type: String,
      enum: [
        "bought",
        "verification",
        "active",
        "settling",
        "settled",
        "defaulted",
      ],
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export default (mongoose.models.Notification as Model<INotification>) ||
  mongoose.model<INotification>("Notification", NotificationSchema);
