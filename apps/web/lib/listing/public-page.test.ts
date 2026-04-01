import { describe, expect, test } from "vitest";
import { buildPublicListingMetadata, buildPublicListingPageModel } from "./public-page";
import type { PublicListingResource } from "./service";

describe("listing/public-page", () => {
  test("builds the listing page model from a published listing resource", () => {
    const model = buildPublicListingPageModel(createPublicListingResource());

    expect(model).toMatchObject({
      categoryName: "Trading Cards",
      condition: "used good",
      description: "Clean slab, no cracks, centered well.",
      price: "$1,250.00",
      quantityAvailable: 1,
      sellerName: "Scarce City",
      shareUrl: "https://cmd.market/listings/lst_123",
      status: "published",
      title: "1999 Charizard Holo PSA 8",
    });
    expect(model.images).toEqual([
      {
        alt: "Front photo",
        caption: "Front photo",
        id: "med_123",
        url: "https://cmd.market/listings/lst_123/media/med_123",
      },
    ]);
    expect(model.attributes).toEqual([
      {
        key: "grade",
        label: "Grade",
        value: "8",
      },
    ]);
  });

  test("builds canonical metadata for sharing", () => {
    const metadata = buildPublicListingMetadata(createPublicListingResource());

    expect(metadata).toMatchObject({
      alternates: {
        canonical: "https://cmd.market/listings/lst_123",
      },
      description: "Clean slab, no cracks, centered well.",
      openGraph: {
        title: "1999 Charizard Holo PSA 8 | CMD Market",
        url: "https://cmd.market/listings/lst_123",
      },
      title: "1999 Charizard Holo PSA 8 | CMD Market",
    });
  });
});

function createPublicListingResource(): PublicListingResource {
  return {
    attributes: [
      {
        key: "grade",
        label: "Grade",
        value: 8,
        valueType: "number",
      },
    ],
    category: {
      id: "cat_cards",
      name: "Trading Cards",
      slug: "trading-cards",
    },
    conditionCode: "used_good",
    description: "Clean slab, no cracks, centered well.",
    id: "lst_123",
    listingUrl: "https://cmd.market/listings/lst_123",
    media: [
      {
        altText: "Front photo",
        id: "med_123",
        sortOrder: 0,
        url: "https://cmd.market/listings/lst_123/media/med_123",
      },
    ],
    object: "listing",
    price: {
      amountMinor: 125000,
      currencyCode: "USD",
    },
    publishedAt: "2026-03-30T20:00:00.000Z",
    quantityAvailable: 1,
    seller: {
      displayName: "Scarce City",
      id: "sel_123",
      slug: "scarce-city",
    },
    status: "published",
    title: "1999 Charizard Holo PSA 8",
    updatedAt: "2026-03-30T20:00:00.000Z",
  };
}
