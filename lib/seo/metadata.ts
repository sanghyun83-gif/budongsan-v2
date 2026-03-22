import type { Metadata } from "next";

export const SITE_ORIGIN = "https://saljip.kr";
export const DEFAULT_OG_IMAGE = "https://saljip.kr/og-default.png";

function joinCanonical(path: string): string {
  if (!path) return SITE_ORIGIN;
  return `${SITE_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}

function withBrand(title: string): string {
  if (title.includes("| 살집")) return title;
  return `${title} | 살집`;
}

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  ogDescription?: string;
};

export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const canonical = joinCanonical(input.path);
  const socialTitle = withBrand(input.title);
  const ogDescription = input.ogDescription ?? input.description;

  return {
    title: input.title,
    description: input.description,
    alternates: { canonical },
    openGraph: {
      title: socialTitle,
      description: ogDescription,
      url: canonical,
      type: "website",
      siteName: "살집",
      locale: "ko_KR",
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: "살집" }]
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: input.description,
      images: [DEFAULT_OG_IMAGE]
    }
  };
}
