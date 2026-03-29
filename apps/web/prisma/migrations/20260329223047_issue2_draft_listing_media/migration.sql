-- CreateTable
CREATE TABLE "listing" (
    "id" TEXT NOT NULL,
    "seller_account_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_by_user_id" TEXT,
    "created_by_api_key_id" TEXT,
    "updated_by_user_id" TEXT,
    "updated_by_api_key_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_media" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "asset_key" TEXT NOT NULL,
    "asset_type" TEXT NOT NULL,
    "alt_text" TEXT,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "listing_seller_account_id_idx" ON "listing"("seller_account_id");

-- CreateIndex
CREATE INDEX "listing_media_listing_id_idx" ON "listing_media"("listing_id");

-- CreateIndex
CREATE UNIQUE INDEX "listing_media_listing_id_asset_key_key" ON "listing_media"("listing_id", "asset_key");

-- AddForeignKey
ALTER TABLE "listing" ADD CONSTRAINT "listing_created_by_api_key_id_fkey" FOREIGN KEY ("created_by_api_key_id") REFERENCES "apikey"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing" ADD CONSTRAINT "listing_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing" ADD CONSTRAINT "listing_seller_account_id_fkey" FOREIGN KEY ("seller_account_id") REFERENCES "seller_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing" ADD CONSTRAINT "listing_updated_by_api_key_id_fkey" FOREIGN KEY ("updated_by_api_key_id") REFERENCES "apikey"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing" ADD CONSTRAINT "listing_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_media" ADD CONSTRAINT "listing_media_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
