"use client";

import React, { useState, useEffect } from "react";
import { PublicKey } from "@solana/web3.js";
import { useGrasschainContractSplProgram } from "./grasschain_contract_spl-data-access";

interface InvestorRecord {
  // Estas propiedades vienen desde la query on‑chain (convertidas a string con toBase58())
  contract: string;
  investor: string;
  nftMint: string; // Si no está actualizado, puede ser "N/A"
  txSignature?: string; // Debes haber guardado la signature de la transacción claim_nft
}

interface AdminExportCSVProps {
  contractPk: PublicKey;
}

export function AdminExportCSV({ contractPk }: AdminExportCSVProps) {
  const { useInvestorRecords } = useGrasschainContractSplProgram();
  const { data: records, isLoading, isError, refetch } = useInvestorRecords(contractPk);
  const [updatedRecords, setUpdatedRecords] = useState<InvestorRecord[] | null>(null);
  const [loading, setLoading] = useState(false);

  // Función para obtener el mint a partir de la signature usando Solscan
  async function fetchMintFromSignature(signature: string): Promise<string> {
    const url = `https://public-api.solscan.io/transaction/${signature}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Error: ${res.statusText}`);
      const data = await res.json();
      if (data && data.message && data.message.instructions) {
        // Recorremos las instrucciones para encontrar la de tipo "mintTo"
        for (const ix of data.message.instructions) {
          if (
            ix.program === "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" &&
            ix.parsed &&
            ix.parsed.type === "mintTo"
          ) {
            return ix.parsed.info.mint;
          }
        }
      }
      return "N/A";
    } catch (error) {
      console.error("Error fetching mint from signature:", error);
      return "N/A";
    }
  }

  // Al actualizar los registros, actualizamos el campo nftMint si es "N/A" y hay txSignature
  useEffect(() => {
    async function updateRecords() {
      if (!records) return;
      setLoading(true);
      const updated = await Promise.all(
        records.map(async (recordObj: any) => {
          const acc = recordObj.account;
          // Usamos el campo en camelCase
          let nftMint = acc.nftMint ? acc.nftMint.toBase58() : "N/A";
          // Si no está actualizado y existe txSignature, intentamos obtenerlo de Solscan
          if ((nftMint === "N/A" || nftMint === "11111111111111111111111111111111") && recordObj.txSignature) {
            const fetchedMint = await fetchMintFromSignature(recordObj.txSignature);
            nftMint = fetchedMint;
          }
          return {
            contract: acc.contract ? acc.contract.toBase58() : "N/A",
            investor: acc.investor ? acc.investor.toBase58() : "N/A",
            nftMint,
          };
        })
      );
      setUpdatedRecords(updated);
      setLoading(false);
    }
    updateRecords();
  }, [records]);

  const generateCSV = (): string => {
    if (!updatedRecords) return "";
    const header = "contract_id,investor,nft_mint\n";
    const rows = updatedRecords
      .map((r) => `${r.contract},${r.investor},${r.nftMint}`)
      .join("\n");
    return header + rows;
  };

  const handleDownload = async () => {
    await refetch(); // Forzamos la actualización on‑chain
    // Luego esperamos a que se actualicen nuestros registros off‑chain
    // (la query useEffect se activará si los registros cambian)
    const csv = generateCSV();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "investor_records.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading || loading) return <p>Cargando registros...</p>;
  if (isError) return <p>Error al cargar registros.</p>;

  return (
    <div>
      <button className="btn btn-secondary" onClick={handleDownload}>
        Descargar CSV
      </button>
    </div>
  );
}
