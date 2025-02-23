"use client";

import React, { useState } from "react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";

import {
  useGrasschainContractSplProgram,
  USDC_DEVNET_MINT,
} from "./grasschain_contract_spl-data-access";

// ---------------------------------------------------------------------------
// Debe coincidir con ADMIN_ADDRESS en lib.rs
// ---------------------------------------------------------------------------
const ADMIN_PUBKEY = "74bwEVrLxoWtg8ya7gB1KKKuff9wnNADys1Ss1cxsEdd";

// ---------------------------------------------------------------------------
// Helper: getOrCreateATA
// ---------------------------------------------------------------------------
async function getOrCreateATA(
  connection: any,
  owner: PublicKey,
  signTransaction: (tx: Transaction) => Promise<Transaction>,
  mint: PublicKey
): Promise<PublicKey> {
  const ata = await getAssociatedTokenAddress(
    mint,
    owner,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  const info = await connection.getAccountInfo(ata);
  if (info) return ata;

  const tx = new Transaction().add(
    createAssociatedTokenAccountInstruction(
      owner,
      ata,
      owner,
      mint,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    )
  );
  tx.feePayer = owner;
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  const signedTx = await signTransaction(tx);
  const sig = await connection.sendRawTransaction(signedTx.serialize());
  await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight });
  return ata;
}

// ---------------------------------------------------------------------------
// Formulario para crear contrato (solo Admin)
// ---------------------------------------------------------------------------
export function GrasschainCreateContractForm() {
  const { publicKey } = useWallet();
  const { createContract } = useGrasschainContractSplProgram();

  // Move useState hooks to the top level
  const [investment, setInvestment] = useState("");
  const [yieldPerc, setYieldPerc] = useState("");
  const [periodDays, setPeriodDays] = useState("");
  const [farmName, setFarmName] = useState("");
  const [farmAddress, setFarmAddress] = useState("");

  // Use conditional rendering instead of conditional hook calls
  if (publicKey?.toBase58() !== ADMIN_PUBKEY) return null;

  async function handleCreateContract() {
    if (!publicKey) {
      alert("Conecta tu wallet (admin).");
      return;
    }
    const i = parseFloat(investment) * 1_000_000;
    const y = parseInt(yieldPerc, 10);
    const periodSec = parseInt(periodDays, 10) * 86400;
    if (isNaN(i) || isNaN(y) || isNaN(periodSec)) {
      alert("Datos inválidos");
      return;
    }
    const nowSec = Math.floor(Date.now() / 1000);
    await createContract.mutateAsync({
      nftMint: new PublicKey("11111111111111111111111111111111"), // NFT dummy
      totalInvestmentNeeded: i,
      yieldPercentage: y,
      durationInSeconds: periodSec,
      contractId: nowSec,
      farmName,
      farmAddress,
    });
    setInvestment("");
    setYieldPerc("");
    setPeriodDays("");
    setFarmName("");
    setFarmAddress("");
  }

  return (
    <div className="space-y-3 max-w-md border p-4 rounded">
      <h3 className="text-xl font-semibold">Create Contract (Admin Only)</h3>
      <label>Investment Amount (USDC)</label>
      <input
        className="input input-bordered w-full"
        type="number"
        value={investment}
        onChange={(e) => setInvestment(e.target.value)}
      />
      <label>Yield Percentage (%)</label>
      <input
        className="input input-bordered w-full"
        type="number"
        value={yieldPerc}
        onChange={(e) => setYieldPerc(e.target.value)}
      />
      <label>Funding Period (days)</label>
      <input
        className="input input-bordered w-full"
        type="number"
        value={periodDays}
        onChange={(e) => setPeriodDays(e.target.value)}
      />
      <label>Farm Name</label>
      <input
        className="input input-bordered w-full"
        type="text"
        value={farmName}
        onChange={(e) => setFarmName(e.target.value)}
      />
      <label>Farm Address</label>
      <input
        className="input input-bordered w-full"
        type="text"
        value={farmAddress}
        onChange={(e) => setFarmAddress(e.target.value)}
      />
      <button className="btn btn-primary w-full" onClick={handleCreateContract}>
        Create Contract
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lista de Contratos – para todos los usuarios
// ---------------------------------------------------------------------------
export function GrasschainContractsList() {
  const { allContracts } = useGrasschainContractSplProgram();
  if (allContracts.isLoading) return <p>Loading...</p>;
  if (allContracts.isError) return <p>Error loading contracts.</p>;

  const contracts = allContracts.data || [];
  if (!contracts.length) return <p>No contracts found.</p>;

  return (
    <div className="space-y-4 mt-4">
      {contracts.map(({ publicKey, account }: any) => (
        <GrasschainContractCard
          key={publicKey.toBase58()}
          contractPk={publicKey}
          contractData={account}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card de Contrato individual – Muestra detalles y botones de acción
// ---------------------------------------------------------------------------
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
  } = useGrasschainContractSplProgram();

  // Estado local para la inversión parcial
  const [investInput, setInvestInput] = useState("");

  // Determinar status (minúsculas del enum en el IDL)
  let status = "Unknown";
  if ("created" in contractData.status) status = "Created";
  else if ("funding" in contractData.status) status = "Funding";
  else if ("fundedPendingVerification" in contractData.status) status = "FundedPendingVerification";
  else if ("active" in contractData.status) status = "Active";
  else if ("pendingBuyback" in contractData.status) status = "PendingBuyback";
  else if ("prolonged" in contractData.status) status = "Prolonged";
  else if ("settled" in contractData.status) status = "Settled";
  else if ("defaulted" in contractData.status) status = "Defaulted";
  else if ("cancelled" in contractData.status) status = "Cancelled";

  // Calcular totales
  const totalNeeded = contractData.totalInvestmentNeeded.toNumber() / 1_000_000;
  const amountFunded = contractData.amountFundedSoFar;
  const remaining = (contractData.totalInvestmentNeeded.toNumber() - amountFunded) / 1_000_000;

  // Info del farm
  const farmName = contractData.farmName || "N/A";
  const farmAddress = contractData.farmAddress || "N/A";

  // Upload date
  let uploadDate: Date | null = null;
  if (contractData.uploadDate) {
    uploadDate = new Date(contractData.uploadDate.toNumber() * 1000);
  }

  // Determinar endDate dinámico
  let endDate: Date | null = null;
  let deadlineLabel = "";
  if (status === "Created" || status === "Funding") {
    endDate = new Date(contractData.fundingDeadline.toNumber() * 1000);
    deadlineLabel = "Funding Deadline";
  } else if (status === "FundedPendingVerification") {
    endDate = new Date((contractData.fundedTime.toNumber() + 30 * 86400) * 1000);
    deadlineLabel = "Verification Deadline";
  } else if (status === "Active") {
    endDate = new Date((contractData.startTime.toNumber() + contractData.duration.toNumber()) * 1000);
    deadlineLabel = "Maturity Date";
  } else if (status === "PendingBuyback" || status === "Prolonged") {
    endDate = new Date(contractData.buybackDeadline.toNumber() * 1000);
    deadlineLabel = "Buyback Deadline";
  }

  // -------------------------------------------------------------------------
  // Action Handlers
  // -------------------------------------------------------------------------
  async function handleInvest() {
    if (!publicKey || !signTransaction) {
      alert("Connect your wallet first.");
      return;
    }
    const partialAmount = parseFloat(investInput) * 1_000_000;
    if (isNaN(partialAmount) || partialAmount <= 0) {
      alert("Cantidad inválida");
      return;
    }
    // Validar que no exceda lo que falta
    if (partialAmount > (remaining * 1_000_000)) {
      alert(`No puedes invertir más de lo que falta (${remaining} USDC).`);
      return;
    }

    // getOrCreateATA
    const userAta = await getOrCreateATA(connection, publicKey, signTransaction, USDC_DEVNET_MINT);

    await investContract.mutateAsync({
      contractPk,
      amount: partialAmount,
      investorTokenAccount: userAta,
    });

    setInvestInput("");
  }

  async function handleAdminWithdraw() {
    if (!publicKey || !signTransaction) {
      alert("Connect your wallet as admin.");
      return;
    }
    const adminAta = await getOrCreateATA(connection, publicKey, signTransaction, USDC_DEVNET_MINT);
    await adminWithdraw.mutateAsync({ contractPk, adminTokenAccount: adminAta });
  }

  async function handleAdminCancel() {
    if (!publicKey || !signTransaction) {
      alert("Connect your wallet as admin.");
      return;
    }
    if (!contractData.investor) {
      alert("No investor found!");
      return;
    }
    const investorPubkey = new PublicKey(contractData.investor);
    const investorAta = await getOrCreateATA(connection, investorPubkey, signTransaction, USDC_DEVNET_MINT);
    await adminCancel.mutateAsync({ contractPk, investorTokenAccount: investorAta });
  }

  async function handleCheckMaturity() {
    await checkMaturity.mutateAsync({ contractPk });
  }

  async function handleSettle() {
    if (!publicKey || !signTransaction) {
      alert("Connect your wallet as admin.");
      return;
    }
    const adminAta = await getOrCreateATA(connection, publicKey, signTransaction, USDC_DEVNET_MINT);
    const requiredBuyback = contractData.calculateBuyback
      ? contractData.calculateBuyback.toNumber() / 1_000_000
      : 0;
    const amount = Math.floor(requiredBuyback * 1_000_000);
    if (!contractData.investor) {
      alert("No investor found!");
      return;
    }
    const investorPubkey = new PublicKey(contractData.investor);
    const investorAta = await getOrCreateATA(connection, investorPubkey, signTransaction, USDC_DEVNET_MINT);
    await settleContract.mutateAsync({ contractPk, amount, adminTokenAccount: adminAta, investorTokenAccount: investorAta });
  }

  async function handleProlong() {
    if (!publicKey || !signTransaction) {
      alert("Connect your wallet as admin.");
      return;
    }
    await prolongContract.mutateAsync({ contractPk });
  }

  async function handleDefault() {
    await defaultContract.mutateAsync({ contractPk });
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="border p-4 bg-base-200 rounded">
      <h4 className="font-bold break-all">Contract: {contractPk.toBase58()}</h4>
      <p>
        <strong>Farm Name:</strong> {farmName}
      </p>
      <p>
        <strong>Upload Date:</strong> {uploadDate ? uploadDate.toLocaleString() : "N/A"}
      </p>
      <p>
        <strong>{deadlineLabel}:</strong> {endDate ? endDate.toLocaleString() : "N/A"}
      </p>
      <p>
        <strong>Farm Address:</strong> {farmAddress}
      </p>
      <p>
        <strong>Status:</strong> {status}
      </p>

      {/* Mostrar info de fondos */}
      <div className="mt-2">
        <p>Total Asked: {totalNeeded} USDC</p>
        <p>Funded So Far: {(amountFunded / 1_000_000).toFixed(2)} USDC</p>
        <p>Remaining: {remaining} USDC</p>
      </div>

      {(status === "Created" || status === "Funding") && (
        <div className="mt-4 space-y-2">
          <label>Cantidad a invertir (USDC)</label>
          <input
            type="number"
            className="input input-bordered w-full"
            value={investInput}
            onChange={(e) => setInvestInput(e.target.value)}
          />
          <button className="btn btn-secondary w-full" onClick={handleInvest}>
            Invertir
          </button>
        </div>
      )}

      {status === "FundedPendingVerification" && publicKey?.toBase58() === ADMIN_PUBKEY && (
        <div className="mt-4 flex flex-col space-y-2">
          <button className="btn btn-success" onClick={handleAdminWithdraw}>
            Withdraw Funds (to Admin)
          </button>
          <button className="btn btn-error" onClick={handleAdminCancel}>
            Cancel Contract (Refund Investor)
          </button>
        </div>
      )}

      {status === "Active" && publicKey?.toBase58() === ADMIN_PUBKEY && (
        <div className="mt-4">
          <button className="btn btn-warning w-full" onClick={handleCheckMaturity}>
            Check Maturity
          </button>
        </div>
      )}

      {(status === "PendingBuyback" || status === "Prolonged") && publicKey?.toBase58() === ADMIN_PUBKEY && (
        <div className="mt-4 flex flex-col space-y-2">
          <button className="btn btn-accent" onClick={handleSettle}>
            Settle Contract
          </button>
          {status === "PendingBuyback" && (
            <button className="btn btn-info" onClick={handleProlong}>
              Request 2-Week Extension
            </button>
          )}
          {status === "Prolonged" && (
            <button className="btn btn-danger" onClick={handleDefault}>
              Mark as Defaulted
            </button>
          )}
        </div>
      )}
    </div>
  );
}
