"use client";

import { useMemo } from "react";
import { BN, Program, AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";

// Importar el IDL actualizado
import grasschainSplIdl from "../../../anchor/target/idl/grasschain_contract_spl.json";
import { GrasschainContractSpl } from "../../../anchor/target/types/grasschain_contract_spl";

export const USDC_DEVNET_MINT = new PublicKey(
  "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"
);

// Creamos el program pasando el provider
function getProgram(provider: AnchorProvider): Program<GrasschainContractSpl> {
  return new Program<GrasschainContractSpl>(
    grasschainSplIdl as GrasschainContractSpl,
    provider
  );
}

export function useGrasschainContractSplProgram() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const provider = useMemo(() => {
    if (typeof window === "undefined") {
      return new AnchorProvider(connection, {} as any, {
        skipPreflight: false,
        commitment: "processed",
      });
    }
    return new AnchorProvider(connection, (window as any).solana, {
      skipPreflight: false,
      commitment: "processed",
    });
  }, [connection]);

  const program = useMemo(() => getProgram(provider), [provider]);

  const allContracts = useQuery({
    queryKey: ["grasschainSplContract", "allContracts"],
    queryFn: async () => {
      return program.account.contract.all();
    },
    enabled: !!program,
  });

  interface CreateContractArgs {
    nftMint: PublicKey;
    totalInvestmentNeeded: number;
    yieldPercentage: number;
    durationInSeconds: number;
    contractId: number;
    farmName: string;
    farmAddress: string;
  }
  const createContract = useMutation<string, Error, CreateContractArgs>({
    mutationFn: async ({
      nftMint,
      totalInvestmentNeeded,
      yieldPercentage,
      durationInSeconds,
      contractId,
      farmName,
      farmAddress,
    }) => {
      if (!publicKey) throw new Error("No wallet connected.");

      // Solo el admin crea el contrato.
      const [contractPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("contract"),
          publicKey.toBuffer(),
          new BN(contractId).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );
      const [escrowVaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow-vault"), contractPda.toBuffer()],
        program.programId
      );

      const txSig = await program.methods
        .createContract(
          new BN(totalInvestmentNeeded),
          new BN(yieldPercentage),
          new BN(durationInSeconds),
          new BN(contractId),
          nftMint,
          farmName,
          farmAddress
        )
        .accountsPartial({
          admin: publicKey,
          tokenMint: USDC_DEVNET_MINT,
          contract: contractPda,
          escrowVault: escrowVaultPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      toast.success("createContract success: " + txSig);
      allContracts.refetch();
      return txSig;
    },
  });

  interface InvestContractArgs {
    contractPk: PublicKey;
    amount: number;
    investorTokenAccount: PublicKey;
  }
  const investContract = useMutation<string, Error, InvestContractArgs>({
    mutationFn: async ({ contractPk, amount, investorTokenAccount }) => {
      if (!publicKey) throw new Error("No wallet connected.");
      const contractData = await program.account.contract.fetch(contractPk);
      const escrowVault = contractData.escrowTokenAccount as PublicKey;

      // Derivar el PDA del InvestorRecord
      const [investorRecordPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("investor-record"), contractPk.toBuffer(), publicKey.toBuffer()],
        program.programId
      );

      const txSig = await program.methods
        .investContract(new BN(amount))
        .accountsPartial({
          contract: contractPk,
          investor: publicKey,
          tokenMint: USDC_DEVNET_MINT,
          escrowVault,
          investorTokenAccount,
          investorRecord: investorRecordPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      toast.success("investContract success: " + txSig);
      allContracts.refetch();
      return txSig;
    },
  });

  const expireFunding = useMutation<string, Error, { contractPk: PublicKey }>({
    mutationFn: async ({ contractPk }) => {
      const txSig = await program.methods
        .expireFunding()
        .accounts({
          contract: contractPk,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      toast.success("expireFunding success: " + txSig);
      allContracts.refetch();
      return txSig;
    },
  });

  interface AdminWithdrawArgs {
    contractPk: PublicKey;
    adminTokenAccount: PublicKey;
  }
  const adminWithdraw = useMutation<string, Error, AdminWithdrawArgs>({
    mutationFn: async ({ contractPk, adminTokenAccount }) => {
      if (!publicKey) throw new Error("No wallet connected.");
      const contractData = await program.account.contract.fetch(contractPk);
      const escrowVault = contractData.escrowTokenAccount as PublicKey;

      const txSig = await program.methods
        .adminWithdraw()
        .accountsPartial({
          contract: contractPk,
          admin: publicKey,
          adminTokenAccount,
          escrowVault,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      toast.success("adminWithdraw success: " + txSig);
      allContracts.refetch();
      return txSig;
    },
  });

  interface AdminCancelArgs {
    contractPk: PublicKey;
    investorTokenAccount: PublicKey;
  }
  const adminCancel = useMutation<string, Error, AdminCancelArgs>({
    mutationFn: async ({ contractPk, investorTokenAccount }) => {
      if (!publicKey) throw new Error("No wallet connected.");
      const contractData = await program.account.contract.fetch(contractPk);
      const escrowVault = contractData.escrowTokenAccount as PublicKey;
      const txSig = await program.methods
        .adminCancel()
        .accountsPartial({
          contract: contractPk,
          admin: publicKey,
          escrowVault,
          investorTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      toast.success("adminCancel success: " + txSig);
      allContracts.refetch();
      return txSig;
    },
  });

  const checkMaturity = useMutation<string, Error, { contractPk: PublicKey }>({
    mutationFn: async ({ contractPk }) => {
      const txSig = await program.methods
        .checkMaturity()
        .accountsPartial({
          contract: contractPk,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      toast.success("checkMaturity success: " + txSig);
      allContracts.refetch();
      return txSig;
    },
  });

  interface SettleContractArgs {
    contractPk: PublicKey;
    amount: number;
    adminTokenAccount: PublicKey;
    investorTokenAccount: PublicKey;
  }
  const settleContract = useMutation<string, Error, SettleContractArgs>({
    mutationFn: async ({ contractPk, amount, adminTokenAccount, investorTokenAccount }) => {
      if (!publicKey) throw new Error("No wallet connected.");
      const txSig = await program.methods
        .settleContract(new BN(amount))
        .accountsPartial({
          contract: contractPk,
          admin: publicKey,
          adminTokenAccount,
          investorTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      toast.success("settleContract success: " + txSig);
      allContracts.refetch();
      return txSig;
    },
  });

  const prolongContract = useMutation<string, Error, { contractPk: PublicKey }>({
    mutationFn: async ({ contractPk }) => {
      if (!publicKey) throw new Error("No wallet connected.");
      const txSig = await program.methods
        .prolongContract()
        .accountsPartial({
          contract: contractPk,
          admin: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      toast.success("prolongContract success: " + txSig);
      allContracts.refetch();
      return txSig;
    },
  });

  const defaultContract = useMutation<string, Error, { contractPk: PublicKey }>({
    mutationFn: async ({ contractPk }) => {
      const txSig = await program.methods
        .defaultContract()
        .accountsPartial({
          contract: contractPk,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      toast.success("defaultContract success: " + txSig);
      allContracts.refetch();
      return txSig;
    },
  });

  return {
    program,
    allContracts,
    createContract,
    investContract,
    expireFunding,
    adminWithdraw,
    adminCancel,
    checkMaturity,
    settleContract,
    prolongContract,
    defaultContract,
    getInvestorRecordPDA: (contractPk: PublicKey, investorPk: PublicKey) =>
      PublicKey.findProgramAddressSync(
        [Buffer.from("investor-record"), contractPk.toBuffer(), investorPk.toBuffer()],
        program.programId
      ),
  };
}
