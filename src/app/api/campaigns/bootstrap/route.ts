import { jsonList } from "@/lib/api-list-response";
import { getCampaignsBootstrap } from "@/lib/list-queries";

/** One round-trip for /campaigns — avoids 4 cold starts on Vercel. */
export async function GET() {
  return jsonList(await getCampaignsBootstrap());
}
