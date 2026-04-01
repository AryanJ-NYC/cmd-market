import type { Metadata } from "next";
import type { PublicListingResource } from "./service";

export function buildPublicListingPageModel(listing: PublicListingResource) {
  return {
    attributes: listing.attributes.map((attribute) => ({
      key: attribute.key,
      label: attribute.label,
      value: formatAttributeValue(attribute.value),
    })),
    categoryName: listing.category?.name ?? null,
    description: listing.description,
    images: listing.media.map((item) => ({
      alt: item.altText ?? listing.title ?? "Listing image",
      caption: item.altText,
      id: item.id,
      url: item.url,
    })),
    price: formatPrice(listing.price),
    publishedAt: listing.publishedAt ? formatDateTime(listing.publishedAt) : null,
    quantityAvailable: listing.quantityAvailable ?? "Unknown",
    sellerName: listing.seller.displayName,
    shareUrl: listing.listingUrl,
    status: formatToken(listing.status),
    title: listing.title ?? "Untitled Listing",
    condition: listing.conditionCode ? formatToken(listing.conditionCode) : null,
  };
}

export function buildPublicListingMetadata(listing: PublicListingResource): Metadata {
  const title = `${listing.title ?? "Listing"} | CMD Market`;
  const description = listing.description ?? "Published CMD Market listing.";
  const firstImage = listing.media[0]?.url;

  return {
    alternates: {
      canonical: listing.listingUrl,
    },
    description,
    openGraph: {
      description,
      images: firstImage ? [{ url: firstImage }] : undefined,
      title,
      url: listing.listingUrl,
    },
    title,
  };
}

function formatPrice(price: {
  amountMinor: number;
  currencyCode: string;
} | null) {
  if (!price) {
    return "Price unavailable";
  }

  return new Intl.NumberFormat("en-US", {
    currency: price.currencyCode,
    style: "currency",
  }).format(price.amountMinor / 100);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatAttributeValue(value: boolean | number | string | Record<string, unknown> | unknown[]) {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return JSON.stringify(value);
}

function formatToken(value: string) {
  return value
    .split("_")
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}
