// app/account/page.tsx
"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { User as UserIcon } from "lucide-react";

export default function AccountPage() {
  const { data: session } = useSession();
  const { publicKey, disconnect } = useWallet();

  return (
    <div className="min-h-screen px-4 md:px-8 space-y-6">
      {session?.user?.email || publicKey ? (
        <div className="space-y-4">
          {session?.user?.email && (
            <div className="flex items-center justify-between">
              <span>{session.user.email}</span>
              <button onClick={() => signOut()} className="btn btn-secondary">
                Sign out
              </button>
            </div>
          )}
          {publicKey && (
            <div className="flex flex-col items-center space-y-2">
            <UserIcon className="w-8 h-8" />
            <span className="font-mono">
              {publicKey.toBase58().slice(0, 6)}…{publicKey.toBase58().slice(-4)}
            </span>
              <button onClick={() => disconnect()} className="btn btn-secondary">
                Disconnect
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => signIn("google")}
          className="btn btn-primary w-full"
        >
          Sign in with Google
        </button>
      )}
    </div>
  );
}


