// src/lib/dbConnect.ts
import mongoose from 'mongoose';

type Cache = {
  conn: mongoose.Mongoose | null;
  promise: Promise<mongoose.Mongoose> | null;
};

let cached: Cache;

// We no longer grab the URI at import time
export async function dbConnect(): Promise<mongoose.Mongoose> {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    // Now we only error if we actually try to connect
    throw new Error(
      '⚠️ No se encontró la variable MONGODB_URI. ' +
      'Por favor defínela en tu .env o en las Variables de Entorno de Vercel (Preview & Production).'
    );
  }

  if (!cached) {
    cached = { conn: null, promise: null };
  }
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
