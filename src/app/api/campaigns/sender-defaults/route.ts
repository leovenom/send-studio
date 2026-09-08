import { NextResponse } from "next/server";
import { getDefaultSenders } from "@/lib/messaging/campaign-sender";

export async function GET() {
  return NextResponse.json(getDefaultSenders());
}
