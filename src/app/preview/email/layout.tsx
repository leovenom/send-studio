import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Email preview",
  description: "Full-screen responsive email preview for Send Studio templates.",
  path: "/preview/email",
});

export default function PreviewEmailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
