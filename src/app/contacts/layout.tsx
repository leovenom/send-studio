import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "Contacts",
  description:
    "Manage email, WhatsApp, and Telegram contacts. Import CSV and organize your audience for campaigns.",
  path: "/contacts",
});

export default function ContactsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
