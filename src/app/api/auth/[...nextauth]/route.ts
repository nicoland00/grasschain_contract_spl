// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

export const runtime = "edge"   // (optional, if you want edge)

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId:   process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
})

export { handler as GET, handler as POST }
