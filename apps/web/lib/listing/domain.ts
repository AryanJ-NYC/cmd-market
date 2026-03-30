export function getDraftListingValidation({
  eligibilityStatus,
  listing
}: GetDraftListingValidationInput): DraftListingValidationResult {
  const issues: DraftListingValidationIssue[] = [];

  if (eligibilityStatus !== "eligible") {
    issues.push({
      code: "seller_not_eligible",
      field: "seller",
      message: "Seller workspace is not eligible to publish listings."
    });
  }

  if (listing.media.length < 1) {
    issues.push({
      code: "minimum_items_not_met",
      field: "media",
      message: "At least one image is required."
    });
  }

  if (!listing.category) {
    issues.push({
      code: "required",
      field: "category",
      message: "Category is required."
    });
  }

  if (!hasValue(listing.title)) {
    issues.push({
      code: "required",
      field: "title",
      message: "Title is required."
    });
  }

  if (!hasValue(listing.description)) {
    issues.push({
      code: "required",
      field: "description",
      message: "Description is required."
    });
  }

  if (!hasValue(listing.conditionCode)) {
    issues.push({
      code: "required",
      field: "condition_code",
      message: "Condition code is required."
    });
  }

  if (listing.quantityAvailable == null) {
    issues.push({
      code: "required",
      field: "quantity_available",
      message: "Quantity available is required."
    });
  } else if (listing.quantityAvailable <= 0) {
    issues.push({
      code: "invalid",
      field: "quantity_available",
      message: "Quantity available must be greater than zero."
    });
  }

  if (listing.unitPriceMinor == null) {
    issues.push({
      code: "required",
      field: "price.amount_minor",
      message: "Price amount is required."
    });
  } else if (listing.unitPriceMinor <= 0) {
    issues.push({
      code: "invalid",
      field: "price.amount_minor",
      message: "Price amount must be greater than zero."
    });
  }

  if (requiresTradingCardAttributes(listing.category)) {
    const attributeKeys = new Set(listing.attributes.map((attribute) => attribute.key));

    if (!attributeKeys.has("grading_company")) {
      issues.push({
        code: "required",
        field: "attributes.grading_company",
        message: "Grading Company is required for this category."
      });
    }

    if (!attributeKeys.has("grade")) {
      issues.push({
        code: "required",
        field: "attributes.grade",
        message: "Grade is required for this category."
      });
    }
  }

  return {
    issues,
    publishable: issues.length === 0
  };
}

export function createListingValidationProblem({
  errors,
  instance
}: CreateListingValidationProblemInput): ListingValidationProblem {
  return {
    code: "listing_validation_failed",
    detail: "The listing cannot be published until required fields are complete.",
    errors,
    instance,
    status: 422,
    title: "Listing validation failed",
    type: "https://cmd.market/problems/listing-validation-failed"
  };
}

function requiresTradingCardAttributes(category: DraftListingValidationInput["category"]) {
  return category?.id === "cat_cards" || category?.slug === "trading-cards";
}

function hasValue(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

type GetDraftListingValidationInput = {
  eligibilityStatus: "eligible" | "pending" | "revoked" | "suspended";
  listing: DraftListingValidationInput;
};

type DraftListingValidationInput = {
  attributes: Array<{
    key: string;
    label: string;
    value: boolean | number | string | Record<string, unknown> | unknown[];
    valueType: "boolean" | "enum" | "json" | "number" | "text";
  }>;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  conditionCode: string | null;
  description: string | null;
  media: Array<{
    altText: string | null;
    assetKey: string;
    assetType: string;
    createdAt: Date;
    id: string;
    sortOrder: number;
  }>;
  quantityAvailable: number | null;
  title: string | null;
  unitPriceMinor: number | null;
};

type CreateListingValidationProblemInput = {
  errors: DraftListingValidationIssue[];
  instance: string;
};

export type DraftListingValidationResult = {
  issues: DraftListingValidationIssue[];
  publishable: boolean;
};

export type DraftListingValidationIssue = {
  code: string;
  field: string;
  message: string;
};

export type ListingValidationProblem = {
  code: "listing_validation_failed";
  detail: string;
  errors: DraftListingValidationIssue[];
  instance: string;
  status: 422;
  title: "Listing validation failed";
  type: "https://cmd.market/problems/listing-validation-failed";
};
