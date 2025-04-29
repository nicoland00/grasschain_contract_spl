// src/app/api/my-contracts/route.ts
import { NextResponse }        from "next/server";
import { getServerSession }    from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect               from "@/lib/tracking/dbConnect";
import FiatInvestor            from "@/models/tracking/FiatInvestor";
import CryptoInvestor          from "@/models/tracking/CryptoInvestor";

// Anchor server-side:
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import idl                        from "../../../../anchor/target/idl/grasschain_contract_spl.json";
import { GrasschainContractSpl }  from "../../../../anchor/target/types/grasschain_contract_spl";

const RPC = process.env.SOLANA_RPC!;
const PROG = process.env.PROGRAM_ID!;
const connection = new Connection(RPC, { commitment: "processed" });
const provider   = new AnchorProvider(connection, {} as any, { commitment: "processed", skipPreflight: false });
const program    = new Program<GrasschainContractSpl>(idl as any, provider);

export const runtime = "nodejs";

interface ContractEntry {
  contractId: string;
  status:     "not-started" | "active" | "settled" | "defaulted";
}

export async function GET(req: Request) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  const email   = session?.user?.email;
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet");

  let investors: { contract: string }[] = [];
  if (email) {
    const fis = await FiatInvestor.find({ email }, "contract").lean();
    investors = fis.map(fi => ({ contract: fi.contract }));
  } else if (wallet) {
    const cis = await CryptoInvestor.find({ investor: wallet }, "contract").lean();
    investors = cis.map(ci => ({ contract: ci.contract }));
  } else {
    return NextResponse.json({ error: "No wallet or session" }, { status: 401 });
  }

  const out: ContractEntry[] = [];
  for (const inv of investors) {
    try {
      const pk = new PublicKey(inv.contract);
      const acct = await program.account.contract.fetch(pk);
      // acct.status será un object con la variante activa:
      let st: ContractEntry["status"] = "not-started";
      if ("active" in acct.status)       st = "active";
      else if ("settled" in acct.status) st = "settled";
      else if ("defaulted" in acct.status) st = "defaulted";
      else st = "not-started";
      out.push({ contractId: inv.contract, status: st });
    } catch {
      // si falla fetch on-chain, lo marcamos no-started
      out.push({ contractId: inv.contract, status: "not-started" });
    }
  }

  return NextResponse.json(out);
}
