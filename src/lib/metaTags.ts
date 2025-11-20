/**
 * Dynamic Meta Tags Management
 * Updates meta tags dynamically for SEO
 */

export type MetaTagData = {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  keywords?: string[];
};

/**
 * Update meta tags dynamically
 */
export function updateMetaTags(data: MetaTagData): void {
  if (typeof document === "undefined") return;

  const { title, description, image, url, type = "website", keywords } = data;

  // Update title
  if (title) {
    document.title = title;
    updateMetaTag("property", "og:title", title);
    updateMetaTag("name", "twitter:title", title);
  }

  // Update description
  if (description) {
    updateMetaTag("name", "description", description);
    updateMetaTag("property", "og:description", description);
    updateMetaTag("name", "twitter:description", description);
  }

  // Update image
  if (image) {
    updateMetaTag("property", "og:image", image);
    updateMetaTag("name", "twitter:image", image);
  }

  // Update URL
  if (url) {
    updateMetaTag("property", "og:url", url);
    updateMetaTag("name", "twitter:url", url);
  }

  // Update type
  updateMetaTag("property", "og:type", type);

  // Update keywords
  if (keywords && keywords.length > 0) {
    updateMetaTag("name", "keywords", keywords.join(", "));
  }
}

/**
 * Helper to update or create meta tag
 */
function updateMetaTag(attribute: "name" | "property", value: string, content: string): void {
  if (typeof document === "undefined") return;

  let meta = document.querySelector(`meta[${attribute}="${value}"]`) as HTMLMetaElement;

  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attribute, value);
    document.head.appendChild(meta);
  }

  meta.setAttribute("content", content);
}

/**
 * Reset meta tags to default
 */
export function resetMetaTags(): void {
  updateMetaTags({
    title: "NOP Intelligence Layer — SocialFi Platform | On-Chain Trading Intelligence",
    description:
      "Decentralized SocialFi intelligence platform. Contribute insights, earn rewards, and track crypto market trends in real-time. Non-custodial, on-chain verified trading positions.",
    image: "https://nop-intelligence.com/og-image.png",
    url: "https://nop-intelligence.com",
    type: "website",
    keywords: [
      "SocialFi",
      "DeFi",
      "crypto trading",
      "on-chain intelligence",
      "NOP token",
      "trading signals",
      "copy trading",
      "blockchain",
      "Web3",
      "cryptocurrency",
      "investment pools",
      "alpha trading",
    ],
  });
}

