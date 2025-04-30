// src/app/api/my-contracts/route.ts
import { NextResponse }     from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions }      from "@/lib/auth";
import { dbConnect }        from "@/lib/dbConnect";
import FiatInvestor         from "@/models/tracking/FiatInvestor";
import CryptoInvestor       from "@/models/tracking/CryptoInvestor";

import { Connection, PublicKey }    from "@solana/web3.js";
import { AnchorProvider, Program }  from "@coral-xyz/anchor";
import idl                         from "../../../../anchor/target/idl/grasschain_contract_spl.json";
import { GrasschainContractSpl }   from "../../../../anchor/target/types/grasschain_contract_spl";

export const runtime = "nodejs";

interface ContractEntry {
  contractId: string;
  status:     "not-started" | "active" | "settled" | "defaulted";
}

export async function GET(req: Request) {
  // 1) connect to Mongo
  await dbConnect();

  // 2) figure out who’s calling
  const session = await getServerSession(authOptions);
  const email   = session?.user?.email;
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet");
  if (!email && !wallet) {
    return NextResponse.json({ error: "No wallet or session" }, { status: 401 });
  }

  // 3) load their on-chain + off-chain contracts
  let investors: { contract: string }[] = [];
  if (email) {
    const fis = await FiatInvestor.find({ email },    "contract").lean();
    investors = fis.map(fi => ({ contract: fi.contract }));
  } else {
    const cis = await CryptoInvestor.find({ investor: wallet }, "contract").lean();
    investors = cis.map(ci => ({ contract: ci.contract }));
  }

  // 4) now that we’re _actually handling a request_, read SOLANA_RPC/PROGRAM_ID
  const RPC = process.env.SOLANA_RPC;
  const PROG = process.env.PROGRAM_ID;
  if (!RPC || !PROG) {
    return NextResponse.json(
      { error: "Server mis-configured, missing SOLANA_RPC or PROGRAM_ID" },
      { status: 500 }
    );
  }

  // 5) set up Anchor/Provider/Program
  const connection = new Connection(RPC, { commitment: "processed" });
  const provider   = new AnchorProvider(connection, {} as any, {
    commitment:   "processed",
    skipPreflight: false,
  });
  const program    = new Program<GrasschainContractSpl>(
    idl as any,
    provider,
  );

  // 6) fetch on-chain status for each
  const out: ContractEntry[] = [];
  for (const { contract } of investors) {
    try {
      const pk   = new PublicKey(contract);
      const acct = await program.account.contract.fetch(pk);
      let st: ContractEntry["status"] = "not-started";
      if ("active" in acct.status)       st = "active";
      else if ("settled" in acct.status) st = "settled";
      else if ("defaulted" in acct.status) st = "defaulted";
      out.push({ contractId: contract, status: st });
    } catch {
      out.push({ contractId: contract, status: "not-started" });
    }
  }

  return NextResponse.json(out);
}
