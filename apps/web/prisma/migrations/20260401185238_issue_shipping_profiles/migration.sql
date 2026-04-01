-- AlterTable
ALTER TABLE "listing" ADD COLUMN     "shipping_profile_id" TEXT;

-- CreateTable
CREATE TABLE "shipping_profile" (
    "id" TEXT NOT NULL,
    "seller_account_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domestic_rate_minor" INTEGER NOT NULL,
    "handling_time_days" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipping_profile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shipping_profile_seller_account_id_idx" ON "shipping_profile"("seller_account_id");

-- CreateIndex
CREATE INDEX "listing_shipping_profile_id_idx" ON "listing"("shipping_profile_id");

-- AddForeignKey
ALTER TABLE "listing" ADD CONSTRAINT "listing_shipping_profile_id_fkey" FOREIGN KEY ("shipping_profile_id") REFERENCES "shipping_profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipping_profile" ADD CONSTRAINT "shipping_profile_seller_account_id_fkey" FOREIGN KEY ("seller_account_id") REFERENCES "seller_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
