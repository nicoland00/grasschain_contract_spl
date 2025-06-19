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

  // filter to animals in the requested lot with a recent location
  const cutoff = Date.now() - 1000 * 60 * 60 * 24 * 2; // 2 days ago
  const filtered = (data.data || []).filter((a: any) => {
    if (a.lot?.lotId !== lotId) return false;
    if (!a.lastLocationTimestamp || !a.lastLocation) return false;
    const ts = new Date(a.lastLocationTimestamp).getTime();
    return ts >= cutoff;
  });

  return NextResponse.json({ data: filtered });
}