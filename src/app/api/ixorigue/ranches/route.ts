// src/app/api/ixorigue/ranches/route.ts
import { NextResponse } from "next/server";
import { getRefreshedIxorigueToken } from "@/utils/ixorigue-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const baseUrl = process.env.IXORIGUE_API_URL!;
  const token = await getRefreshedIxorigueToken();

  const res = await fetch(`${baseUrl}/api/Ranches`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    return NextResponse.json(
      { error: `Ixorigue ranches error: ${res.status}` },
      { status: 500 }
    );
  }
  const data = await res.json();
  return NextResponse.json(data);
}
