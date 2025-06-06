// src/components/mobile/MobileNavbar.tsx
import React from "react";
import { Calculator, FileText, Activity, User } from "lucide-react";

interface MobileNavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const MobileNavbar: React.FC<MobileNavbarProps> = ({
  activeTab,
  onTabChange,
}) => {
  const navItems = [
    { id: "calculator", label: "Calculator", icon: Calculator },
    { id: "contracts", label: "Contracts", icon: FileText },
    { id: "tracking", label: "Tracking",  icon: Activity },
    { id: "account",   label: "Account",   icon: User },
  ];

  return (
    // 👇  oculto en ≥768 px 
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50 md:hidden">
      <div className="flex justify-around items-center py-2">
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
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
