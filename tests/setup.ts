import { config } from "dotenv";
import { beforeAll } from "vitest";

config();

beforeAll(() => {
  const required = ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SERVICE_ROLE_KEY"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(
      `Missing required env for RLS tests: ${missing.join(", ")}. ` +
        `Set them in .env or shell before running 'bun run test:rls'.`,
    );
  }
});
