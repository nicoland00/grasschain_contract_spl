"use client";

import React, { useState, useEffect } from "react";
import { PublicKey, Transaction, Keypair, SystemProgram } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { BN } from "@coral-xyz/anchor";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import {
  useGrasschainContractSplProgram,
  USDC_DEVNET_MINT,
  TOKEN_METADATA_PROGRAM_ID,
} from "./grasschain_contract_spl-data-access";
import toast from "react-hot-toast";
import { AdminExportCSV } from "./AdminExportCSV";


// Helpers to derive PDA for metadata and master edition
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

// Must match ADMIN_ADDRESS in lib.rs
const ADMIN_PUBKEY = "74bwEVrLxoWtg8ya7gB1KKKuff9wnNADys1Ss1cxsEdd";

export function GrasschainCreateContractForm() {
  const { publicKey } = useWallet();
  const { createContract } = useGrasschainContractSplProgram();

  const [investment, setInvestment] = useState("");
  const [yieldPerc, setYieldPerc] = useState("");
  const [termMinutes, setTermMinutes] = useState(""); 
  const [farmName, setFarmName] = useState("");
  const [farmAddress, setFarmAddress] = useState("");
  const [farmImageUrl, setFarmImageUrl] = useState("");

  if (publicKey?.toBase58() !== ADMIN_PUBKEY) return null;

  async function handleCreateContract() {
    if (!publicKey) {
      alert("Connect your admin wallet.");
      return;
    }
    const i = parseFloat(investment) * 1_000_000;
    const y = parseInt(yieldPerc, 10);
    const minutes = parseInt(termMinutes, 10);
    const d = minutes * 60; 
    if (isNaN(i) || isNaN(y) || isNaN(minutes)) {
      alert("Invalid input!");
      return;
    }
    const nowSec = Math.floor(Date.now() / 1000);

    await createContract.mutateAsync({
      nftMint: new PublicKey("11111111111111111111111111111111"), // dummy NFT mint
      totalInvestmentNeeded: i,
      yieldPercentage: y,
      durationInSeconds: d,
      contractId: nowSec,
      farmName,
      farmAddress,
      farmImageUrl,
    });

    setInvestment("");
    setYieldPerc("");
    setTermMinutes("");
    setFarmName("");
    setFarmAddress("");
    setFarmImageUrl("");
  }

  return (
    <div className="max-w-md mx-auto bg-white shadow p-6 rounded mb-8">
      <h3 className="text-2xl font-bold mb-4 text-center">Create Contract (Admin Only)</h3>
      <label className="block mb-1">Investment Amount (USDC)</label>
      <input
        type="number"
        className="input input-bordered w-full mb-3 bg-black text-white"
        value={investment}
        onChange={(e) => setInvestment(e.target.value)}
      />
      <label className="block mb-1">Yield Percentage (%)</label>
      <input
        type="number"
        className="input input-bordered w-full mb-3 bg-black text-white"
        value={yieldPerc}
        onChange={(e) => setYieldPerc(e.target.value)}
      />
      <label className="block mb-1">Contract Term (minutes)</label> {/* renombrado */}
      <input
        type="number"
        className="input input-bordered w-full mb-3 bg-black text-white"
        value={termMinutes}
        onChange={(e) => setTermMinutes(e.target.value)}
      />
      <label className="block mb-1">Farm Name</label>
      <input
        type="text"
        className="input input-bordered w-full mb-3 bg-black text-white"
        value={farmName}
        onChange={(e) => setFarmName(e.target.value)}
      />
      <label className="block mb-1">Farm Address</label>
      <input
        type="text"
        className="input input-bordered w-full mb-3 bg-black text-white"
        value={farmAddress}
        onChange={(e) => setFarmAddress(e.target.value)}
      />
      <label className="block mb-1">Farm Image URL</label>
      <input
        type="text"
        className="input input-bordered w-full mb-3 bg-black text-white"
        placeholder="https://..."
        value={farmImageUrl}
        onChange={(e) => setFarmImageUrl(e.target.value)}
      />
      <button className="btn btn-primary w-full mt-4" onClick={handleCreateContract}>
        Create Contract
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
  // ─── ALL HOOKS AT TOP LEVEL ───
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const {
    program,
    investContract,
    claimNft,
    adminWithdraw,
    adminCancel,
    checkMaturity,
    settleInvestor,
    prolongContract,
    defaultContract,
    closeContract,
    useInvestorRecords,
  } = useGrasschainContractSplProgram();

  // Hook to fetch investor records
  const { data: investorRecords, isLoading: investorsLoading } =
    useInvestorRecords(contractPk);

  useEffect(() => {
    if (!investorsLoading && investorRecords) {
      console.log(
        "InvestorRecords for contract",
        contractPk.toBase58(),
        investorRecords.map((r) => ({
          investor: r.account.investor.toBase58(),
          amount: r.account.amount.toNumber(),
          nftMint: r.account.nftMint?.toBase58?.() || "none",
        }))
      );
    }
  }, [investorsLoading, investorRecords, contractPk]);

  // ─── LOCAL STATE ───
  const [investInput, setInvestInput] = useState("");
  const [hasInvested, setHasInvested] = useState(false);

  // ─── DERIVED DISPLAY DATA ───
  let status = "Unknown";
  if ("created" in contractData.status) status = "Created";
  else if ("funding" in contractData.status) status = "Funding";
  else if ("fundedPendingVerification" in contractData.status)
    status = "Funded Pending Verification";
  else if ("active" in contractData.status) status = "Active";
  else if ("pendingBuyback" in contractData.status) status = "Pending Buyback";
  else if ("prolonged" in contractData.status) status = "Prolonged";
  else if ("settled" in contractData.status) status = "Settled";
  else if ("defaulted" in contractData.status) status = "Defaulted";
  else if ("cancelled" in contractData.status) status = "Cancelled";

  const totalNeeded =
    contractData.totalInvestmentNeeded.toNumber() / 1_000_000;
  const fundedSoFar = contractData.amountFundedSoFar;
  const remaining =
    (contractData.totalInvestmentNeeded.toNumber() - fundedSoFar) / 1_000_000;

  const farmNameText = contractData.farmName || "N/A";
  const farmAddressText = contractData.farmAddress || "N/A";
  const farmImageUrl =
    contractData.farmImageUrl || "https://via.placeholder.com/300";

  let endDate: Date | null = null;
  let deadlineLabel = "";
  if ("created" in contractData.status || "funding" in contractData.status) {
    endDate = new Date(contractData.fundingDeadline.toNumber() * 1000);
    deadlineLabel = "Funding Deadline";
  } else if ("fundedPendingVerification" in contractData.status) {
    endDate = new Date(
      (contractData.fundedTime.toNumber() + 30 * 86400) * 1000
    );
    deadlineLabel = "Verification Deadline";
  } else if ("active" in contractData.status) {
    endDate = new Date(
      (contractData.startTime.toNumber() +
        contractData.duration.toNumber()) *
        1000
    );
    deadlineLabel = "Maturity Date";
  } else if (
    "pendingBuyback" in contractData.status ||
    "prolonged" in contractData.status
  ) {
    endDate = new Date(contractData.buybackDeadline.toNumber() * 1000);
    deadlineLabel = "Buyback Deadline";
  }

  // ─── EVENT HANDLERS (NO HOOKS HERE!) ───
  async function handleInvest() {
    if (!publicKey || !signTransaction) {
      alert("Connect your wallet first.");
      return;
    }
    const amount = parseFloat(investInput) * 1_000_000;
    if (isNaN(amount) || amount <= 0) {
      alert("Invalid amount");
      return;
    }
    if (amount > remaining * 1_000_000) {
      alert(`Cannot invest more than remaining (${remaining} USDC)`);
      return;
    }

    // 1) Transfer USDC into escrow
    const userAta = await getAssociatedTokenAddress(
      USDC_DEVNET_MINT,
      publicKey,
      false,
      TOKEN_PROGRAM_ID
    );
    await investContract.mutateAsync({
      contractPk,
      amount,
      investorTokenAccount: userAta,
    });

    // 2) Wait for the on‑chain InvestorRecord to exist
    const [recordPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("investor-record"),
        contractPk.toBuffer(),
        publicKey.toBuffer(),
      ],
      program.programId
    );
    let found = false;
    for (let i = 0; i < 10; i++) {
      try {
        await program.account.investorRecord.fetch(recordPda);
        found = true;
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 500));
      }
    }
    if (!found) {
      toast.error("Investor record not ready. Try claiming NFT later.");
      return;
    }

    // 3) Mint and claim the NFT
    const mintKeypair = Keypair.generate();
    const nftAta = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      publicKey,
      false,
      TOKEN_PROGRAM_ID
    );
    const [metaPda] = getMetadataPDA(mintKeypair.publicKey);
    const [editionPda] = getMasterEditionPDA(mintKeypair.publicKey);
    await claimNft.mutateAsync({
      contractPk,
      mint: mintKeypair,
      associatedTokenAccount: nftAta,
      metadataAccount: metaPda,
      masterEditionAccount: editionPda,
      name: "Pastora NFT",
      symbol: "PTORA",
      uri: "https://app.pastora.io/tokenMetadata.json",
    });

    setHasInvested(true);
    setInvestInput("");
  }
  

  // Handlers for other actions remain unchanged…
  async function handleClaimNft() {
    if (!publicKey || !signTransaction) {
      alert("Connect your wallet first.");
      return;
    }
    const mintKeypair = Keypair.generate();
    const nftAta = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      publicKey,
      false,
      TOKEN_PROGRAM_ID
    );
    const [metadataPDA] = getMetadataPDA(mintKeypair.publicKey);
    const [masterEditionPDA] = getMasterEditionPDA(mintKeypair.publicKey);
    await claimNft.mutateAsync({
      contractPk,
      mint: mintKeypair,
      associatedTokenAccount: nftAta,
      metadataAccount: metadataPDA,
      masterEditionAccount: masterEditionPDA,
      name: "Pastora NFT",
      symbol: "PTORA",
      uri: "https://app.pastora.io/tokenMetadata.json",
    });
  }

  async function handleAdminWithdraw() {
    if (!publicKey || !signTransaction) {
      alert("Connect as admin.");
      return;
    }
    const adminAta = await getAssociatedTokenAddress(
      USDC_DEVNET_MINT,
      publicKey,
      false,
      TOKEN_PROGRAM_ID
    );
    await adminWithdraw.mutateAsync({ contractPk, adminTokenAccount: adminAta });
  }

  async function handleAdminCancel() {
    if (!publicKey || !signTransaction) {
      alert("Connect as admin.");
      return;
    }
    const adminAta = await getAssociatedTokenAddress(
      USDC_DEVNET_MINT,
      publicKey,
      false,
      TOKEN_PROGRAM_ID
    );
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
    if (investorsLoading) {
      alert("Cargando inversores…");
      return;
    }
    if (!investorRecords || investorRecords.length === 0) {
      alert("No hay inversores.");
      return;
    }
  
    // 1) Admin ATA
    const adminAta = await getAssociatedTokenAddress(
      USDC_DEVNET_MINT,
      publicKey,
      false,
      TOKEN_PROGRAM_ID
    );
  
    // 2) Para cada inversor, llama settleInvestor
    for (const rec of investorRecords) {
      const investorPk = new PublicKey(rec.account.investor);
      const investorAta = await getAssociatedTokenAddress(
        USDC_DEVNET_MINT,
        investorPk,
        false,
        TOKEN_PROGRAM_ID
      );
      // PDA del InvestorRecord
      const [recordPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("investor-record"),
          contractPk.toBuffer(),
          investorPk.toBuffer(),
        ],
        program.programId
      );
  
      try {
        await settleInvestor.mutateAsync({
          contractPk,
          investorRecordPk: recordPda,
          investorPk: investorPk,
          adminTokenAccount: adminAta,
          investorTokenAccount: investorAta,
        });
        toast.success(
          `Pagado ${(
            rec.account.amount.toNumber() +
            Math.floor((rec.account.amount.toNumber() * contractData.yieldPercentage.toNumber()) / 100)
          ) / 1_000_000} USDC a ${investorPk.toBase58()}`
        );
      } catch (err: any) {
        toast.error(`Error a ${investorPk.toBase58()}: ${err.message}`);
      }
    }
    // 3) Cerrar el contrato de una vez
    await closeContract.mutateAsync({ contractPk });

  }  
  

  async function handleProlong() {
    if (!publicKey || !signTransaction) {
      alert("Connect as admin.");
      return;
    }
    await prolongContract.mutateAsync({ contractPk });
  }

  async function handleDefault() {
    await defaultContract.mutateAsync({ contractPk });
  }

  return (
    <div className="w-full rounded-xl bg-white shadow-lg my-4 border border-gray-200 overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Left Side: Farm Image + Status (overlay in top-left) */}
        <div className="relative w-full md:w-1/2">
          <img
            src={farmImageUrl}
            alt="Farm"
            className="block w-full h-full object-cover"
          />
          <span className="absolute top-2 left-2 px-2 py-1 text-xs bg-green-500 uppercase rounded text-white font-bold">
            {status}
          </span>
        </div>
        {/* Right Side: Contract Details */}
        <div className="w-full md:w-1/2 p-4 flex flex-col justify-center">
          {/* Farm Name as title */}
          <h3 className="text-4xl font-bold mb-4 text-center">{farmNameText}</h3>
          {/* Two-column layout: Characteristics and Yield Percentage */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Left Column: Characteristics (smaller text for mobile) */}
            <div className="space-y-2 text-left text-sm md:text-lg">
              <p>
                <strong>Farm Address:</strong>{" "}
                <span className="font-normal">{farmAddressText}</span>
              </p>
              <p>
                <strong>{deadlineLabel}:</strong>{" "}
                <span className="font-normal">
                  {endDate ? endDate.toLocaleString() : "N/A"}
                </span>
              </p>
              <p>
                <strong>Total Asked:</strong>{" "}
                <span className="font-normal">{totalNeeded} USDC</span>
              </p>
              <p>
                <strong>Funded:</strong>{" "}
                <span className="font-normal">{(fundedSoFar / 1_000_000).toFixed(2)} USDC</span>
              </p>
              <p>
                <strong>Remaining:</strong>{" "}
                <span className="font-normal">{remaining} USDC</span>
              </p>
            </div>
            {/* Right Column: Yield Percentage */}
            <div className="flex items-center justify-center md:justify-end">
              <div className="text-6xl md:text-7xl font-extrabold text-gray-800">
                {contractData.yieldPercentage.toString()}%
              </div>
            </div>
          </div>
          {/* Full-width area for Invest and Mint NFT buttons */}
          {["Created", "Funding"].includes(status) && (
            <div className="mb-4">
              <input
                type="number"
                className="input input-bordered w-full mb-2 bg-black text-white"
                placeholder="Investment Amount (USDC)"
                value={investInput}
                onChange={(e) => setInvestInput(e.target.value)}
              />
              <button
                className="btn btn-success w-full mb-2"
                onClick={handleInvest}
              >
                Invest
              </button>
              {hasInvested && (
                <button
                  className="btn btn-primary w-full"
                  onClick={handleClaimNft}
                >
                  Mint NFT
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Admin Actions and Download CSV */}
      {publicKey?.toBase58() === ADMIN_PUBKEY && (
        <div className="mt-4 flex flex-col space-y-2 px-4 pb-4">
          {status === "Funded Pending Verification" && (
            <>
              <button
                className="btn btn-success"
                onClick={handleAdminWithdraw}
              >
                Withdraw Funds
              </button>
              <button className="btn btn-error" onClick={handleAdminCancel}>
                Cancel Contract
              </button>
            </>
          )}
          {status === "Active" && (
            <button
              className="btn btn-warning w-full"
              onClick={handleCheckMaturity}
            >
              Check Maturity
            </button>
          )}
          {(status === "Pending Buyback" || status === "Prolonged") && (
            <div className="flex flex-col space-y-2">
              <button className="btn btn-accent" onClick={handleSettle} disabled={investorsLoading}>
                Settle Contract
              </button>
              {status === "Pending Buyback" && (
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
          {/* Admin Download CSV Button */}
          <div className="mt-4">
            <AdminExportCSV contractPk={contractPk} />
          </div>
        </div>
      )}
    </div>
  );
}

export function GrasschainContractsList() {
  const { allContracts } = useGrasschainContractSplProgram();

  if (allContracts.isLoading) return <p>Loading contracts...</p>;
  if (allContracts.isError) return <p>Error loading contracts.</p>;

  const contracts = allContracts.data || [];

  // Active = not settled or defaulted
  const active = contracts.filter(
    ({ account }) =>
      !("settled" in account.status || "defaulted" in account.status)
  );

  // Done = settled OR defaulted
  const done = contracts.filter(
    ({ account }) =>
      "settled" in account.status || "defaulted" in account.status
  );

  return (
    <div className="flex flex-col space-y-8">
      {/* Active contracts */}
      {active.length > 0 ? (
        active.map(({ publicKey, account }) => (
          <GrasschainContractCard
            key={publicKey.toBase58()}
            contractPk={publicKey}
            contractData={account}
          />
        ))
      ) : (
        <p>No active contracts or in funding.</p>
      )}

      {/* Settled & Defaulted contracts */}
      {done.length > 0 && (
        <div className="space-y-4">
          {done.map(({ publicKey, account }) => {
            const isSettled = "settled" in account.status;
            const badgeText = isSettled ? "SETTLED" : "DEFAULTED";
            const badgeColor = isSettled ? "bg-cyan-600" : "bg-red-600";

            return (
              <div
                key={publicKey.toBase58()}
                className="relative opacity-50"
              >
                <GrasschainContractCard
                  contractPk={publicKey}
                  contractData={account}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span
                    className={`px-3 py-1 text-xl font-bold text-white rounded ${badgeColor}`}
                  >
                    {badgeText}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}