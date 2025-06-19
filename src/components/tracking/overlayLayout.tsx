// src/components/tracking/OverlayLayout.tsx
"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import SideNavbar from "./sideNavbar";
import StatsPanel from "./StatsPanel";

const MapComponent = dynamic(() => import("./MapComponent"), { ssr: false });

export default function OverlayLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const isStats = pathname.includes("/stats");

  return (
    <div className="relative flex-1 overflow-hidden min-h-screen">
      {/* Map behind everything */}
      <div className="absolute inset-0 z-0">
        <MapComponent sidebarOpen={sidebarOpen} />
      </div>

      {/* Foreground UI */}
      <div
        className="relative z-10 overflow-auto"
        style={{ paddingTop: isStats ? undefined : "4rem", height: "100%" }}
      >
        {isStats ? <StatsPanel /> : children}
      </div>

      {/* Hamburger */}
      <button
        onClick={() => setSidebarOpen(true)}
        className={`absolute top-4 left-4 z-40 bg-white p-3 rounded-full shadow ${
          sidebarOpen ? "opacity-0 pointer-events-none" : ""
        }`}
        aria-label="Open menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <SideNavbar open={sidebarOpen} onClose={() => setSidebarOpen(false)} isStats={isStats} />
    </div>
  );
}
