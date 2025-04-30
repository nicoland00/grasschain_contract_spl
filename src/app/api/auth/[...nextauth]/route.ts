// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth/next";
import { authOptions } from "@/lib/auth";

// → force Node.js so the built-in 'crypto' module is there
export const runtime = "nodejs";

// NextAuth handler
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
