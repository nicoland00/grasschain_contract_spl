// src/app/api/my-contracts/route.ts
import { NextResponse }       from "next/server";
import { getServerSession }   from "next-auth/next";
import { authOptions }        from "@/lib/auth";
import { dbConnect }          from "@/lib/dbConnect";
import FiatInvestor           from "@/models/tracking/FiatInvestor";
import CryptoInvestor         from "@/models/tracking/CryptoInvestor";
import { Connection, PublicKey }     from "@solana/web3.js";
import { AnchorProvider, Program }   from "@coral-xyz/anchor";
import idl                           from "../../../../anchor/target/idl/grasschain_contract_spl.json";
import { GrasschainContractSpl }     from "../../../../anchor/target/types/grasschain_contract_spl";

export const runtime  = "nodejs";
export const dynamic  = "force-dynamic";

interface ContractEntry {
  contractId:  string;
  status:      "not-started" | "active" | "settled" | "defaulted";
  ranchId?:    string;
  lotId?:      string;
  farmName?:   string;
}

export async function GET(req: Request) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  const email   = session?.user?.email;
  const url     = new URL(req.url);
  const wallet  = url.searchParams.get("wallet");

  // must be either logged in or pass ?wallet=
  if (!email && !wallet) {
    return NextResponse.json({ error: "No wallet or session" }, { status: 401 });
  }

  // if this wallet is your admin key, bypass the DB investors entirely
  if (wallet === process.env.NEXT_PUBLIC_ADMIN_PUBKEY) {
    // instantiate Anchor just like you do below
    const RPC  = process.env.SOLANA_RPC!;
    const PROG = process.env.PROGRAM_ID!;
    const connection = new Connection(RPC, { commitment: "processed" });
    const provider   = new AnchorProvider(connection, {} as any, { commitment: "processed" });
    const program    = new Program<GrasschainContractSpl>(idl as any, provider);

    // fetch *all* on-chain contracts and filter to only those where `account.admin == wallet`
    const allCs = await program.account.contract.all();
    const out   = allCs
      .filter(({ account }) => account.admin.toBase58() === wallet)
      .map(({ publicKey, account }) => {
        let st: ContractEntry["status"] = "not-started";
        if      ("active"    in account.status)     st = "active";
        else if ("settled"   in account.status)     st = "settled";
        else if ("defaulted" in account.status)     st = "defaulted";
        return { contractId: publicKey.toBase58(), status: st, farmName: account.farmName };
      });
    return NextResponse.json(out);
  }

  // — otherwise fall back to your existing investor-based logic —
  let investors: { contract: string; ranchId?: string; lotId?: string }[] = [];
  if (email) {
    const fis = await FiatInvestor.find(
      { email },
      "contract ranchId lotId"
    ).lean();
    investors = fis.map((fi) => ({
      contract: fi.contract,
      ranchId:  fi.ranchId,
      lotId:    (fi as any).lotId,
    }));
  } else {
    const cis = await CryptoInvestor.find(
      { investor: wallet! },
      "contract ranchId lotId"
    ).lean();
    investors = cis.map((ci) => ({
      contract: ci.contract,
      ranchId:  ci.ranchId,
      lotId:    (ci as any).lotId,
    }));
  }

  // 2) Validate ENV
  const RPC  = process.env.SOLANA_RPC;
  const PROG = process.env.PROGRAM_ID;
  if (!RPC || !PROG) {
    return NextResponse.json(
      { error: "Server mis-configured: missing SOLANA_RPC or PROGRAM_ID" },
      { status: 500 }
    );
  }

  // 3) Instantiate Anchor
  const connection = new Connection(RPC, { commitment: "processed" });
  const provider   = new AnchorProvider(connection, {} as any, {
    commitment:    "processed",
    skipPreflight: false,
  });
  const program    = new Program<GrasschainContractSpl>(idl as any, provider);

  // 4) Fetch on-chain status
  const out: ContractEntry[] = [];
  for (const { contract, ranchId, lotId } of investors) {
    try {
      const pk   = new PublicKey(contract);
      const acct = await program.account.contract.fetch(pk);
      let st: ContractEntry["status"] = "not-started";
      if      ("active"    in acct.status)     st = "active";
      else if ("settled"   in acct.status)     st = "settled";
      else if ("defaulted" in acct.status)     st = "defaulted";
      out.push({ contractId: contract, status: st, ranchId, lotId, farmName: acct.farmName });
    } catch {
      out.push({ contractId: contract, status: "not-started", ranchId, lotId });
    }
  }

  return NextResponse.json(out);
}
