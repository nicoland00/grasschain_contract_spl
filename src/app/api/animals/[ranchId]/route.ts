import { NextResponse } from "next/server";
import { getRefreshedIxorigueToken } from "@/utils/ixorigue-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: any) {
  const { ranchId } = params;
  const baseUrl = process.env.IXORIGUE_API_URL!;

  // 1) Refrescar el access token
  const token = await getRefreshedIxorigueToken();

  // 2) Llamar a Ixorigue con el nuevo token
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
  return NextResponse.json(data);
}
