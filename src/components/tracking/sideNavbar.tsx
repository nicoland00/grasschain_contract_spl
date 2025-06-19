// src/components/tracking/sideNavbar.tsx
"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import LotSelector from "./lotSelector";

export default function SideNavbar({
  open,
  onClose,
  isStats = false,
}: {
  open:     boolean;
  onClose:  () => void;
  isStats?: boolean;
}) {
  const pathname = usePathname();
  const router   = useRouter();

  function go(path: string) {
    onClose();
    if (pathname !== path) router.push(path);
  }

  return (
    <div
      className={`absolute top-0 left-0 bottom-0 z-40 transform transition-transform duration-300 ${
        open ? "translate-x-0" : "-translate-x-full"
      } pointer-events-none`}
    >
      <div className={`relative w-64 h-full m-4 p-4 rounded-2xl pointer-events-auto ${
          isStats ? "bg-white" : "bg-white/75"
        }`}
      >
        {/* close button */}
        {!isStats && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/10"
          >
            ✕
          </button>
        )}

        {/* logo */}
        <div className="flex flex-col items-center gap-2 mb-6 mt-2">
          <Image src="/logo.png" width={60} height={60} alt="Pastora" className="rounded-full"/>
          <h2 className="text-2xl font-bold">Pastora</h2>
        </div>

        {/* vertical nav */}
        <nav className="flex flex-col space-y-4 text-xl">
          <button
            onClick={() => go("/tracking")}
            className={pathname === "/tracking" ? "font-bold" : ""}
          >
            Mapa
          </button>
          <button
            onClick={() => go("/tracking/stats")}
            className={pathname.startsWith("/tracking/stats") ? "font-bold" : ""}
          >
            Estadísticas
          </button>
        </nav>
        <div className="mt-6">
        <LotSelector onSelect={onClose} />
        </div>
      </div>
    </div>
  );
}
