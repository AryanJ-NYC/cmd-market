-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('draft', 'published', 'reserved', 'sold', 'cancelled', 'expired');

-- CreateEnum
CREATE TYPE "AttributeValueType" AS ENUM ('text', 'number', 'boolean', 'enum', 'json');

-- AlterTable
ALTER TABLE "listing" ADD COLUMN     "category_id" TEXT,
ADD COLUMN     "closed_at" TIMESTAMP(3),
ADD COLUMN     "condition_code" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "display_currency_code" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "published_at" TIMESTAMP(3),
ADD COLUMN     "quantity_available" INTEGER,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "unit_price_minor" INTEGER;

-- Preserve existing listing status values when moving from text to enum
ALTER TABLE "listing" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "listing" ALTER COLUMN "status" TYPE "ListingStatus" USING ("status"::text::"ListingStatus");
ALTER TABLE "listing" ALTER COLUMN "status" SET DEFAULT 'draft';

-- CreateTable
CREATE TABLE "category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attribute_definition" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value_type" "AttributeValueType" NOT NULL,
    "unit_label" TEXT,
    "configuration_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attribute_definition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_attribute" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "attribute_definition_id" TEXT NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "is_filterable" BOOLEAN NOT NULL DEFAULT false,
    "is_sortable" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "allowed_values_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_attribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_attribute_value" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "category_attribute_id" TEXT NOT NULL,
    "value_text" TEXT,
    "value_number" DOUBLE PRECISION,
    "value_boolean" BOOLEAN,
    "value_json" JSONB,
    "normalized_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_attribute_value_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "category_slug_key" ON "category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "attribute_definition_key_key" ON "attribute_definition"("key");

-- CreateIndex
CREATE UNIQUE INDEX "category_attribute_category_id_attribute_definition_id_key" ON "category_attribute"("category_id", "attribute_definition_id");

-- CreateIndex
CREATE INDEX "listing_attribute_value_category_attribute_id_idx" ON "listing_attribute_value"("category_attribute_id");

-- CreateIndex
CREATE UNIQUE INDEX "listing_attribute_value_listing_id_category_attribute_id_key" ON "listing_attribute_value"("listing_id", "category_attribute_id");

-- CreateIndex
CREATE INDEX "listing_category_id_idx" ON "listing"("category_id");

-- AddForeignKey
ALTER TABLE "category_attribute" ADD CONSTRAINT "category_attribute_attribute_definition_id_fkey" FOREIGN KEY ("attribute_definition_id") REFERENCES "attribute_definition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_attribute" ADD CONSTRAINT "category_attribute_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing" ADD CONSTRAINT "listing_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_attribute_value" ADD CONSTRAINT "listing_attribute_value_category_attribute_id_fkey" FOREIGN KEY ("category_attribute_id") REFERENCES "category_attribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_attribute_value" ADD CONSTRAINT "listing_attribute_value_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed trading-card marketplace metadata for the first supported category
INSERT INTO "category" (
    "id",
    "slug",
    "name",
    "description",
    "sort_order",
    "is_active",
    "created_at",
    "updated_at"
) VALUES (
    'cat_cards',
    'trading-cards',
    'Trading Cards',
    'Graded and raw trading cards.',
    0,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

INSERT INTO "attribute_definition" (
    "id",
    "key",
    "label",
    "value_type",
    "unit_label",
    "configuration_json",
    "created_at",
    "updated_at"
) VALUES
(
    'attr_grading_company',
    'grading_company',
    'Grading Company',
    'enum',
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'attr_grade',
    'grade',
    'Grade',
    'number',
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

INSERT INTO "category_attribute" (
    "id",
    "category_id",
    "attribute_definition_id",
    "is_required",
    "is_filterable",
    "is_sortable",
    "sort_order",
    "allowed_values_json",
    "created_at",
    "updated_at"
) VALUES
(
    'catattr_cards_grading_company',
    'cat_cards',
    'attr_grading_company',
    true,
    true,
    false,
    0,
    '["psa","bgs","cgc"]'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'catattr_cards_grade',
    'cat_cards',
    'attr_grade',
    true,
    false,
    false,
    1,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
