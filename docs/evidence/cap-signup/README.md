# Real CAPTCHA signup milestone

Actual native C# website, Redis, official capjs-core/widget, persistent SQL engine through the PostgreSQL wire server, and Next.js. No browser API fixtures or test-token bypass. Screenshots use 1366×768; timestamps and source base plus changed-worktree flag are in `backend-integration.json`.

- `cap-signup-form-live.jpg`: original December form with synthetic local details before submission.
- `cap-account-home-live.jpg`: authenticated homepage after real browser proof-of-work/instrumentation, token verification and account creation.

CAP is a modern, intentional security adapter. It replaces the previous Discord gate and signup-specific OAuth routes, token checks, identity linking and notification dependencies. Optional Discord password recovery/login for already linked accounts is retained separately. Missing CAPTCHA/configuration and service outages cannot silently enable signup.

Tests cover the first account in an empty SQL database, real account/session creation, hashed password storage, the account's related rows, private verifier authentication, no public siteverify proxy, invalid/replayed proofs, consumed-token reuse, outage rejection and SQL restart persistence. Existing validations and cooldowns remain in place.

The live test exposed an existing registration transaction bug: account approval used a second service/connection inside the transaction. It now shares the account transaction. Initial avatar data persists before the response; absent rendering leaves thumbnail fields pending rather than failing a committed signup. No genuine avatar rendering is claimed. The default configuration no longer refers to nonexistent starter assets 1/2; operators can configure their owned starter assets.

Reproduce with `tools/dev-database/verify-cap-signup.mjs`, the same local tool-path environment variables used by the other integration scripts, and `npm ci` in `captcha/`. Native .NET 6 targeting is retained; the build in this managed environment used the installed SDK with a newer build-host runtime to work around its process-introspection failure. No legacy RCC executable was launched.
