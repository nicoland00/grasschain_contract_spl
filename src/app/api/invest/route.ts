// PRIVY:
import { NextResponse } from "next/server";
// TODO: inyecta aquí tu lógica actual de SC: verificar balance, construir y enviar tx
// o devolver una tx a firmar en cliente si ya usas signer de Privy.

export async function POST(req: Request) {
  const body = await req.json();
  const { address, amount, contractId } = body || {};
  if (!address) return NextResponse.json({ ok:false, error:"missing address" }, { status: 400 });

  // 1) Verifica balance real (server) si quieres seguridad extra.
  // 2) Construye y envía tx contra tu SC existente.
  // 3) Guarda en DB { userId/email/address, contractId, amount, txSig }.
  // 4) Devuelve { ok:true, txSig }.

  return NextResponse.json({ ok:true, txSig:"TODO" });
}
