"use client";

import Link from "next/link";
import { ReactNode, Suspense } from "react";
import { WalletButton } from "../solana/solana-provider"; // Adjust import if needed

export function UiLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-800">
      {/* Navbar */}
      <nav className="navbar bg-white px-4 shadow">
        
          {/* Mobile hamburger (hidden on lg) */}
          <div className="dropdown">
            <label tabIndex={0} className="now">
            <img src="/favicon.png" alt="Pastora" className="h-11 w-20" />
            </label>
            <ul
              tabIndex={0}
              className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-white rounded-box w-52"
            >
                <li>
                <Link href="https://app.pastora.io" style={{ color: "#7AC78E" }}>App</Link>
              </li>
            </ul>
          </div>
          <div className="navbar-start">
        </div>

        {/* Desktop Nav (hidden on mobile) */}
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1">
          <li>
                <Link href="https://app.pastora.io" style={{ color: "#7AC78E" }}>Welcome to our App</Link>
              </li>
          </ul>
        </div>

        {/* Wallet Button on the right */}
        <div className="navbar-end space-x-2">
          <WalletButton />
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
        <main className="flex-grow container mx-auto px-4 py-8">{children}</main>
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
