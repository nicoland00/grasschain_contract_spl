// components/grasschain_contract_spl/grasschain_contract_spl-ui.tsx
"use client";

import React, { useState } from "react";
import { PublicKey, Transaction, Keypair } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
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
import { loadStripe } from "@stripe/stripe-js";

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

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

// Must match ADMIN_ADDRESS in lib.rs
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
    setPeriodDays("");
    setFarmName("");
    setFarmAddress("");
    setFarmImageUrl("");
  }

  return (
    <div className="max-w-md mx-auto bg-white shadow p-6 rounded mb-8">
      <h3 className="text-2xl font-bold mb-4 text-center">
        Create Contract (Admin Only)
      </h3>
      <label className="block mb-1">Investment Amount (USDC)</label>
      <input
        type="number"
        className="input input-bordered w-full mb-3"
        value={investment}
        onChange={(e) => setInvestment(e.target.value)}
      />
      <label className="block mb-1">Yield Percentage (%)</label>
      <input
        type="number"
        className="input input-bordered w-full mb-3"
        value={yieldPerc}
        onChange={(e) => setYieldPerc(e.target.value)}
      />
      <label className="block mb-1">Funding Period (days)</label>
      <input
        type="number"
        className="input input-bordered w-full mb-3"
        value={periodDays}
        onChange={(e) => setPeriodDays(e.target.value)}
      />
      <label className="block mb-1">Farm Name</label>
      <input
        type="text"
        className="input input-bordered w-full mb-3"
        value={farmName}
        onChange={(e) => setFarmName(e.target.value)}
      />
      <label className="block mb-1">Farm Address</label>
      <input
        type="text"
        className="input input-bordered w-full mb-3"
        value={farmAddress}
        onChange={(e) => setFarmAddress(e.target.value)}
      />
      <label className="block mb-1">Farm Image URL</label>
      <input
        type="text"
        className="input input-bordered w-full mb-3"
        placeholder="https://..."
        value={farmImageUrl}
        onChange={(e) => setFarmImageUrl(e.target.value)}
      />
      <button
        className="btn btn-primary w-full mt-4"
        onClick={handleCreateContract}
      >
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
  const [hasInvested, setHasInvested] = useState(false);

  // Fiat form state
  const [showFiatForm, setShowFiatForm] = useState(false);
  const [fiatEmail, setFiatEmail] = useState("");
  const [fiatBankDetails, setFiatBankDetails] = useState("");
  const [loadingFiat, setLoadingFiat] = useState(false);

  // Determine human‑readable status
  let status = "Unknown";
  if ("created" in contractData.status) status = "Created";
  else if ("funding" in contractData.status) status = "Funding";
  else if ("fundedPendingVerification" in contractData.status)
    status = "Funded Pending Verification";
  else if ("active" in contractData.status) status = "Active";
  else if ("pendingBuyback" in contractData.status)
    status = "Pending Buyback";
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

  // 1) Crypto investment + NFT
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
      alert(`You cannot invest more than the remaining: ${remaining} USDC`);
      return;
    }

    const userAta = await getAssociatedTokenAddress(
      USDC_DEVNET_MINT,
      publicKey,
      false,
      TOKEN_PROGRAM_ID
    );
    const mintKeypair = Keypair.generate();
    const nftAta = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      publicKey,
      false,
      TOKEN_PROGRAM_ID
    );
    const [metadataPDA] = getMetadataPDA(mintKeypair.publicKey);
    const [masterEditionPDA] = getMasterEditionPDA(
      mintKeypair.publicKey
    );

    await investContract.mutateAsync({
      contractPk,
      amount: partialAmount,
      investorTokenAccount: userAta,
    });

    // Poll until investor record exists
    const { program } = useGrasschainContractSplProgram();
    const [investorRecordPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("investor-record"),
        contractPk.toBuffer(),
        publicKey.toBuffer(),
      ],
      program.programId
    );
    let retries = 0;
    let exists = false;
    while (retries < 10 && !exists) {
      try {
        await program.account.investorRecord.fetch(investorRecordPda);
        exists = true;
      } catch {
        await new Promise((r) => setTimeout(r, 500));
        retries++;
      }
    }
    if (!exists) {
      toast.error("Investor record not ready. Try claiming NFT later.");
      return;
    }

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

    setHasInvested(true);
    setInvestInput("");
  }

  // 2) Stripe Checkout for card
  async function handleCheckoutCard() {
    if (!fiatEmail) return alert("Introduce tu email");
    setLoadingFiat(true);
    const res = await fetch("/api/create-stripe-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contract: contractPk.toBase58(),
        email: fiatEmail,
        amount: remaining,
      }),
    });
    const { sessionId, error } = await res.json();
    if (error) {
      setLoadingFiat(false);
      return alert(error);
    }
    const stripe = await stripePromise;
    await stripe!.redirectToCheckout({ sessionId });
  }

  // 3) Register bank transfer
  async function handleBankPay() {
    if (!fiatEmail || !fiatBankDetails)
      return alert("Email y datos bancarios obligatorios");
    setLoadingFiat(true);
    await fetch("/api/fiat-investor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contract: contractPk.toBase58(),
        email: fiatEmail,
        amountPaid: remaining,
        paymentMethod: "bank",
        bankDetails: fiatBankDetails,
      }),
    });
    alert("¡Registro recibido! Te contactaremos pronto.");
    setShowFiatForm(false);
    setLoadingFiat(false);
  }

  // Handlers for other actions…
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
    const [masterEditionPDA] = getMasterEditionPDA(
      mintKeypair.publicKey
    );
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
    await adminWithdraw.mutateAsync({
      contractPk,
      adminTokenAccount: adminAta,
    });
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
      alert("Connect as admin.");
      return;
    }
    const adminAta = await getAssociatedTokenAddress(
      USDC_DEVNET_MINT,
      publicKey,
      false,
      TOKEN_PROGRAM_ID
    );
    const investorPublicKey = new PublicKey(contractData.investor);
    const investorAta = await getAssociatedTokenAddress(
      USDC_DEVNET_MINT,
      investorPublicKey,
      false,
      TOKEN_PROGRAM_ID
    );
    const principal = contractData.totalInvestmentNeeded.toNumber();
    const yieldAmt = Math.floor(
      (principal * contractData.yieldPercentage) / 100
    );
    const requiredBuyback = principal + yieldAmt;

    await settleContract.mutateAsync({
      contractPk,
      amount: requiredBuyback,
      adminTokenAccount: adminAta,
      investorTokenAccount: investorAta,
    });
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
        {/* Left Side: Farm Image + Status */}
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
          <h3 className="text-4xl font-bold mb-4 text-center">
            {farmNameText}
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
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
                <span className="font-normal">
                  {(fundedSoFar / 1_000_000).toFixed(2)} USDC
                </span>
              </p>
              <p>
                <strong>Remaining:</strong>{" "}
                <span className="font-normal">{remaining} USDC</span>
              </p>
            </div>
            <div className="flex items-center justify-center md:justify-end">
              <div className="text-6xl md:text-7xl font-extrabold text-gray-800">
                {contractData.yieldPercentage.toString()}%
              </div>
            </div>
          </div>
          {/* Invest buttons */}
          {["Created", "Funding"].includes(status) && (
            <div className="space-y-3 mb-4">
              <input
                type="number"
                className="input input-bordered w-full mb-2"
                placeholder="Investment Amount (USDC)"
                value={investInput}
                onChange={(e) => setInvestInput(e.target.value)}
              />
              {/* Crypto */}
              <button
                className="btn btn-success w-full flex items-center justify-center"
                onClick={handleInvest}
              >
                <img
                  src="/icons/solana.svg"
                  className="w-5 h-5 mr-2"
                  alt="Solana"
                />
                Invest with Crypto
              </button>
              {hasInvested && (
                <button
                  className="btn btn-primary w-full"
                  onClick={handleClaimNft}
                >
                  Mint NFT
                </button>
              )}
              {/* Fiat */}
              <button
                className="btn btn-warning w-full flex items-center justify-center"
                onClick={() => setShowFiatForm(true)}
              >
                <img
                  src="/icons/stripe.svg"
                  className="w-5 h-5 mr-2"
                  alt="Stripe"
                />
                Invest with Fiat
              </button>
              {showFiatForm && (
                <div className="p-4 bg-gray-50 rounded space-y-2 relative">
                  <button
                    onClick={() => setShowFiatForm(false)}
                    className="absolute top-2 right-2 text-xl"
                  >
                    ×
                  </button>
                  <input
                    type="email"
                    placeholder="Tu email"
                    className="input input-bordered w-full"
                    value={fiatEmail}
                    onChange={(e) => setFiatEmail(e.target.value)}
                    disabled={loadingFiat}
                  />
                  <button
                    className="btn btn-primary w-full flex items-center justify-center"
                    onClick={handleCheckoutCard}
                    disabled={!fiatEmail || loadingFiat}
                  >
                    <img
                      src="/icons/stripe.svg"
                      className="w-5 h-5 mr-2"
                      alt="Stripe"
                    />
                    Tarjeta
                  </button>
                  <hr />
                  <textarea
                    placeholder="Datos bancarios (IBAN, Titular…)"
                    className="textarea textarea-bordered w-full"
                    value={fiatBankDetails}
                    onChange={(e) =>
                      setFiatBankDetails(e.target.value)
                    }
                    disabled={loadingFiat}
                  />
                  <button
                    className="btn btn-secondary w-full"
                    onClick={handleBankPay}
                    disabled={
                      !fiatEmail ||
                      !fiatBankDetails ||
                      loadingFiat
                    }
                  >
                    Transferencia bancaria
                  </button>
                </div>
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
              <button
                className="btn btn-error"
                onClick={handleAdminCancel}
              >
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
          {(status === "Pending Buyback" ||
            status === "Prolonged") && (
            <div className="flex flex-col space-y-2">
              <button
                className="btn btn-accent"
                onClick={handleSettle}
              >
                Settle Contract
              </button>
              {status === "Pending Buyback" && (
                <button
                  className="btn btn-info"
                  onClick={handleProlong}
                >
                  Request 2-Week Extension
                </button>
              )}
              {status === "Prolonged" && (
                <button
                  className="btn btn-danger"
                  onClick={handleDefault}
                >
                  Mark as Defaulted
                </button>
              )}
            </div>
          )}
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
  if (!contracts.length) return <p>No contracts found.</p>;

  // Filter out finished contracts
  const visible = contracts.filter(({ account }: any) => {
    return !(
      "settled" in account.status ||
      "cancelled" in account.status ||
      "defaulted" in account.status
    );
  });

  if (visible.length === 0) {
    return <p>No active contracts or in funding.</p>;
  }

  return (
    <div className="flex flex-col space-y-6">
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
