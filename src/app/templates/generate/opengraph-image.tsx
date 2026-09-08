import { createOgImageResponse, size, contentType } from "@/lib/seo/create-og-image-response";

export const alt = "Send Studio — AI Templates";
export { size, contentType };

export default function OpenGraphImage() {
  return createOgImageResponse({
    title: "AI template generation",
    subtitle: "Generate multichannel campaign drafts from a brief — then refine in the block editor.",
    accent: "#f472b6",
    badge: "AI",
  });
}
