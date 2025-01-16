/**
 * tests/grasschain_contract_spl_approachA.spec.ts
 *
 * Approach A: All mint & token creation is done via Anchor instructions,
 * so ephemeral Bankrun sees them automatically.
 *
 * We'll do:
 *   (1) initMint         => create Mint+escrow PDAs
 *   (2) mintTokensToUser => investor
 *   (3) mintTokensToUser => farmer (optional, for the buyback)
 *   (4) createContract   => status=Created
 *   (5) fundContract     => status=Funded
 *   (6) settleContract   => status=Settled
 */

import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction
} from "@solana/web3.js";
import { BankrunProvider } from "anchor-bankrun";
import {
  startAnchor,
  BanksClient,
  ProgramTestContext
} from "solana-bankrun";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

// If your code uses anchor.utils.token, we can do:
// const { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } = anchor.utils.token;

// If your IDL is generated at `target/idl/...`
import grasschainIdl from "../target/idl/grasschain_contract_spl.json";
import { GrasschainContractSpl } from "../target/types/grasschain_contract_spl";

jest.setTimeout(120_000);

describe("Grasschain (Approach A) - Full Anchor Flow", () => {
  let provider: BankrunProvider;
  let banksClient: BanksClient;
  let context: ProgramTestContext;
  let program: Program<GrasschainContractSpl>;

  // We'll have "farmer" as the default wallet from Bankrun
  let farmer: Keypair;
  // We'll airdrop lamports to "investor"
  let investor: Keypair;

  // We'll store PDAs from anchor instructions
  let mintPda: PublicKey;
  let escrowVaultPda: PublicKey;
  let contractPda: PublicKey;

  // Terms
  const principal = new BN(1_000_000);
  const yieldPerc = new BN(10);

  beforeAll(async () => {
    // 1) Start ephemeral environment
    context = await startAnchor(
      "",
      [
        {
          name: "grasschain_contract_spl",
          programId: new PublicKey(grasschainIdl.address),
        },
      ],
      []
    );

    provider = new BankrunProvider(context);
    anchor.setProvider(provider);

    banksClient = context.banksClient;
    program = new anchor.Program<GrasschainContractSpl>(
      grasschainIdl as GrasschainContractSpl,
      provider
    );

    // 2) Our signers
    farmer = provider.wallet.payer;
    investor = Keypair.generate();

    // 3) Airdrop lamports from farmer => investor for fees
    const blockhashResult = await banksClient.getLatestBlockhash("confirmed");
    if (!blockhashResult) {
      throw new Error("No ephemeral blockhash found!");
    }
    const [localBlockhash] = blockhashResult;

    const transferTx = new Transaction({
      feePayer: farmer.publicKey,
      recentBlockhash: localBlockhash,
    }).add(
      SystemProgram.transfer({
        fromPubkey: farmer.publicKey,
        toPubkey: investor.publicKey,
        lamports: 2_000_000_000, // 2 SOL
      })
    );
    transferTx.sign(farmer);
    await banksClient.processTransaction(transferTx);
  });

  it("(1) initMint => anchor creates SPL mint + escrow vault", async () => {
    // Derive PDAs
    const [mintPubkey] = PublicKey.findProgramAddressSync(
      [Buffer.from("mint"), farmer.publicKey.toBuffer()],
      program.programId
    );
    mintPda = mintPubkey;

    const [vaultPubkey] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), mintPubkey.toBuffer()],
      program.programId
    );
    escrowVaultPda = vaultPubkey;

    const decimals = 6;
    const txSig = await program.methods
      .initMint(decimals)
      .accountsPartial({
        signer: farmer.publicKey,
        mintAccount: mintPda,
        escrowVault: escrowVaultPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log("initMint => txSig =", txSig);
  });

  it("(2) mintTokensToUser => investor", async () => {
    // We'll mint enough for the investor to do "fundContract"
    const amount = new BN(1_500_000); // e.g. 1.5 million

    const txSig = await program.methods
      .mintTokensToUser(amount)
      .accountsPartial({
        signer: farmer.publicKey, // if the minted authority is farmer
        mintAccount: mintPda,
        recipient: investor.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([]) // If the mint authority is "farmer" (the default wallet), no extra signers needed
      .rpc();

    console.log("mintTokensToUser(investor) =>", txSig);
  });

  it("(3) mintTokensToUser => farmer (optional)", async () => {
    // If we want the farmer to have tokens for the final buyback
    const amount = new BN(2_000_000);

    const txSig = await program.methods
      .mintTokensToUser(amount)
      .accountsPartial({
        signer: farmer.publicKey,
        mintAccount: mintPda,
        recipient: farmer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("mintTokensToUser(farmer) =>", txSig);
  });

  it("(4) createContract => status=Created", async () => {
    const [cPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("contract"), farmer.publicKey.toBuffer()],
      program.programId
    );
    contractPda = cPda;

    const txSig = await program.methods
      .createContract(principal, yieldPerc)
      .accountsPartial({
        farmer: farmer.publicKey,
        contract: contractPda,
        mint: mintPda,
        escrowVault: escrowVaultPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("[createContract] =>", txSig);

    const contractData = await program.account.contract.fetch(contractPda);
    expect(contractData.status).toEqual({ created: {} });
    console.log("Contract => Created!");
  });

  it("(5) fundContract => status=Funded", async () => {
    // Derive or fetch the investor's ATA
    const investorAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      investor, // payer
      mintPda,  // mint
      investor.publicKey
    );

    const txSig = await program.methods
      .fundContract(principal) // must match exactly
      .accountsPartial({
        contract: contractPda,
        investor: investor.publicKey,
        mint: mintPda,
        escrowVault: escrowVaultPda,
        investorTokenAccount: investorAta.address, // Use the derived ATA
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([investor])
      .rpc();

    console.log("[fundContract => anchor]", txSig);

    const contractData = await program.account.contract.fetch(contractPda);
    expect(contractData.status).toEqual({ funded: {} });
    console.log("Contract => Funded!");
  });

  it("(6) settleContract => status=Settled", async () => {
    // Derive or fetch the investor's ATA
    const investorAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      investor, // payer
      mintPda,  // mint
      investor.publicKey
    );

    // Derive or fetch the farmer's ATA
    const farmerAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      farmer, // payer
      mintPda, // mint
      farmer.publicKey
    );

    const buyback = principal.toNumber() + (principal.toNumber() * yieldPerc.toNumber()) / 100;

    const txSig = await program.methods
      .settleContract(new BN(buyback))
      .accountsPartial({
        contract: contractPda,
        farmer: farmer.publicKey,
        mint: mintPda,
        investorTokenAccount: investorAta.address, // Use the derived ATA
        farmerTokenAccount: farmerAta.address, // Use the derived ATA
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("[settleContract => anchor]", txSig);

    const cdata = await program.account.contract.fetch(contractPda);
    expect(cdata.status).toEqual({ settled: {} });
    console.log("Contract => Settled!");
  });
});
