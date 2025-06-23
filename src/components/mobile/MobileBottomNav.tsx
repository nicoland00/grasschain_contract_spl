// src/components/mobile/MobileNavbar.tsx
"use client";
import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Calculator, FileText, Activity, User } from "lucide-react";

const MobileNavbar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const navItems = [    
    { id: "calculator", label: "Calculator", icon: Calculator, href: "/calculator" },
    { id: "contracts", label: "Contracts",  icon: FileText,    href: "/" },
    { id: "tracking",  label: "Tracking",   icon: Activity,   href: "/tracking" },
    { id: "account",   label: "Account",    icon: User,       href: "/account" },
  ];

  return (
    // 👇  oculto en ≥768 px 
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border z-[1000] md:hidden">
      <div className="flex justify-around items-center py-2">
        {navItems.map(({ id, label, icon: Icon, href }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <button
              key={id}
              onClick={() => router.push(href)}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                isActive ? "text-green-500" : "text-gray-400 hover:text-white"
              }`}
            >
              <Icon size={20} />
              <span className="text-xs mt-1">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileNavbar;