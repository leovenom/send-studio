import { NextRequest, NextResponse } from "next/server";
import { analyticsToCsv, exportFilename } from "@/lib/analytics/export";
import { getAnalytics } from "@/lib/queries";

export async function GET(req: NextRequest) {
  const campaignId = req.nextUrl.searchParams.get("campaignId") ?? undefined;
  const id = campaignId && campaignId !== "all" ? campaignId : undefined;
  const analytics = await getAnalytics(id);
  const csv = analyticsToCsv(analytics);
  const filename = exportFilename(analytics);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
