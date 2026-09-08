import { createOgImageResponse, size, contentType } from "@/lib/seo/create-og-image-response";

export const alt = "Send Studio — Templates";
export { size, contentType };

export default function OpenGraphImage() {
  return createOgImageResponse({
    title: "Templates",
    subtitle: "Block editor with Liquid, i18n, and previews for email, WhatsApp, and Telegram.",
    accent: "#a78bfa",
    badge: "Editor",
  });
}
