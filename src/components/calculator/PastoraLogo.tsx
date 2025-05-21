// src/components/ui/PastoraLogo.tsx
import React from "react";

interface PastoraLogoProps {
  size?: number;
}

const PastoraLogo: React.FC<PastoraLogoProps> = ({ size = 64 }) => {
  return (
    <img
      src="/logo.png"
      alt="Pastora Logo"
      width={size}
      height={size}
      className="rounded-full object-cover"
    />
  );
};

export default PastoraLogo;
