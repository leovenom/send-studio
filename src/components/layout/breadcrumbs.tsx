"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { useT } from "@/components/locale/locale-provider";
import { JsonLd } from "@/components/seo/json-ld";
import { getBreadcrumbStructuredData } from "@/lib/seo/structured-data";
import { cn } from "@/lib/utils";

type Crumb = { label: string; href: string };

function buildCrumbs(pathname: string, t: ReturnType<typeof useT>): Crumb[] {
  const crumbs: Crumb[] = [{ label: t("nav.dashboard"), href: "/" }];

  if (pathname === "/") return crumbs;

  if (pathname.startsWith("/contacts")) {
    crumbs.push({ label: t("nav.contacts"), href: "/contacts" });
    return crumbs;
  }

  if (pathname.startsWith("/templates")) {
    crumbs.push({ label: t("nav.templates"), href: "/templates" });
    if (pathname === "/templates/generate") {
      crumbs.push({ label: t("generate.title"), href: "/templates/generate" });
    } else if (pathname !== "/templates") {
      crumbs.push({ label: t("editor.label"), href: pathname });
    }
    return crumbs;
  }

  if (pathname.startsWith("/campaigns")) {
    crumbs.push({ label: t("nav.campaigns"), href: "/campaigns" });
    return crumbs;
  }

  if (pathname.startsWith("/analytics")) {
    crumbs.push({ label: t("nav.analytics"), href: "/analytics" });
    return crumbs;
  }

  return crumbs;
}

export function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname();
  const t = useT();
  const crumbs = buildCrumbs(pathname, t);

  if (crumbs.length <= 1 && pathname === "/") return null;

  const schemaItems = crumbs.map((c) => ({ name: c.label, path: c.href }));

  return (
    <>
      <JsonLd data={getBreadcrumbStructuredData(schemaItems)} />
      <nav
        aria-label="Breadcrumb"
        className={cn("mb-6 flex flex-wrap items-center gap-1 text-sm", className)}
      >
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <span key={crumb.href} className="flex items-center gap-1">
              {i > 0 && (
                <ChevronRight className="h-3.5 w-3.5 text-muted" aria-hidden />
              )}
              {isLast ? (
                <span className="font-medium text-foreground" aria-current="page">
                  {i === 0 && <Home className="mr-1 inline h-3.5 w-3.5 opacity-70" />}
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-muted transition-colors hover:text-[#2563eb] dark:hover:text-[#8ec5ff]"
                >
                  {i === 0 && <Home className="mr-1 inline h-3.5 w-3.5 opacity-70" />}
                  {crumb.label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>
    </>
  );
}
