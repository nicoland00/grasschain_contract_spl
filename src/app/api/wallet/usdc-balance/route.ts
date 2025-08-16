// PRIVY:
import { NextResponse } from "next/server";
// TODO: usa tu RPC o servicio ya existente para leer balance SPL USDC del address
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");
  if (!address) return NextResponse.json({ balance: 0 }, { status: 400 });
  // Implementación mínima temporal (reemplaza por lectura real):
  // const balance = await getUsdcBalance(address);
  const balance = 0;
  return NextResponse.json({ balance });
}
