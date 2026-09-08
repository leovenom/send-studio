import { createOgImageResponse, size, contentType } from "@/lib/seo/create-og-image-response";

export const alt = "Send Studio — Campaigns";
export { size, contentType };

export default function OpenGraphImage() {
  return createOgImageResponse({
    title: "Campaigns",
    subtitle: "Send email via Resend plus WhatsApp and Telegram from one multichannel workflow.",
    accent: "#8ec5ff",
    badge: "Send",
  });
}
