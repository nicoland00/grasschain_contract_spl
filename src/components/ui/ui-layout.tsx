"use client";

import React, { ReactNode, Suspense } from "react";
import { Toaster } from "react-hot-toast";
import { usePathname } from "next/navigation";
import { WalletButton } from "../solana/solana-provider";
import Link from "next/link";
import Image from "next/image";

export function UiLayout({ children }: { children: ReactNode }): JSX.Element {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col bg-white text-black font-sans">
      {/* Navbar */}
      <header className="w-full h-16 border-b border-gray-200 flex items-center justify-between px-14">
        <div className="flex items-center">
          <Link href="https://pastora.io">
            <Image
              src="/logo1.png"
              alt="Pastora Logo"
              width={173} // approximate
              height={36}
              priority // if you want to optimize LCP
            />
          </Link>
        </div>
        <nav className="flex items-center space-x-6">
          <a
            href="https://pastora.io/blog"
            className="text-[#666666] no-underline hover:text-[#7AC78E]"
          >
            Blog
          </a>
          <a
            href="https://pastora.io/contactus"
            className="text-[#666666] no-underline hover:text-[#7AC78E]"
          >
            Contact Us
          </a>
          <WalletButton className="btn btn-sm" />
        </nav>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        <Suspense
          fallback={
            <div className="my-32 text-center">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          }
        >
          {children}
        </Suspense>
        <Toaster position="bottom-right" />
      </main>

      <footer className="border-t border-gray-200 p-4 text-center text-sm text-gray-500">
        <p>© 2025 Pastora. All rights reserved.</p>
      </footer>
    </div>
  );
}
