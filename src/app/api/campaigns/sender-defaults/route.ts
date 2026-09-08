import { jsonList } from "@/lib/api-list-response";
import { getDefaultSenders } from "@/lib/messaging/campaign-sender";

export async function GET() {
  return jsonList(getDefaultSenders());
}
