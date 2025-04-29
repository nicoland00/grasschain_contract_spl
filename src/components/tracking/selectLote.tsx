"use client";

import React from "react";
import { useLote } from "@/context/tracking/contextLote";

export default function SelectLote() {
  const { selectedLote, setSelectedLote } = useLote();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLote(e.target.value);
  };

  return (
    <div id="selectLoteContainer">
      <label htmlFor="loteSelect" className="mr-2 font-semibold">Lote:</label>
      <select
        id="loteSelect"
        value={selectedLote}
        onChange={handleChange}
        className="px-2 py-1 rounded-[10px] text-black"
      >
        {/* Only one option: the ranch name provided */}
        <option value="Lote San Sebastian">Lote San Sebastian</option>
      </select>
    </div>
  );
}
