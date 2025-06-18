import { NextResponse } from "next/server";
import { getRefreshedIxorigueToken } from "@/utils/ixorigue-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: any) {
  const { ranchId, lotId } = params;
  const baseUrl = process.env.IXORIGUE_API_URL!;

  // 1) Refresh the access token
  const token = await getRefreshedIxorigueToken();
  // 2) Call Ixorigue for *all* ranch animals and filter by lotId
  const res = await fetch(`${baseUrl}/api/Animals/${ranchId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    return NextResponse.json(
      { error: `Ixorigue animals error: ${res.status}` },
      { status: 500 }
    );
  }
  const data = await res.json();

  const filtered = (data.data || []).filter((a: any) => a.lot?.lotId === lotId);

  return NextResponse.json({ data: filtered });
}