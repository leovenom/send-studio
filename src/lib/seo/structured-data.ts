import { getSiteUrl, siteConfig } from "@/lib/site";

export function getRootStructuredData() {
  const url = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${url}/#website`,
        url,
        name: siteConfig.name,
        description: siteConfig.description,
        inLanguage: ["pt-BR", "en"],
        publisher: { "@id": `${url}/#organization` },
      },
      {
        "@type": "Organization",
        "@id": `${url}/#organization`,
        name: siteConfig.name,
        url,
        description: siteConfig.description,
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${url}/#application`,
        name: siteConfig.name,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url,
        description: siteConfig.description,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        publisher: { "@id": `${url}/#organization` },
      },
    ],
  };
}

export function getBreadcrumbStructuredData(
  items: { name: string; path: string }[],
) {
  const url = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${url}${item.path}`,
    })),
  };
}
