"use client";

import Link from "next/link";
import { ReactNode, Suspense } from "react";
import { WalletButton, useWallet } from "../solana/solana-provider"; 
import { useSession, signOut } from "next-auth/react";

export function UiLayout({ children }: { children: ReactNode }) {
  const { publicKey, disconnect } = useWallet();
  const { data: session } = useSession();
  const userEmail = session?.user?.email;

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-800">
      {/* Navbar */}
      <nav className="navbar bg-white px-4 shadow">
        {/* Logo & Links */}
        <div className="navbar-start">
          <Link href="/" className="flex items-center">
            <img src="/favicon.ico" alt="Pastora" className="h-11 w-20" />
          </Link>
        </div>

        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1">
            <li>
              <Link href="https://track.pastora.io" style={{ color: "#7AC78E" }}>
                Track your animals here
              </Link>
            </li>
          </ul>
        </div>

        {/* "Disconnect" or "Sign out" */}
        <div className="navbar-end space-x-2">
          {publicKey ? (
            <button
              className="btn btn-outline"
              onClick={() => disconnect()}
            >
              {publicKey.toBase58().slice(0,6)}…{publicKey.toBase58().slice(-4)} (Disconnect)
            </button>
          ) : userEmail ? (
            <button
              className="btn btn-outline"
              onClick={() => signOut()}
            >
              {userEmail} (Sign out)
            </button>
          ) : (
            <>
              <WalletButton />
              {userEmail && (
                <div className="flex items-center space-x-2 ml-4">
                  <span className="text-sm">{userEmail}</span>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => signOut()}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </>
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
    </div>
  );
}
