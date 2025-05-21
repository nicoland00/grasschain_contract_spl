"use client";

import Link from "next/link";
import { ReactNode, Suspense, useState, useEffect } from "react";
import { useWallet } from "../solana/solana-provider"; 
import { useSession, signOut } from "next-auth/react";
import LoginIsland from "@/components/grasschain_contract_spl/LoginIsland";
import MobileBottomNav from "@/components/mobile/MobileBottomNav";

export function UiLayout({ children }: { children: ReactNode }) {
  const { publicKey, disconnect } = useWallet();
  const { data: session, status } = useSession();
  const [showLogin, setShowLogin] = useState(false);
  const userEmail = session?.user?.email;

  // auto‐close our overlay once they really are signed in
  useEffect(() => {
      if (session || status === "loading") setShowLogin(false);
    }, [session, status]);

  return (
    <div className="flex flex-col bg-white text-black">
      {showLogin && !session && <LoginIsland />}
      {/* Navbar */}
      <nav className="navbar bg-white px-4 shadow relative z-50">
        {/* Logo & Links */}
        <div className="navbar-start ">
          <Link href="/" className="flex items-center">
            <img src="/favicon.ico" alt="Pastora" className="h-11 w-20" />
          </Link>
        </div>

        {/* Main navigation for all three sections */}
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1 space-x-4">
            <li>
              <Link href="/" className="hover:text-green-600">
                Contracts
              </Link>
            </li>
            <li>
              <Link href="/tracking" className="hover:text-green-600">
                Tracking
              </Link>
            </li>
          </ul>
        </div>

        {/* Auth / Wallet controls */}
        <div className="navbar-end space-x-2 hidden md:flex">
          {publicKey ? (
            <button
              className="btn btn-outline"
              onClick={() => disconnect()}
            >
              {publicKey.toBase58().slice(0, 6)}…{publicKey.toBase58().slice(-4)} (Disconnect)
            </button>
          ) : userEmail ? (
            <button
              className="btn btn-outline"
              onClick={() => signOut()}
            >
              {userEmail} (Sign out)
            </button>
          ) : (
                        // Not signed in: we'll pop the LoginIsland on protected pages—
                        // here you could just show a "Sign in" link if you like
                        <button className="btn btn-outline" onClick={() => setShowLogin(true)}>
                          Sign in
                        </button>
                     )}

        </div>
      </nav>

      {/* Page content */}
      <Suspense
        fallback={
          <div className="flex-grow flex items-center justify-center">
            <div className="loading loading-spinner loading-lg" />
          </div>
        }
      >
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
      </Suspense>

      {/* Footer */}
      <footer className="footer items-center p-4 bg-white border-t">
        <div className="items-center grid-flow-col mx-auto">
          <p>© 2025 Pastora. All rights reserved.</p>
        </div>
      </footer>
      <MobileBottomNav />
    </div>
  );
}
