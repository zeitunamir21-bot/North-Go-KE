## Goal

Add an automated test suite that verifies Row-Level Security on `trips` and `bookings` behaves correctly for each role: anonymous (passenger), authenticated non-driver, approved driver (trip owner + non-owner), and admin.

## Approach

Use **Vitest** (already compatible with the Vite toolchain) with the **Supabase JS client** pointed at the live Cloud project, exercising real RLS — that's the only way to actually verify policies. Tests use the service-role key to seed/cleanup, and per-role anon-key clients to assert allow/deny.

```text
tests/
  rls/
    helpers.ts          # client factories, seed/cleanup, role provisioning
    trips.rls.test.ts
    bookings.rls.test.ts
  setup.ts              # loads env, guards against running without service key
vitest.config.ts        # node env, includes tests/**, excludes from app build
```

### Test users (created once per run, cleaned up after)

Created via `supabaseAdmin.auth.admin.createUser` with `email_confirm: true`:
- `passenger@test.local` — no role
- `driver-owner@test.local` — inserted into `drivers` then status flipped to `approved` (trigger grants `driver` role)
- `driver-other@test.local` — same, different user
- `admin@test.local` — row inserted into `user_roles` with `admin`

Each user gets a dedicated `supabase` client signed in with their session; the anonymous client uses no session.

### Trips coverage

| Actor | SELECT all trips | INSERT (owner=self) | INSERT (owner=other) | UPDATE own | UPDATE other's | DELETE own | DELETE other's |
|---|---|---|---|---|---|---|---|
| anon | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| passenger | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| driver-owner | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Bookings coverage

| Actor | INSERT (via reserve_seats RPC) | SELECT own-trip rows | SELECT other rows | UPDATE | DELETE |
|---|---|---|---|---|---|
| anon | ✅ | ❌ | ❌ | ❌ | ❌ |
| passenger | ✅ | ❌ | ❌ | ❌ | ❌ |
| driver-owner | ✅ | ✅ (only bookings on own trips) | ❌ | ❌ | ❌ |
| admin | ✅ | ✅ (all) | — | ✅ | ✅ |

Also verify `get_booking_details` RPC masks the phone for anon and returns full phone for admin.

### Seed/cleanup discipline

- Every test seeds via `supabaseAdmin` with a `__rls_test__` tag in `notes`/`customer_name` so cleanup is surgical.
- `afterAll` deletes seeded bookings → trips → drivers → users in dependency order. No reliance on cascade.

## Tooling

- `bun add -d vitest @vitest/ui` (Vitest only; Supabase client already installed).
- New script in `package.json`: `"test:rls": "vitest run tests/rls"`.
- Tests read `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` from `process.env` (already present in `.env`).
- Test files excluded from production build via `vitest.config.ts` (separate from `vite.config.ts`).

## Out of scope

- Tests for `drivers`, `ratings`, `user_roles` tables (can be added later in the same harness).
- CI wiring — leave as a manual `bun run test:rls` command for now.
- Frontend/component tests.

## Risks

- Tests hit the live Cloud DB. Mitigated by tagged rows + ordered cleanup in `afterAll` and `afterEach`. If a run is interrupted, leftover rows are all tagged `__rls_test__` and easy to purge.
- Auth signup rate limits — created users are reused across the suite (one `beforeAll`), not per-test.
