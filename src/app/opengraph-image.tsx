import { siteConfig } from "@/lib/site";
import { createOgImageResponse, size, contentType } from "@/lib/seo/create-og-image-response";

export const alt = siteConfig.title;
export { size, contentType };

export default function OpenGraphImage() {
  return createOgImageResponse({
    title: "Email CRM for modern teams",
    subtitle: "Templates, campaigns, and delivery analytics — powered by Resend",
    badge: "Portfolio demo",
  });
}
