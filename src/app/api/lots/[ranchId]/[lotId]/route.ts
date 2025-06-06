import { NextResponse } from "next/server";
import { getRefreshedIxorigueToken } from "@/utils/ixorigue-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: any) {
  const { ranchId, lotId } = params;
  const baseUrl = process.env.IXORIGUE_API_URL!;

  // 1) Refresh the access token
  const token = await getRefreshedIxorigueToken();

  // 2) Call Ixorigue with the new token
  const res = await fetch(`${baseUrl}/api/AnimalsLots/${ranchId}/${lotId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    return NextResponse.json(
      { error: `Ixorigue lot animals error: ${res.status}` },
      { status: 500 }
    );
  }
  const data = await res.json();
  return NextResponse.json(data);
}