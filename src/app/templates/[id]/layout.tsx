import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Template Editor",
  description: "Edit email templates with blocks, Liquid variables, and live multi-channel preview.",
  path: "/templates",
});

export default function TemplateEditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
