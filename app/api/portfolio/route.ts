// app/api/portfolio/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (!address) return NextResponse.json({ positions: [] });

  try {
    const res = await fetch(
      `https://earn.li.fi/v1/portfolio/${address}/positions`,
      {
        headers: {
          "Content-Type": "application/json",
          "x-lifi-api-key": process.env.LIFI_API_KEY ?? "",
        },
      }
    );
    if (!res.ok) return NextResponse.json({ positions: [] });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ positions: [] });
  }
}
