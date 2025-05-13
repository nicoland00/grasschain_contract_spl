// src/components/mobile/MobileBottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileBottomNav() {
  const path = usePathname() || "/";

  const tabs = [
    { href: "/", icon: "/bag.png", alt: "Contracts" },
    { href: "/tracking", icon: "/track.png", alt: "Tracking" },
    { href: "/account", icon: "/account.png", alt: "Account" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden z-50">
      <ul className="flex justify-around py-2">
        {tabs.map(({ href, icon, alt }) => {
          const isActive = path === href;
          return (
            <li key={href} className="flex-1">
              <Link href={href} className="flex flex-col items-center">
                <img
                  src={icon}
                  alt={alt}
                  className={`h-8 w-8 mb-1 ${isActive ? "opacity-100" : "opacity-50"}`}
                />
                <span
                  className={`text-sm font-semibold ${
                    isActive ? "text-green-600" : "text-gray-500"
                  }`}
                >
                  {alt}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
