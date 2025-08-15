// src/app/api/my-contracts/route.ts
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import FiatInvestor from "@/models/tracking/FiatInvestor";
import CryptoInvestor from "@/models/tracking/CryptoInvestor";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import idl from "../../../../anchor/target/idl/grasschain_contract_spl.json";
import { GrasschainContractSpl } from "../../../../anchor/target/types/grasschain_contract_spl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ContractEntry {
  contractId: string;
  status: "not-started" | "active" | "settled" | "defaulted";
  ranchId?: string;
  lotId?: string;
  farmName?: string;
}

export async function POST(req: Request) {
  await dbConnect();
  const { email, address } = await req.json();

  if (!email && !address) {
    return NextResponse.json({ error: "No identity" }, { status: 401 });
  }

  let investors: { contract: string; ranchId?: string; lotId?: string }[] = [];
  if (email) {
    const fis = await FiatInvestor.find({ email }, "contract ranchId lotId").lean();
    investors = investors.concat(
      fis.map((fi) => ({ contract: fi.contract, ranchId: fi.ranchId, lotId: (fi as any).lotId }))
    );
  }
  if (address) {
    const cis = await CryptoInvestor.find({ investor: address }, "contract ranchId lotId").lean();
    investors = investors.concat(
      cis.map((ci) => ({ contract: ci.contract, ranchId: ci.ranchId, lotId: (ci as any).lotId }))
    );
  }

  const RPC = process.env.SOLANA_RPC!;
  const connection = new Connection(RPC, { commitment: "processed" });
  const provider = new AnchorProvider(connection, {} as any, { commitment: "processed" });
  const program = new Program<GrasschainContractSpl>(idl as any, provider);

  const out: ContractEntry[] = [];
  for (const { contract, ranchId, lotId } of investors) {
    try {
      const pk = new PublicKey(contract);
      const acct = await program.account.contract.fetch(pk);
      let st: ContractEntry["status"] = "not-started";
      if ("active" in acct.status) st = "active";
      else if ("settled" in acct.status) st = "settled";
      else if ("defaulted" in acct.status) st = "defaulted";
      out.push({ contractId: contract, status: st, ranchId, lotId, farmName: acct.farmName });
    } catch {
      out.push({ contractId: contract, status: "not-started", ranchId, lotId });
    }
  }

  return NextResponse.json(out);
}
