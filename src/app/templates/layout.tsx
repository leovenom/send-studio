import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Templates",
  description:
    "Visual email template editor with drag-and-drop blocks, Liquid logic, and multi-locale content.",
  path: "/templates",
});

export default function TemplatesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
