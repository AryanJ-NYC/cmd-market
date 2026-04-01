-- CreateEnum
CREATE TYPE "OpenClawAuthorizationSessionStatus" AS ENUM ('pending', 'authorized', 'rejected', 'cancelled', 'expired', 'redeemed');

-- CreateTable
CREATE TABLE "openclaw_authorization_session" (
    "id" TEXT NOT NULL,
    "browser_token_hash" TEXT NOT NULL,
    "exchange_code_hash" TEXT NOT NULL,
    "status" "OpenClawAuthorizationSessionStatus" NOT NULL,
    "organization_id" TEXT,
    "authorized_by_user_id" TEXT,
    "failure_code" TEXT,
    "failure_message" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "authorized_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "expired_at" TIMESTAMP(3),
    "redeemed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "openclaw_authorization_session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "openclaw_authorization_session_browser_token_hash_key" ON "openclaw_authorization_session"("browser_token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "openclaw_authorization_session_exchange_code_hash_key" ON "openclaw_authorization_session"("exchange_code_hash");

-- CreateIndex
CREATE INDEX "openclaw_authorization_session_organization_id_idx" ON "openclaw_authorization_session"("organization_id");

-- CreateIndex
CREATE INDEX "openclaw_authorization_session_status_idx" ON "openclaw_authorization_session"("status");

-- CreateIndex
CREATE INDEX "openclaw_authorization_session_expires_at_idx" ON "openclaw_authorization_session"("expires_at");

-- AddForeignKey
ALTER TABLE "openclaw_authorization_session" ADD CONSTRAINT "openclaw_authorization_session_authorized_by_user_id_fkey" FOREIGN KEY ("authorized_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "openclaw_authorization_session" ADD CONSTRAINT "openclaw_authorization_session_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
