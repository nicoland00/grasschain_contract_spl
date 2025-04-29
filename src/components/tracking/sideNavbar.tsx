"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

interface SideNavbarProps {
  open: boolean;
  onClose: () => void;
  isStats?: boolean; // Hide the close button & set background fully white if true
}

export default function SideNavbar({ open, onClose, isStats = false }: SideNavbarProps) {
  return (
    <div
      className={`
        absolute top-0 left-0 bottom-0
        transform transition-transform duration-300 z-40
        pointer-events-none
        ${open ? "translate-x-0" : "-translate-x-full"}
      `}
    >
      <div
        className={`
          relative w-64 h-full m-[15px]
          ${isStats ? "bg-white" : "bg-white/75"}
          rounded-[20px] p-4
          pointer-events-auto
        `}
        style={{ maxHeight: "calc(100% - 30px)" }}
      >
        {/* Hide the close button if isStats */}
        {!isStats && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/10 focus:outline-none"
            aria-label="Close sidebar"
          >
            <svg
              className="w-5 h-5 text-black"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Logo + Title */}
        <div className="flex flex-col items-center gap-2 mb-6 mt-2">
          <Image
            src="/logo.png"
            alt="Pastora"
            width={60}
            height={60}
            className="rounded-full"
          />
          <h2 className="text-2xl font-bold text-black">Pastora</h2>
        </div>

        {/* Nav items */}
        <nav className="flex flex-col text-black text-xl divide-y divide-gray-300">
          <Link href="/" className="py-3 hover:underline">
            Mapa
          </Link>
          <Link href="/stats" className="py-3 hover:underline">
            Estadísticas
          </Link>
        </nav>
      </div>
    </div>
  );
}
