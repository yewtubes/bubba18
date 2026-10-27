# Social milestone with the actual backend

These five screenshots show the running Next.js site connected to the original C# website, Redis and disk-backed PostgreSQL via the PGlite wire server. Browser APIs are not mocked. Accounts are synthetic local records, named LocalTester and LocalRequest001–105. The viewport is 1366×768; screenshots are full-page images.

`backend-integration.json` records URLs, capture times, source base commit and changed-worktree status. Six checks passed: real login/search pagination, all 105 request deletions verified in SQL, unfollow verified in SQL, original group details/members/protected wall with existing-member controls, anonymous wall denial without hiding public details, and social mutations surviving database close/restart. No page runtime exceptions or API 500s occurred.

Reproduce with frontend dependencies, .NET 6 website build, Redis, libsodium and the dev-database npm dependencies installed:

```
python tools/dev-database/create-visual-account.py
node tools/dev-database/verify-social-backend.mjs
```

Generate private config for `http://127.0.0.1:5080` first. Set `BUBBABLOX_DOTNET`, `BUBBABLOX_REDIS_SERVER`, `PLAYWRIGHT_MODULE` and `BROWSER_EXECUTABLE_PATH` when tools are outside PATH. The harness uses a new isolated disk database per run and never replaces existing user data. Private credentials and runtime logs stay in .local.

Search HTML/CSS/controller/templates are dated December 3, 2018. Friends/menu are April-attributed; December continuity is unverified. Minimum search length comes from later metadata, not a verified 2018 response. Chat, game joining, full mobile behavior and full pixel parity remain incomplete. These unavailable avatar images do not establish RCC rendering.
