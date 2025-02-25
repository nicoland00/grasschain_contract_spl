"use client";

import React, { useState, useEffect } from "react";
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
// Must match ADMIN_ADDRESS in lib.rs
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
// 1) Admin Create Contract Form – now with an extra "Image URL" field.
//    (This image is stored off–chain in localStorage.)
//
// Note: The on–chain createContract does NOT accept an image URL.
export function GrasschainCreateContractForm() {
  const { publicKey } = useWallet();
  const { createContract } = useGrasschainContractSplProgram();

  const [investment, setInvestment] = useState("");
  const [yieldPerc, setYieldPerc] = useState("");
  const [periodDays, setPeriodDays] = useState("");
  const [farmName, setFarmName] = useState("");
  const [farmAddress, setFarmAddress] = useState("");
  const [farmImageUrl, setFarmImageUrl] = useState(""); // New: off–chain image URL

  // Only show if the connected wallet is admin.
  if (publicKey?.toBase58() !== ADMIN_PUBKEY) return null;

  async function handleCreateContract() {
    if (!publicKey) {
      alert("Connect your admin wallet.");
      return;
    }
    const i = parseFloat(investment) * 1_000_000;
    const y = parseInt(yieldPerc, 10);
    const d = parseInt(periodDays, 10) * 86400;
    if (isNaN(i) || isNaN(y) || isNaN(d)) {
      alert("Invalid input!");
      return;
    }
    const nowSec = Math.floor(Date.now() / 1000);

    await createContract.mutateAsync({
      nftMint: new PublicKey("11111111111111111111111111111111"), // NFT dummy
      totalInvestmentNeeded: i,
      yieldPercentage: y,
      durationInSeconds: d,
      contractId: nowSec,
      farmName,
      farmAddress,
    });

    // Save the image URL off–chain (in localStorage) keyed by contract id.
    const stored = localStorage.getItem("contractImages");
    const contractImages = stored ? JSON.parse(stored) : {};
    contractImages[nowSec] = farmImageUrl;
    localStorage.setItem("contractImages", JSON.stringify(contractImages));

    // Clear fields
    setInvestment("");
    setYieldPerc("");
    setPeriodDays("");
    setFarmName("");
    setFarmAddress("");
    setFarmImageUrl("");
  }

  return (
    <div className="max-w-md mx-auto bg-white shadow p-6 rounded mb-8">
      <h3 className="text-xl font-semibold mb-4">Create Contract (Admin Only)</h3>

      <label className="block mb-1">Investment Amount (USDC)</label>
      <input
        className="input input-bordered w-full bg-white mb-3"
        type="number"
        value={investment}
        onChange={(e) => setInvestment(e.target.value)}
      />

      <label className="block mb-1">Yield Percentage (%)</label>
      <input
        className="input input-bordered w-full bg-white mb-3"
        type="number"
        value={yieldPerc}
        onChange={(e) => setYieldPerc(e.target.value)}
      />

      <label className="block mb-1">Funding Period (days)</label>
      <input
        className="input input-bordered w-full bg-white mb-3"
        type="number"
        value={periodDays}
        onChange={(e) => setPeriodDays(e.target.value)}
      />

      <label className="block mb-1">Farm Name</label>
      <input
        className="input input-bordered w-full bg-white mb-3"
        type="text"
        value={farmName}
        onChange={(e) => setFarmName(e.target.value)}
      />

      <label className="block mb-1">Farm Address</label>
      <input
        className="input input-bordered w-full bg-white mb-3"
        type="text"
        value={farmAddress}
        onChange={(e) => setFarmAddress(e.target.value)}
      />

      <label className="block mb-1">Farm Image URL</label>
      <input
        className="input input-bordered w-full bg-white mb-3"
        type="text"
        placeholder="https://..."
        value={farmImageUrl}
        onChange={(e) => setFarmImageUrl(e.target.value)}
      />

      <button className="btn btn-primary w-full" onClick={handleCreateContract}>
        Create Contract
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2) Contracts List – Only show contracts that are not finished.
// ---------------------------------------------------------------------------
function isFinished(statusObj: any) {
  return (
    "settled" in statusObj ||
    "cancelled" in statusObj ||
    "defaulted" in statusObj
  );
}

export function GrasschainContractsList() {
  const { allContracts } = useGrasschainContractSplProgram();
  if (allContracts.isLoading) return <p>Loading...</p>;
  if (allContracts.isError) return <p>Error loading contracts.</p>;

  const contracts = allContracts.data || [];
  if (!contracts.length) return <p>No contracts found.</p>;

  // Filter out finished contracts
  const visible = contracts.filter(({ account }: any) => !isFinished(account.status));
  if (!visible.length)
    return <p>No active or funding contracts available.</p>;

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

// ---------------------------------------------------------------------------
// 3) Single Contract Card – uses off–chain image from localStorage
// ---------------------------------------------------------------------------
function getStatusStyles(status: string) {
  if (status === "Created" || status === "Funding") {
    // Green with white text
    return "bg-green-500 text-white";
  } else if (status === "FundedPendingVerification" || status === "Active") {
    // Yellow with dark text
    return "bg-yellow-400 text-black";
  } else if (status === "PendingBuyback" || status === "Settled") {
    // Dark green with white text
    return "bg-green-800 text-white";
  } else if (status === "Defaulted" || status === "Cancelled") {
    // Red with white text
    return "bg-red-500 text-white";
  }
  // Fallback color (gray)
  return "bg-gray-400 text-white";
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
  } = useGrasschainContractSplProgram();

  const [investInput, setInvestInput] = useState("");

  // Determine status by checking the decoded enum object
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

  const totalNeeded = contractData.totalInvestmentNeeded.toNumber() / 1_000_000;
  const fundedSoFar = contractData.amountFundedSoFar;
  const remaining = (contractData.totalInvestmentNeeded.toNumber() - fundedSoFar) / 1_000_000;

  const farmName = contractData.farmName || "N/A";
  const farmAddress = contractData.farmAddress || "N/A";

  // Retrieve off–chain image URL from localStorage
  let farmImageUrl = "/placeholder.jpg"; // default image
  const stored = localStorage.getItem("contractImages");
  if (stored) {
    try {
      const images = JSON.parse(stored);
      // Use contractData.contract_id (as number) converted to string as key
      const key = contractData.contract_id.toString();
      if (images[key]) {
        farmImageUrl = images[key];
      }
    } catch (e) {
      console.error("Error parsing contractImages", e);
    }
  }

  // Timestamps and dynamic deadline label
  let endDate: Date | null = null;
  let deadlineLabel = "";
  if ("created" in contractData.status || "funding" in contractData.status) {
    endDate = new Date(contractData.fundingDeadline.toNumber() * 1000);
    deadlineLabel = "Funding Deadline";
  } else if ("fundedPendingVerification" in contractData.status) {
    endDate = new Date((contractData.fundedTime.toNumber() + 30 * 86400) * 1000);
    deadlineLabel = "Verification Deadline";
  } else if ("active" in contractData.status) {
    endDate = new Date((contractData.startTime.toNumber() + contractData.duration.toNumber()) * 1000);
    deadlineLabel = "Maturity Date";
  } else if ("pendingBuyback" in contractData.status || "prolonged" in contractData.status) {
    endDate = new Date(contractData.buybackDeadline.toNumber() * 1000);
    deadlineLabel = "Buyback Deadline";
  }

  async function handleInvest() {
    if (!publicKey || !signTransaction) {
      alert("Connect your wallet first.");
      return;
    }
    const partialAmount = parseFloat(investInput) * 1_000_000;
    if (isNaN(partialAmount) || partialAmount <= 0) {
      alert("Invalid amount");
      return;
    }
    if (partialAmount > remaining * 1_000_000) {
      alert(`Cannot invest more than remaining: ${remaining} USDC`);
      return;
    }

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
      alert("Connect as admin.");
      return;
    }
    const adminAta = await getOrCreateATA(connection, publicKey, signTransaction, USDC_DEVNET_MINT);
    await adminWithdraw.mutateAsync({ contractPk, adminTokenAccount: adminAta });
  }

  async function handleAdminCancel() {
    if (!publicKey || !signTransaction) {
      alert("Connect as admin.");
      return;
    }
    // For demonstration, use admin's ATA for refund.
    const adminAta = await getOrCreateATA(connection, publicKey, signTransaction, USDC_DEVNET_MINT);
    await adminCancel.mutateAsync({ contractPk, investorTokenAccount: adminAta });
  }

  async function handleCheckMaturity() {
    await checkMaturity.mutateAsync({ contractPk });
  }

  async function handleSettle() {
    if (!publicKey || !signTransaction) {
      alert("Connect as admin.");
      return;
    }
    const adminAta = await getOrCreateATA(connection, publicKey, signTransaction, USDC_DEVNET_MINT);
    const requiredBuyback = contractData.calculateBuyback
      ? contractData.calculateBuyback.toNumber() / 1_000_000
      : 0;
    const amount = Math.floor(requiredBuyback * 1_000_000);
    // For demonstration, use admin's ATA as investor ATA.
    await settleContract.mutateAsync({
      contractPk,
      amount,
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
      <img src={farmImageUrl} alt="Farm" className="w-full h-40 object-cover" />

      <div className="p-4 relative">
        <span
          className={
            "absolute top-4 right-4 px-2 py-1 text-xs rounded uppercase font-semibold " +
            getStatusStyles(status)
          }
        >
          {status}
        </span>
        <h3 className="text-lg font-bold mb-1">{farmName}</h3>
        <p className="text-sm text-gray-500 mb-3">
          {deadlineLabel}: {endDate ? endDate.toLocaleString() : "N/A"}
        </p>
        <div className="text-2xl font-bold mb-2">{contractData.yieldPercentage.toString()}%</div>
        <p className="text-sm mb-1 font-semibold">Total Asked: {totalNeeded} USDC</p>
        <p className="text-sm mb-1">Funded: {(fundedSoFar / 1_000_000).toFixed(2)} USDC</p>
        <p className="text-sm mb-3">Remaining: {remaining} USDC</p>

        {(status === "Created" || status === "Funding") && (
          <div className="mt-4 space-y-2 text-white-800">
            <label className="block text-sm mb-1">Amount to Buy (USDC)</label>
            <input
              type="number"
              className="input input-bordered w-full bg-white"
              value={investInput}
              onChange={(e) => setInvestInput(e.target.value)}
            />
            <button className="btn btn-success w-full" onClick={handleInvest}>
              Buy
            </button>
          </div>
        )}

        {status === "FundedPendingVerification" && publicKey?.toBase58() === ADMIN_PUBKEY && (
          <div className="mt-4 flex flex-col space-y-2 ">
            <button className="btn btn-success" onClick={handleAdminWithdraw}>
              Withdraw Funds
            </button>
            <button className="btn btn-error" onClick={handleAdminCancel}>
              Cancel Contract
            </button>
          </div>
        )}

        {status === "Active" && publicKey?.toBase58() === ADMIN_PUBKEY && (
          <div className="mt-4">
            <button className="btn btn-warning w-full mt-2" onClick={handleCheckMaturity}>
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
    </div>
  );
}
