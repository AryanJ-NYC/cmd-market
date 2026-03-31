ALTER TABLE "openclaw_authorization_session"
ADD COLUMN "code_challenge" TEXT NOT NULL DEFAULT '',
ADD COLUMN "code_challenge_method" TEXT NOT NULL DEFAULT 'S256';

DROP INDEX "openclaw_authorization_session_exchange_code_hash_key";

ALTER TABLE "openclaw_authorization_session"
DROP COLUMN "exchange_code_hash",
ALTER COLUMN "code_challenge" DROP DEFAULT,
ALTER COLUMN "code_challenge_method" DROP DEFAULT;
