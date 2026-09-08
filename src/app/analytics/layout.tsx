import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Analytics",
  description:
    "Email delivery analytics — opens, clicks, bounces, and human vs bot classification via Resend webhooks.",
  path: "/analytics",
});

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
