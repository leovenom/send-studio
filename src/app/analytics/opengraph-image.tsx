import { createOgImageResponse, size, contentType } from "@/lib/seo/create-og-image-response";

export const alt = "Send Studio — Analytics";
export { size, contentType };

export default function OpenGraphImage() {
  return createOgImageResponse({
    title: "Analytics",
    subtitle: "Resend webhook funnel with opens, clicks, bounces, and human vs bot classification.",
    accent: "#34d399",
    badge: "Metrics",
  });
}
