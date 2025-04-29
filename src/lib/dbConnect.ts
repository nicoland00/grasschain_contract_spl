// src/lib/dbConnect.ts
import mongoose from "mongoose";

let cached: { conn: mongoose.Mongoose | null; promise: Promise<mongoose.Mongoose> | null };

// We don’t grab the URI until runtime:
export async function dbConnect() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("⚠️ Define la variable MONGODB_URI en tu .env or in Vercel settings.");
  }

  if (!cached) {
    cached = { conn: null, promise: null };
  }
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((mongoose) => mongoose);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
