"use client";
import React, { useState } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import SideNavbar from "./sideNavbar";
import SelectLote from "./selectLote";

interface OverlayLayoutProps {
  children: React.ReactNode;
}

// Lazy-load del MapComponent para que solo se renderice en el cliente
const MapComponent = dynamic(() => import("./MapComponent"), { ssr: false });

export default function OverlayLayout({ children }: OverlayLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Determinar si estamos en la ruta de stats para ajustar el fondo y botones
  const isStats = pathname === "/stats" || pathname.startsWith("/stats");

  // Ajusta el posicionamiento del selector de lote en función del estado del sidebar
  const loteLeft = sidebarOpen ? "left-[285px]" : "left-[90px]";
  const loteBgClass = isStats ? "bg-white" : "bg-white/75";

  // Mostrar el mapa y el selector solo en la home
  const isHome = pathname === "/";

  return (
    <div className="relative flex-1 overflow-hidden">
      {isHome && (
        <div className="absolute inset-0 z-0">
          <MapComponent sidebarOpen={sidebarOpen} />
        </div>
      )}
      {/* Contenido principal recibido en children */}
      <div className="relative z-10 overflow-auto"
      style={{paddingTop: "4rem", height:"100%"}}>
        {children}
      </div>
      {/* Botón de hamburguesa para abrir el side navbar */}
      <button
        onClick={() => setSidebarOpen(true)}
        className={`
          absolute top-[15px] left-[15px] z-40
          bg-white text-black p-3 rounded-[20px]
          hover:bg-gray-200 transition-all duration-300
          ${sidebarOpen ? "opacity-0 pointer-events-none" : "opacity-100"}
        `}
        aria-label="Toggle Menu"
      >
        <svg
          className="w-10 h-10"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      {/* Selector de lote, solo se muestra en la home y cuando el sidebar está cerrado */}
      {isHome && !sidebarOpen && (
        <div
          className={`
            absolute top-[15px] z-40
            ${loteBgClass} rounded-[20px] p-3
            transition-all duration-300
            ${loteLeft}
          `}
        >
          <SelectLote />
        </div>
      )}
      {/* SideNavbar overlay */}
      <SideNavbar open={sidebarOpen} onClose={() => setSidebarOpen(false)} isStats={isStats} />
    </div>
  );
}
