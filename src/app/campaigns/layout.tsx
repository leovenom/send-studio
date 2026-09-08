import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Campaigns",
  description:
    "Send multi-channel campaigns via Resend email, WhatsApp, or Telegram to your contacts.",
  path: "/campaigns",
});

export default function CampaignsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
