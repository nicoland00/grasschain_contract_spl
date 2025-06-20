"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
import { useSession } from "next-auth/react";
import { AdminExportCSV } from "./AdminExportCSV";
import { useNotifications, TNotification } from "@/hooks/useNotifications";


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
    <div className="w-full bg-appDarkGray border border-border rounded-2xl p-6 mb-8">
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
  const { data: session } = useSession();
  const [fiatFunded, setFiatFunded] = useState(0);
  const [timeLeft, setTimeLeft] = useState<string>("–");
  const [expired, setExpired] = useState<boolean>(false);
  
  useEffect(() => {
    fetch(`/api/fiat/summary?contract=${contractPk.toBase58()}`)
      .then((r) => r.json())
      .then((j) => setFiatFunded(j.fiatFunded || 0))
      .catch(console.error);
  }, [contractPk]);

  const {
    program,
    investContract,
    claimNft,
    adminWithdraw,
    adminCancel,
    checkMaturity,
    verifyFunding,
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

    // notifications for updates
    const { all: notes } = useNotifications(`?contract=${contractPk.toBase58()}`);
    const [modalOpen, setModalOpen] = useState(false);
    const [seen, setSeen] = useState<Set<string>>(new Set());
    const hasUnseen = notes.some((n) => !seen.has(n._id));
  
    useEffect(() => {
      if (modalOpen) {
        setSeen(new Set(notes.map((n) => n._id)));
      }
    }, [modalOpen, notes]);
  

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

  const totalNeeded = contractData.totalInvestmentNeeded.toNumber() / 1_000_000;
  const onChainFunded = contractData.amountFundedSoFar / 1_000_000;
  const remaining = totalNeeded - (onChainFunded + fiatFunded);

  // compute fill % for the track
  const fundedAmount = onChainFunded + fiatFunded;
  const fillPct = Math.min(100, Math.max(0, (fundedAmount / totalNeeded) * 100));

  // slider colors (same as in WeightGainForm)
  const fillColor   = '#4ECCA3';
  const trackColor  = '#E5E7EB';
  const borderColor = '#D1D5DB';

  const farmNameText =
  contractData.farmName === "San Antonio 2" &&
  contractPk.toBase58() === "Amo8DcGpNvpbkrKfnksRGYp6kCE5eG8V2RXbZku9x2vi"
    ? "San Antonio 3"
    : contractData.farmName || "N/A";
  const farmAddressText = contractData.farmAddress || "N/A";
  const farmImageUrl =
    contractData.farmImageUrl || "https://via.placeholder.com/300";

  let endDate: Date | null = null;
  let deadlineLabel = "";
  if ("created" in contractData.status || "funding" in contractData.status) {
    endDate = new Date(contractData.fundingDeadline.toNumber() * 1000);
    deadlineLabel = "Deadline";
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

  useEffect(() => {
    if (status !== "Active" || !endDate) return;
    const iv = setInterval(() => {
      const diff = endDate.getTime() - Date.now();
      if (diff <= 0) {
        setExpired(true);
        clearInterval(iv);
      } else {
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        setTimeLeft(`${d}d ${h}h`);
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [status, endDate]);

  
  // ─── EVENT HANDLERS (NO HOOKS HERE!) ───
  async function handleInvest() {
    // — on‑chain path (wallet connected) —
    if (publicKey && signTransaction) {
      const amount = parseFloat(investInput) * 1e6;
      if (isNaN(amount) || amount <= 0) {
        toast.error("Invalid amount");
        return;
      }
      if (amount > remaining * 1e6) {
        toast.error(`Cannot invest more than ${remaining} USDC`);
        return;
      }

      // 1) Generate NFT mint first
      const mintKeypair = Keypair.generate();

      // 2) transfer USDC -> escrow on-chain
      const userAta = await getAssociatedTokenAddress(
        USDC_DEVNET_MINT,
        publicKey,
        false,
        TOKEN_PROGRAM_ID
      );
      const txSig = await investContract.mutateAsync({
        contractPk,
        amount,
        investorTokenAccount: userAta,
      });

      // 3) record it off-chain in Mongo
      await fetch("/api/crypto-investor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contract:    contractPk.toBase58(),
          investor:    publicKey.toBase58(),
          nftMint:     mintKeypair.publicKey.toBase58(),
          txSignature: txSig,
          amount:      amount / 1e6,                     // store in USDC units
        }),
      });

      // 4) now mint & claim NFT…
      const [metaPda]    = getMetadataPDA(mintKeypair.publicKey);
      const [editionPda] = getMasterEditionPDA(mintKeypair.publicKey);
      const nftAta       = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        publicKey,
        false,
        TOKEN_PROGRAM_ID
      );
      await claimNft.mutateAsync({
        contractPk,
        mint:                  mintKeypair,
        associatedTokenAccount: nftAta,
        metadataAccount:       metaPda,
        masterEditionAccount:  editionPda,
        name:                  "Pastora NFT",
        symbol:                "PTORA",
        uri:                   "https://app.pastora.io/tokenMetadata.json",
      });

      setHasInvested(true);
      setInvestInput("");
      return;
    }

    // — off‑chain path (Stripe via NextAuth) —
    if (session?.user?.email) {
      const fiatAmount = parseFloat(investInput);
      if (isNaN(fiatAmount) || fiatAmount <= 0) {
        toast.error("Invalid amount");
        return;
      }
      if (fiatAmount > remaining) {
        toast.error(`Cannot invest more than ${remaining} USDC`);
        return;
      }
      const res = await fetch("/api/create-stripe-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contract: contractPk.toBase58(),
          email: session.user.email,
          amount: fiatAmount,
        }),
      });
      const { url, error } = await res.json();
      if (error) {
        toast.error(error);
        return;
      }
      window.location.href = url;
      return;
    }

    // — neither: prompt login —
    toast.error("Please connect your wallet or sign in to invest.");
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
    <>
    <div className="relative w-full bg-appDarkGray border border-border rounded-2xl p-6 mb-4">
          {status === "Active" && (
      <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
        <span className="bg-green-600 text-white px-4 py-2 rounded-2xl font-bold text-base">
          {expired
            ? "ACTIVE : Pending Management"
            : `ACTIVE : ${timeLeft}`}
        </span>
      </div>
    )}

    {!["Created", "Funding", "Funded Pending Verification"].includes(status) && (
        <div className="absolute top-12 inset-x-0 flex justify-center z-40">
          <button
            onClick={() => setModalOpen(true)}
            className="relative px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
          >
            Updates
            {hasUnseen && (
              <span
                className="absolute top-1 right-1 block w-3 h-3 bg-red-500 rounded-full"
                aria-label="New updates"
              />
            )}
          </button>
        </div>
      )}


      <div className="flex flex-col md:flex-row">
        {/* Right Side: Contract Details */}
        <div className="w-full p-6">
        <span className="absolute top-3 left-3 px-3 py-2 text-sm bg-green-600 uppercase rounded-2xl text-white font-bold">
            {status}
          </span>
          {/* Farm Name as title */}
          <h3 className="text-3xl font-bold mb-4 text-center md:text-4xl">{farmNameText}</h3>
          {/* Two-column layout: Characteristics and Yield Percentage */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Left Column: Characteristics (smaller text for mobile) */}
            <div className="md:space-y-2 text-left text-xs md:text-lg">
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
            </div>
            {/* Right Column: Yield Percentage */}
            <div className="flex items-center justify-center md:justify-end">
              <div className="text-6xl md:text-7xl font-extrabold text-gray-800">
                {contractData.yieldPercentage.toString()}%
              </div>
            </div>
          </div>
          <div className="flex items-center mb-4">
            <span
              className="text-sm text-gray-700 mr-2"
              title={`Funded: ${onChainFunded + fiatFunded} USDC`}
            >
              Funded: {onChainFunded + fiatFunded}
            </span>
            <input
              type="range"
              min={0}
              max={totalNeeded}
              value={fundedAmount}
              disabled
              className="w-full h-2 rounded-lg appearance-none slider-static"
              style={{
                background: `linear-gradient(
                  to right,
                  ${fillColor} 0%,
                  ${fillColor} ${fillPct}%,
                  ${trackColor} ${fillPct}%,
                  ${trackColor} 100%
                )`,
                border: `1px solid ${borderColor}`,
              }}
            />
            <span className="text-sm text-gray-700 ml-2">
              Total: {totalNeeded}
            </span>
          </div>
          {/* Full-width area for Invest and Mint NFT buttons */}
          {["Created", "Funding"].includes(status) && (
            <div>
            <input
              type="number"
              className="input input-bordered w-full mb-2 bg-gray-100 text-black"
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
        {status === "Funding" && (onChainFunded + fiatFunded) >= totalNeeded && (
           <button
             className="btn btn-primary w-full"
             onClick={() => verifyFunding.mutate({ contractPk })}
             disabled={verifyFunding.isPending}
           >
             {verifyFunding.isPending ? "Verifying…" : "Verify Funding"}
           </button>
         )}
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
    {modalOpen &&
      createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg overflow-hidden max-w-lg w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-4 py-2 border-b">
              <h2 className="text-lg font-semibold">Updates</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="overflow-y-auto p-4 space-y-4">
              {notes.length === 0 ? (
                <p className="text-center text-gray-500">No updates yet</p>
              ) : (
                notes
                  .slice()
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((n: TNotification) => (
                    <div key={n._id} className="flex flex-col">
                      <div className="flex justify-between">
                        <span className="font-medium">{n.title}</span>
                        <span className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="mt-1 text-gray-700">{n.message}</p>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export function GrasschainContractsList() {
  const { allContracts } = useGrasschainContractSplProgram();

  if (allContracts.isLoading) return <p>Loading contracts...</p>;
  if (allContracts.isError)   return <p>Error loading contracts.</p>;

  const contracts = allContracts.data || [];

  // 1) Pendientes de funding / creación
  const pendingFunding = contracts.filter(({ account }) =>
    "created" in account.status ||
    "funding" in account.status ||
    "fundedPendingVerification" in account.status
  );
  // 2) Activos
  const activeContracts = contracts.filter(({ account }) =>
    "active" in account.status
  );
  // 3) Completados (settled/defaulted)
  const doneContracts = contracts.filter(({ account }) =>
    "settled" in account.status || "defaulted" in account.status
  );

  return (
    <>
      <div className="flex flex-col space-y-8 mx-4 md:mx-auto">
        {/* 1) Pendientes de funding */}
        {pendingFunding.length > 0 ? (
          pendingFunding.map(({ publicKey, account }) => (
            <GrasschainContractCard
              key={publicKey.toBase58()}
              contractPk={publicKey}
              contractData={account}
            />
          ))
        ) : (
          <p>No pending contracts.</p>
        )}

        {/* 2) Activos y Completados al final, inaccesibles */}
        {(activeContracts.length > 0 || doneContracts.length > 0) && (
          <div className="space-y-4">
            {[...activeContracts, ...doneContracts].map(({ publicKey, account }) => {
              const isSettled = "settled" in account.status;
              const isActive  = "active" in account.status;
              const badgeText = isSettled
                ? "SETTLED"
                : isActive
                ? ""
                : "DEFAULTED";
              const badgeColor = isSettled
                ? "bg-cyan-600"
                : isActive
                ? ""
                : "bg-red-600";

              return (
                <div
                  key={publicKey.toBase58()}
                  className="relative opacity-50 pointer-events-none"
                >
                  <GrasschainContractCard
                    contractPk={publicKey}
                    contractData={account}
                  />
                  {/* wrapper badge igual que Settled */}
                  <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                    <span
                      className={`px-4 py-2 text-base font-bold text-white rounded-2xl shadow ${badgeColor}`}
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
      <style jsx global>{`
        input.slider-static:focus {
          outline: none;
        }
        input.slider-static::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 0;
          height: 0;
          opacity: 0;
        }
        input.slider-static::-moz-range-thumb {
          width: 0;
          height: 0;
          border: none;
        }
      `}</style>
    </>
  );
}
