import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Generate with AI",
  description:
    "Describe your email content and generate four visual template variations with AI or smart layouts.",
  path: "/templates/generate",
});

export default function GenerateTemplateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
