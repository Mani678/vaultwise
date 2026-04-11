// app/api/portfolio/route.ts
// Server-side proxy for LI.FI Earn portfolio API — avoids CORS

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");

  if (!address) {
    return NextResponse.json({ positions: [] });
  }

  try {
    const res = await fetch(
      `https://earn.li.fi/v1/earn/portfolio/${address}/positions`,
      { headers: { "Content-Type": "application/json" } }
    );

    if (!res.ok) return NextResponse.json({ positions: [] });

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ positions: [] });
  }
}