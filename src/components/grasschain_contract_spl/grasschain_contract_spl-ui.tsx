"use client";

import React, { useState } from "react";
import {
  PublicKey,
  Transaction,
  Keypair,
  Connection,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  useGrasschainContractSplProgram,
  USDC_DEVNET_MINT,
  TOKEN_METADATA_PROGRAM_ID,
} from "./grasschain_contract_spl-data-access";
import toast from "react-hot-toast";
import { AdminExportCSV } from "./AdminExportCSV";


// Helpers para derivar las PDAs de metadata y master edition
function getMetadataPDA(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );
}

function getMasterEditionPDA(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
      Buffer.from("edition"),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );
}

// Debe coincidir con el admin definido en lib.rs
const ADMIN_PUBKEY = "74bwEVrLxoWtg8ya7gB1KKKuff9wnNADys1Ss1cxsEdd";

export function GrasschainCreateContractForm() {
  const { publicKey } = useWallet();
  const { createContract } = useGrasschainContractSplProgram();

  const [investment, setInvestment] = useState("");
  const [yieldPerc, setYieldPerc] = useState("");
  const [periodDays, setPeriodDays] = useState("");
  const [farmName, setFarmName] = useState("");
  const [farmAddress, setFarmAddress] = useState("");
  const [farmImageUrl, setFarmImageUrl] = useState("");

  // Mostrar solo si el wallet es admin
  if (publicKey?.toBase58() !== ADMIN_PUBKEY) return null;

  async function handleCreateContract() {
    if (!publicKey) {
      alert("Conecta tu wallet de admin.");
      return;
    }
    const i = parseFloat(investment) * 1_000_000;
    const y = parseInt(yieldPerc, 10);
    const d = parseInt(periodDays, 10) * 86400;
    if (isNaN(i) || isNaN(y) || isNaN(d)) {
      alert("Entrada inválida!");
      return;
    }
    const nowSec = Math.floor(Date.now() / 1000);

    await createContract.mutateAsync({
      nftMint: new PublicKey("11111111111111111111111111111111"), // dummy para NFT
      totalInvestmentNeeded: i,
      yieldPercentage: y,
      durationInSeconds: d,
      contractId: nowSec,
      farmName,
      farmAddress,
      farmImageUrl,
    });

    // Limpiar inputs
    setInvestment("");
    setYieldPerc("");
    setPeriodDays("");
    setFarmName("");
    setFarmAddress("");
    setFarmImageUrl("");
  }

  return (
    <div className="max-w-md mx-auto bg-white shadow p-6 rounded mb-8">
      <h3 className="text-xl font-semibold mb-4">Crear Contrato (Solo Admin)</h3>
      <label className="block mb-1">Monto de Inversión (USDC)</label>
      <input
        type="number"
        className="input input-bordered w-full bg-white mb-3"
        value={investment}
        onChange={(e) => setInvestment(e.target.value)}
      />
      <label className="block mb-1">Porcentaje de Yield (%)</label>
      <input
        type="number"
        className="input input-bordered w-full bg-white mb-3"
        value={yieldPerc}
        onChange={(e) => setYieldPerc(e.target.value)}
      />
      <label className="block mb-1">Periodo de Financiamiento (días)</label>
      <input
        type="number"
        className="input input-bordered w-full bg-white mb-3"
        value={periodDays}
        onChange={(e) => setPeriodDays(e.target.value)}
      />
      <label className="block mb-1">Nombre de la Finca</label>
      <input
        type="text"
        className="input input-bordered w-full bg-white mb-3"
        value={farmName}
        onChange={(e) => setFarmName(e.target.value)}
      />
      <label className="block mb-1">Dirección de la Finca</label>
      <input
        type="text"
        className="input input-bordered w-full bg-white mb-3"
        value={farmAddress}
        onChange={(e) => setFarmAddress(e.target.value)}
      />
      <label>URL de Imagen de la Finca</label>
      <input
        type="text"
        className="input input-bordered w-full"
        placeholder="https://..."
        value={farmImageUrl}
        onChange={(e) => setFarmImageUrl(e.target.value)}
      />
      <button className="btn btn-primary w-full mt-4" onClick={handleCreateContract}>
        Crear Contrato
      </button>
    </div>
  );
}

export function GrasschainContractCard({
  contractPk,
  contractData,
}: {
  contractPk: PublicKey;
  contractData: any;
}) {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const {
    investContract,
    adminWithdraw,
    adminCancel,
    checkMaturity,
    settleContract,
    prolongContract,
    defaultContract,
    claimNft,
  } = useGrasschainContractSplProgram();

  const [investInput, setInvestInput] = useState("");

  // Decodificar el status del enum de Anchor
  let status = "Unknown";
  if ("created" in contractData.status) status = "Created";
  else if ("funding" in contractData.status) status = "Funding";
  else if ("fundedPendingVerification" in contractData.status)
    status = "FundedPendingVerification";
  else if ("active" in contractData.status) status = "Active";
  else if ("pendingBuyback" in contractData.status) status = "PendingBuyback";
  else if ("prolonged" in contractData.status) status = "Prolonged";
  else if ("settled" in contractData.status) status = "Settled";
  else if ("defaulted" in contractData.status) status = "Defaulted";
  else if ("cancelled" in contractData.status) status = "Cancelled";

  const totalNeeded = contractData.totalInvestmentNeeded.toNumber() / 1_000_000;
  const fundedSoFar = contractData.amountFundedSoFar;
  const remaining =
    (contractData.totalInvestmentNeeded.toNumber() - fundedSoFar) / 1_000_000;

  const farmName = contractData.farmName || "N/A";
  const farmAddress = contractData.farmAddress || "N/A";
  const farmImageUrl = contractData.farmImageUrl;

  let endDate: Date | null = null;
  let deadlineLabel = "";
  if ("created" in contractData.status || "funding" in contractData.status) {
    endDate = new Date(contractData.fundingDeadline.toNumber() * 1000);
    deadlineLabel = "Fecha Límite de Financiamiento";
  } else if ("fundedPendingVerification" in contractData.status) {
    endDate = new Date((contractData.fundedTime.toNumber() + 30 * 86400) * 1000);
    deadlineLabel = "Fecha Límite de Verificación";
  } else if ("active" in contractData.status) {
    endDate = new Date(
      (contractData.startTime.toNumber() + contractData.duration.toNumber()) *
        1000
    );
    deadlineLabel = "Fecha de Madurez";
  } else if ("pendingBuyback" in contractData.status || "prolonged" in contractData.status) {
    endDate = new Date(contractData.buybackDeadline.toNumber() * 1000);
    deadlineLabel = "Fecha Límite de Recompra";
  }

  async function handleInvest() {
    if (!publicKey || !signTransaction) {
      alert("Conecta tu wallet primero.");
      return;
    }
    const partialAmount = parseFloat(investInput) * 1_000_000;
    if (isNaN(partialAmount) || partialAmount <= 0) {
      alert("Monto inválido");
      return;
    }
    if (partialAmount > remaining * 1_000_000) {
      alert(`No puedes invertir más del restante: ${remaining} USDC`);
      return;
    }

    // Para invertir en contratos con USDC, se utiliza getAssociatedTokenAddress ya que la cuenta ATA del USDC ya existe.
    const userAta = await getAssociatedTokenAddress(USDC_DEVNET_MINT, publicKey, false, TOKEN_PROGRAM_ID);
    await investContract.mutateAsync({
      contractPk,
      amount: partialAmount,
      investorTokenAccount: userAta,
    });
    setInvestInput("");
  }

  // Handler para mintear el NFT
  async function handleClaimNft() {
    if (!publicKey || !signTransaction) {
      alert("Conecta tu wallet primero.");
      return;
    }
    // Genera un nuevo Keypair para el mint del NFT
    const mintKeypair = Keypair.generate();
    // Calcula la dirección ATA para el NFT (sin crearla, pues será creada por Anchor en la instrucción)
    const nftAta = await getAssociatedTokenAddress(mintKeypair.publicKey, publicKey, false, TOKEN_PROGRAM_ID);

    // Deriva las PDAs para la metadata y la master edition
    const [metadataPDA] = getMetadataPDA(mintKeypair.publicKey);
    const [masterEditionPDA] = getMasterEditionPDA(mintKeypair.publicKey);

    await claimNft.mutateAsync({
      contractPk,
      mint: mintKeypair, // Se pasa el Keypair completo para que la cuenta se cree (init) dentro de la instrucción
      associatedTokenAccount: nftAta,
      metadataAccount: metadataPDA,
      masterEditionAccount: masterEditionPDA,
      name: "My NFT",
      symbol: "NFT",
      uri: "https://my-blob-store.public.blob.vercel-storage.com/nft.json",
    });
  }

  async function handleAdminWithdraw() {
    if (!publicKey || !signTransaction) {
      alert("Conecta como admin.");
      return;
    }
    const adminAta = await getAssociatedTokenAddress(USDC_DEVNET_MINT, publicKey, false, TOKEN_PROGRAM_ID);
    await adminWithdraw.mutateAsync({
      contractPk,
      adminTokenAccount: adminAta,
    });
  }

  async function handleAdminCancel() {
    if (!publicKey || !signTransaction) {
      alert("Conecta como admin.");
      return;
    }
    const adminAta = await getAssociatedTokenAddress(USDC_DEVNET_MINT, publicKey, false, TOKEN_PROGRAM_ID);
    await adminCancel.mutateAsync({
      contractPk,
      investorTokenAccount: adminAta,
    });
  }

  async function handleCheckMaturity() {
    await checkMaturity.mutateAsync({ contractPk });
  }

  async function handleSettle() {
    if (!publicKey || !signTransaction) {
      alert("Conecta como admin.");
      return;
    }
    const adminAta = await getAssociatedTokenAddress(USDC_DEVNET_MINT, publicKey, false, TOKEN_PROGRAM_ID);
    // Se usa un placeholder para el monto; en producción se calcularía el buyback requerido
    await settleContract.mutateAsync({
      contractPk,
      amount: 1000000,
      adminTokenAccount: adminAta,
      investorTokenAccount: adminAta,
    });
  }

  async function handleProlong() {
    await prolongContract.mutateAsync({ contractPk });
  }

  async function handleDefault() {
    await defaultContract.mutateAsync({ contractPk });
  }

  return (
    <div className="bg-white shadow-md rounded overflow-hidden">
      <img src={farmImageUrl} alt="Finca" className="w-full h-40 object-cover" />
      <div className="p-4 relative">
        <span
          className={
            "absolute top-4 right-4 px-2 py-1 text-xs rounded uppercase font-semibold " +
            (status === "Created" || status === "Funding"
              ? "bg-green-500 text-white"
              : status === "FundedPendingVerification" || status === "Active"
              ? "bg-yellow-400 text-black"
              : status === "PendingBuyback" || status === "Prolonged" || status === "Settled"
              ? "bg-green-800 text-white"
              : "bg-red-500 text-white")
          }
        >
          {status}
        </span>
        <h3 className="text-lg font-bold mb-1">{farmName}</h3>
        <p className="text-sm text-gray-500 mb-3">
          {deadlineLabel}: {endDate ? endDate.toLocaleString() : "N/A"}
        </p>
        <div className="text-2xl font-bold mb-2">
          {contractData.yieldPercentage.toString()}%
        </div>
        <p className="text-sm mb-1 font-semibold">
          Total Solicitado: {totalNeeded} USDC
        </p>
        <p className="text-sm mb-1">
          Invertido: {(fundedSoFar / 1_000_000).toFixed(2)} USDC
        </p>
        <p className="text-sm mb-3">
          Restante: {remaining} USDC
        </p>

        {(status === "Created" || status === "Funding") && (
          <div className="mt-4 space-y-2">
            <label className="block text-sm mb-1">Monto a Invertir (USDC)</label>
            <input
              type="number"
              className="input input-bordered w-full bg-white"
              value={investInput}
              onChange={(e) => setInvestInput(e.target.value)}
            />
            <button className="btn btn-success w-full" onClick={handleInvest}>
              Invertir
            </button>
          </div>
        )}

        {publicKey?.toBase58() === ADMIN_PUBKEY && (
          <div className="mt-4">
            <h4 className="font-semibold">Exportar registros de inversores:</h4>
            <AdminExportCSV contractPk={contractPk} />
          </div>
        )}
        
        {publicKey?.toBase58() !== ADMIN_PUBKEY && (
          <div className="mt-4">
            <button className="btn btn-primary w-full" onClick={handleClaimNft}>
              Mintear NFT
            </button>
          </div>
        )}

        {status === "FundedPendingVerification" &&
          publicKey?.toBase58() === ADMIN_PUBKEY && (
            <div className="mt-4 flex flex-col space-y-2">
              <button className="btn btn-success" onClick={handleAdminWithdraw}>
                Retirar Fondos
              </button>
              <button className="btn btn-error" onClick={handleAdminCancel}>
                Cancelar Contrato
              </button>
            </div>
          )}

        {status === "Active" && publicKey?.toBase58() === ADMIN_PUBKEY && (
          <div className="mt-4">
            <button className="btn btn-warning w-full mt-2" onClick={handleCheckMaturity}>
              Verificar Madurez
            </button>
          </div>
        )}

        {(status === "PendingBuyback" || status === "Prolonged") &&
          publicKey?.toBase58() === ADMIN_PUBKEY && (
            <div className="mt-4 flex flex-col space-y-2">
              <button className="btn btn-accent" onClick={handleSettle}>
                Liquidar Contrato
              </button>
              {status === "PendingBuyback" && (
                <button className="btn btn-info" onClick={handleProlong}>
                  Solicitar Extensión de 2 Semanas
                </button>
              )}
              {status === "Prolonged" && (
                <button className="btn btn-danger" onClick={handleDefault}>
                  Marcar como Incumplido
                </button>
              )}
            </div>
          )}
      </div>
    </div>
  );
}

export function GrasschainContractsList() {
  const { allContracts } = useGrasschainContractSplProgram();

  if (allContracts.isLoading) return <p>Cargando contratos...</p>;
  if (allContracts.isError) return <p>Error al cargar contratos.</p>;

  const contracts = allContracts.data || [];
  if (contracts.length === 0) return <p>No se encontraron contratos.</p>;

  // Filtrar contratos terminados (settled, cancelled o defaulted)
  const visible = contracts.filter(({ account }: any) => {
    return !("settled" in account.status || "cancelled" in account.status || "defaulted" in account.status);
  });

  if (visible.length === 0) {
    return <p>No hay contratos activos o en financiamiento.</p>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {visible.map(({ publicKey, account }: any) => (
        <GrasschainContractCard
          key={publicKey.toBase58()}
          contractPk={publicKey}
          contractData={account}
        />
      ))}
    </div>
  );
}
