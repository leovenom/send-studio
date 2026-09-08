import { createOgImageResponse, size, contentType } from "@/lib/seo/create-og-image-response";

export const alt = "Send Studio — Contacts";
export { size, contentType };

export default function OpenGraphImage() {
  return createOgImageResponse({
    title: "Contacts",
    subtitle: "Manage email, WhatsApp, and Telegram audiences with locale-aware CRM fields.",
    accent: "#5eead4",
    badge: "CRM",
  });
}
