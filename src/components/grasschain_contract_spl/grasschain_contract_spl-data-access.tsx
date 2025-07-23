"use client";

import { useMemo } from "react";
import { BN, Program, AnchorProvider } from "@coral-xyz/anchor";
import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Keypair,
  Transaction,
} from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

import grasschainSplIdl from "../../../anchor/target/idl/grasschain_contract_spl.json";
import { GrasschainContractSpl } from "../../../anchor/target/types/grasschain_contract_spl";

// Constante para el Token Metadata program ID
export const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

export const USDC_DEVNET_MINT = new PublicKey(
  "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"
);

// Crea el objeto Program de Anchor
function getProgram(provider: AnchorProvider): Program<GrasschainContractSpl> {
  return new Program<GrasschainContractSpl>(
    grasschainSplIdl as GrasschainContractSpl,
    provider
  );
}

export function useGrasschainContractSplProgram() {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const queryClient = useQueryClient();

  // Crear el provider
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

  // Instanciar el Program
  const program = useMemo(() => getProgram(provider), [provider]);

  // Query para obtener todos los contratos
  const allContracts = useQuery({
    queryKey: ["grasschainSplContract", "allContracts"],
    queryFn: async () => {
      return program.account.contract.all();
    },
    enabled: !!program,
  });

  // HOOK para obtener InvestorRecords de un contrato específico.
  function useInvestorRecords(contractPk: PublicKey) {
    return useQuery({
      queryKey: ["investorRecords", contractPk?.toBase58()],
      queryFn: async () => {
        // Ajusta el 'offset' según el layout: 8 bytes de discriminator
        return program.account.investorRecord.all([
          {
            memcmp: {
              offset: 8, // El campo 'contract' empieza justo después del discriminator
              bytes: contractPk.toBase58(),
            },
          },
        ]);
      },
      enabled: !!program && !!contractPk,
    });
  }

  // MUTACIONES
  interface CreateContractArgs {
    nftMint: PublicKey;
    totalInvestmentNeeded: number;
    yieldPercentage: number;
    durationInSeconds: number;
    contractId: number;
    farmName: string;
    farmAddress: string;
    farmImageUrl: string;
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
      farmImageUrl,
    }) => {
      if (!publicKey) throw new Error("No wallet connected.");

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
          farmAddress,
          farmImageUrl
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
      // Usa el campo en camelCase según el IDL
      const escrowVault = contractData.escrowTokenAccount as PublicKey;

      const [investorRecordPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("investor-record"),
          contractPk.toBuffer(),
          publicKey.toBuffer(),
        ],
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

  interface VerifyFundingArgs {
    contractPk: PublicKey;
  }
  
  const verifyFunding = useMutation<string, Error, VerifyFundingArgs>({
    mutationFn: async ({ contractPk }) => {
      if (!publicKey) throw new Error("No wallet connected.");
      const txSig = await program.methods
        .verifyFunding()
        .accountsPartial({
          contract: contractPk,
          admin: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      toast.success("verifyFunding success: " + txSig);
      queryClient.invalidateQueries({ queryKey: ["grasschainSplContract", "allContracts"] });
      return txSig;
    },
  });
  

  interface ClaimNftArgs {
    contractPk: PublicKey;
    mint: Keypair;
    associatedTokenAccount: PublicKey;
    metadataAccount: PublicKey;
    masterEditionAccount: PublicKey;
    name: string;
    symbol: string;
    uri: string;
  }
  const claimNft = useMutation<string, Error, ClaimNftArgs>({
    mutationFn: async ({
      contractPk,
      mint,
      associatedTokenAccount,
      metadataAccount,
      masterEditionAccount,
      name,
      symbol,
      uri,
    }) => {
      if (!publicKey) throw new Error("No wallet connected.");

      const [investorRecordPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("investor-record"),
          contractPk.toBuffer(),
          publicKey.toBuffer(),
        ],
        program.programId
      );

      const txSig = await program.methods
        .claimNft(name, symbol, uri)
        .accountsPartial({
          investor: publicKey,
          contract: contractPk,
          investorRecord: investorRecordPda,
          mint: mint.publicKey,
          associatedTokenAccount,
          metadataAccount,
          masterEditionAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([mint])
        .rpc();

      toast.success("claimNft success: " + txSig);
      queryClient.invalidateQueries(["investorRecords", contractPk.toBase58()] as any);
      allContracts.refetch();
      return txSig;
    },
  });

  interface ExpireFundingArgs {
    contractPk: PublicKey;
  }
  const expireFunding = useMutation<string, Error, ExpireFundingArgs>({
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

  interface CheckMaturityArgs {
    contractPk: PublicKey;
  }
  const checkMaturity = useMutation<string, Error, CheckMaturityArgs>({
    mutationFn: async ({ contractPk }) => {
      const txSig = await program.methods
        .checkMaturity()
        .accounts({
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

  interface ProlongContractArgs {
    contractPk: PublicKey;
  }
  const prolongContract = useMutation<string, Error, ProlongContractArgs>({
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

  interface SettleInvestorArgs {
    contractPk: PublicKey;
    investorRecordPk: PublicKey;
    investorPk: PublicKey;  
    adminTokenAccount: PublicKey;
    investorTokenAccount: PublicKey;
  }
  const settleInvestor = useMutation<string, Error, SettleInvestorArgs>({
    mutationFn: async ({
      contractPk,
      investorRecordPk,
      investorPk,
      adminTokenAccount,
      investorTokenAccount,
    }) => {
      if (!publicKey || !signTransaction) throw new Error("No wallet connected.");

      const ix = await program.methods
        .settleInvestor()// método recién creado en Rust
        .accountsPartial({
          contract: contractPk,
          admin: publicKey,
          investorRecord: investorRecordPk,
          investor: investorPk,    
          adminTokenAccount,
          investorTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction();

        const tx = new Transaction().add(ix);
        tx.feePayer = publicKey;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        const signed = await signTransaction(tx);
        const txSig = await connection.sendRawTransaction(signed.serialize());
        await connection.confirmTransaction(txSig, "processed");

      toast.success("settleInvestor success: " + txSig);
      allContracts.refetch();
      queryClient.invalidateQueries(["investorRecords", contractPk.toBase58()] as any);
      return txSig;
    },
  });


  interface DefaultContractArgs {
    contractPk: PublicKey;
  }
  const defaultContract = useMutation<string, Error, DefaultContractArgs>({
    mutationFn: async ({ contractPk }) => {
      const txSig = await program.methods
        .defaultContract()
        .accounts({
          contract: contractPk,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      toast.success("defaultContract success: " + txSig);
      allContracts.refetch();
      return txSig;
    },
  });

  interface CloseContractArgs { contractPk: PublicKey }
const closeContract = useMutation<string, Error, CloseContractArgs>({
  mutationFn: async ({ contractPk }) => {
    if (!publicKey) throw new Error("No wallet connected.");
    const tx = await program.methods
      .closeContract()
      .accountsPartial({
        contract: contractPk,
        admin: publicKey,
      })
      .rpc();
    toast.success("closeContract success: " + tx);
    allContracts.refetch();
    return tx;
  },
});


  return {
    program,
    allContracts,
    createContract,
    investContract,
    claimNft,
    verifyFunding,
    expireFunding,
    adminWithdraw,
    adminCancel,
    checkMaturity,
    settleInvestor,
    prolongContract,
    defaultContract,
    closeContract,
    getInvestorRecordPDA: (contractPk: PublicKey, investorPk: PublicKey) =>
      PublicKey.findProgramAddressSync(
        [Buffer.from("investor-record"), contractPk.toBuffer(), investorPk.toBuffer()],
        program.programId
      ),
    useInvestorRecords,
    // Helper para generar CSV usando los nombres correctos (camelCase)
    generateInvestorRecordsCSV: (records: any): string => {
      if (!records) return "";
      const header = "contract_id,investor,nft_mint\n";
      const rows = records
        .map((record: any) => {
          const acc = record.account;
          const c = acc.contract ? acc.contract.toBase58() : "N/A";
          const i = acc.investor ? acc.investor.toBase58() : "N/A";
          const nft = acc.nftMint ? acc.nftMint.toBase58() : "N/A";
          return `${c},${i},${nft}`;
        })
        .join("\n");
      return header + rows;
    },
  };
}