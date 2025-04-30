// app/api/animals/[ranchId]/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: any) {
  const { ranchId } = params;

  const token = process.env.IXORIGUE_TOKEN;
  const baseUrl = process.env.IXORIGUE_API_URL || "https://api.ixorigue.com";

  if (!token) {
    return NextResponse.json({ error: "No token set" }, { status: 500 });
  }

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
