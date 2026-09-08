import { NextRequest, NextResponse } from "next/server";
import { getAnalytics } from "@/lib/queries";

export async function GET(req: NextRequest) {
  const campaignId = req.nextUrl.searchParams.get("campaignId") ?? undefined;
  const id = campaignId && campaignId !== "all" ? campaignId : undefined;
  const analytics = await getAnalytics(id);
  return NextResponse.json(analytics);
}
