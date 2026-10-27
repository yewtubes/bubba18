# December landing client — live milestone

These are screenshots of the running native BubbaBlox C# website at `http://127.0.0.1:5080/`, using Redis, the existing SQL schema through the persistent PGlite PostgreSQL wire server, and Next.js for existing frontend resources. There are no browser API fixtures. Viewports and capture timestamps are in `backend-integration.json`; its source base plus changed-worktree flag identify this source patch.

The structural document is from **2018-12-22 02:29:38 UTC**. The same AuthSite deployment's original templates, controllers, translations and CSS were archived on December 22 at 21:22:14–17 UTC. Original CSS geometry, form markup, artwork and scroll widgets are retained. All 67 CSS dependency paths were recovered; exact addresses, capture dates and hashes are in the source manifest. The unused Facebook icon's nearest capture is January 3, 2019; it is not relabeled as verified December material. No pixel-perfect certification is claimed.

- `landing-desktop-live.jpg`: initial desktop landing, 1366×768.
- `landing-full-live.jpg`: all actual page sections at the same viewport width.
- `landing-about-live.jpg`, `landing-platforms-live.jpg`: original scroll navigation.
- `landing-mobile-login-live.jpg`: expanded original mobile login, 390×844.
- `landing-verification-live.jpg`: real signup denial without the existing Discord verification; test password cleared before capture.

The native Data/index.html entrypoint is replaced, rather than an unused Next.js root. Original generic bundles remain separate from `adapter.js`, which translates local login/signup/username/metadata contracts. The standalone login bootstrap is guarded because its element belongs to the landing Angular tree. A verification link appears only after the real server rejects missing Discord verification. Telemetry is omitted. App badges point to the existing local download page; they are not working 2018 mobile/console downloads. English is the only connected language. Native 2FA handoff is retained but not exercised in this test.

Reproduce with `tools/dev-database/verify-landing.mjs` using the same tool-path environment variables as the other live integration scripts. It creates a dedicated temporary database and one synthetic account; no deployed credentials or accounts are included. `tools/research/prepare_landing.py` regenerates the public resources from the dated captures, with immutable raw documents cached privately.
