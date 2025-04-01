"use client"; // si estás en app router
import React from "react";
// Ajusta la ruta según tu estructura
import { DebugTemporal } from "../../components/grasschain_contract_spl/DebugTemporal";

export default function DebugPage() {
  // Aquí pones la dirección de tu contrato en string base58
  const contractPk = "4wb1ayrnJ72LA7jgkKiVGzTRJqWN731Byu6BSKfKDUpv";

  return (
    <div style={{ padding: "20px" }}>
      <h1>Debug Temporal Page</h1>
      <DebugTemporal contractAddress={contractPk} />
    </div>
  );
}
