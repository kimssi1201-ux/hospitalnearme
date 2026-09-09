export const SITE_ORIGIN = "https://view1.kr";
export const SITE_NAME = "VIEW1";
export const ADSENSE_PUBLISHER_ID = "ca-pub-5751319666030430";

export function absoluteUrl(pathname = "/") {
  if (/^https?:\/\//i.test(pathname)) return pathname;
  return `${SITE_ORIGIN}${String(pathname || "/").startsWith("/") ? "" : "/"}${pathname || ""}`;
}

export function campaignCanonical(campaign) {
  return absoluteUrl(`/event/${campaign.slug}/`);
}

export function campaignTitle(campaign) {
  return `${campaign.title} | ${SITE_NAME}`;
}

export function webPageSchema({ title, description, url }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url
  };
}

export function breadcrumbSchema(items = []) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.url)
    }))
  };
}
