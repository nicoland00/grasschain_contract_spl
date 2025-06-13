// src/components/tracking/overlayLayout.tsx
"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import SideNavbar from "./sideNavbar";

// Lazy-load the leaflet map on the client only
const MapComponent = dynamic(() => import("./MapComponent"), { ssr: false });

interface OverlayLayoutProps {
  children: React.ReactNode;
}

export default function OverlayLayout({ children }: OverlayLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const isStats = pathname === "/stats" || pathname.startsWith("/stats");
  // You can still compute these offsets if you need them for custom zoom controls, etc.
  const loteLeft = sidebarOpen ? "left-[285px]" : "left-[90px]";
  const loteBgClass = isStats ? "bg-white" : "bg-white/75";

  return (
    <div className="relative flex-1 overflow-hidden min-h-[100dvh]">
      {/* full-screen map in the back */}
      <div className="absolute inset-0 z-0 h-full">
        <MapComponent sidebarOpen={sidebarOpen} />
      </div>

      {/* your UI content "in front" */}
      <div
        className="relative z-10 overflow-auto"
        style={{ paddingTop: "4rem", height: "100%" }}
      >
        {children}
      </div>

      {/* hamburger to open sidebar */}
      <button
        onClick={() => setSidebarOpen(true)}
        className={`
          absolute top-[30px] left-[15px] z-40
          bg-white text-black p-3 rounded-full shadow
          transition-opacity duration-200
          ${sidebarOpen ? "opacity-0 pointer-events-none" : "opacity-100"}
        `}
        aria-label="Toggle Menu"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* the actual slide-in sidebar */}
      <SideNavbar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isStats={isStats}
      />
    </div>
  );
}
