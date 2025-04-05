"use client";
import React, { useState } from "react";
import GrasschainContractSplFeature from '@/components/grasschain_contract_spl/grasschain_contract_spl-feature';
import Walkthrough from "@/components/grasschain_contract_spl/walkthrough/Walkthrough";

export default function Page() {
  const [showWalkthrough, setShowWalkthrough] = useState(true);

  return (
    <div className="relative">
      {/* Componente principal de Smart Contracts */}
      <GrasschainContractSplFeature />
      
      {/* Overlay del walkthrough */}
      {showWalkthrough && (
        <Walkthrough onFinish={() => setShowWalkthrough(false)} />
      )}
    </div>
  );
}
