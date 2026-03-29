const testEnv = process.env as Record<string, string | undefined>;

testEnv.BETTER_AUTH_SECRET ??= "test-better-auth-secret";
testEnv.DO_SPACES_ACCESS_KEY_ID ??= "test-spaces-access-key";
testEnv.DO_SPACES_SECRET_ACCESS_KEY ??= "test-spaces-secret-key";
testEnv.NEON_DATABASE_URL ??= "postgres://postgres:postgres@127.0.0.1:5433/cmd_market";
testEnv.NODE_ENV ??= "test";
testEnv.X_CLIENT_ID ??= "test-x-client-id";
testEnv.X_CLIENT_SECRET ??= "test-x-client-secret";
