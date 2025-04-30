// src/app/api/ranches/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/dbConnect";
import FiatInvestor from "@/models/tracking/FiatInvestor";
import CryptoInvestor from "@/models/tracking/CryptoInvestor";

export const runtime = "nodejs";

export async function GET(req: Request) {
  // 1) Comprueba sesión
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json(
      { error: "No autenticado" },
      { status: 401 }
    );
  }

  // 2) Conecta Mongo
  try {
    await dbConnect();
  } catch (e: any) {
    console.error("dbConnect error:", e);
    return NextResponse.json(
      { error: "Error conectando a base de datos" },
      { status: 500 }
    );
  }

  // 3) Decide modelo según método de login
  let result: any = null;
  if (session.user?.email?.endsWith("@gmail.com")) {
    // Usuario "Fiat" (Google/Gmail)
    result = await FiatInvestor
      .find({ email: session.user.email })
      .lean();
  } else {
    // Usuario "Crypto": esperamos que la wallet address venga como parámetro
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get("wallet");
    if (!wallet) {
      return NextResponse.json(
        { error: "Debe proporcionar ?wallet=TU_DIRECCIÓN" },
        { status: 400 }
      );
    }
    result = await CryptoInvestor
      .find({ investor: wallet })
      .lean();
  }

  // 4) Si no hay datos, 404
  if (!result || (Array.isArray(result) && result.length === 0)) {
    return NextResponse.json(
      { error: "No se encontraron registros" },
      { status: 404 }
    );
  }

  // 5) Devuelve resultados
  return NextResponse.json(result);
}
