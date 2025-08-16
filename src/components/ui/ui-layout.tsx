"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthIdentity } from "@/hooks/useAuthIdentity";
import { getStripe } from "@/lib/stripeClient";
import MobileNavbar from "@/components/mobile/MobileBottomNav";
// PRIVY:
import { PRIVY_ENABLED } from "@/lib/flags";
import WalletButton from "@/components/wallet/WalletButton";
import { useUnifiedIdentity } from "@/hooks/useUnifiedIdentity";

export function UiLayout({ children }: { children: ReactNode }) {
  const { email, address, authenticated, login } = useAuthIdentity();
  // PRIVY:
  const unified = useUnifiedIdentity();
  const router = useRouter();

  const handleCrypto = async () => {
    if (!authenticated) await login();
    router.push("/invest/crypto");
  };

  const handleStripe = async () => {
    if (!authenticated) await login();
    const stripe = await getStripe();
    const res = await fetch("/api/checkout/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, address }),
    });
    const data = await res.json();
    await stripe?.redirectToCheckout({ sessionId: data.id });
  };

  return (
    <div className="flex flex-col bg-white text-black">
      {/* Navbar */}
      <nav className="navbar bg-white px-4 shadow relative z-50">
        {/* Logo & Links */}
        <div className="navbar-start ">
          <Link href="/" className="flex items-center cursor-pointer">
            <img src="/favicon.ico" alt="Pastora" className="h-10 w-15" />
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

        {/* CTA Buttons */}
        <div className="navbar-end space-x-2 hidden md:flex">
          <button
            className="btn btn-primary rounded-xl font-bold shadow"
            onClick={handleCrypto}
          >
            Invest with Crypto
          </button>
          <button
            className="btn btn-secondary rounded-xl font-bold shadow"
            onClick={handleStripe}
          >
            Invest with Stripe
          </button>
          {/* PRIVY: Wallet and Invest buttons */}
          {PRIVY_ENABLED && (
            <>
              <WalletButton />
              <button
                className="btn btn-success"
                onClick={async () => {
                  const { authenticated: auth2, login: login2, address: address2 } = unified;
                  if (!auth2) await login2();
                  await fetch("/api/invest", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ address: address2 }),
                  });
                }}
              >
                Invest
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Page content */}
      <main className="flex-grow container mx-auto px-0 md:px-4">
        {children}
      </main>

      {/* Footer */}
      <footer className="footer items-center p-4 bg-white border-t">
        <div className="items-center grid-flow-col mx-auto">
          <p>© 2025 Pastora. All rights reserved.</p>
        </div>
      </footer>
      <MobileNavbar />
    </div>
  );
}
