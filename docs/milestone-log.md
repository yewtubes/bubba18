# Milestones

## Recovery and original-page integration — 2026-10-27

Restored the pinned BubbaBlox source in its original directory structure. Existing C# APIs, models, schema, Redis sessions and Next.js providers are retained. Database wire, rollback and persistence verification passed. Original October–December page documents/styles were recovered for Games, Catalog, profiles, game details, item details, Login, Create and Robux; native Angular catalog templates/controller run with API adapters. The public mirror supplied original Home/Friends markup and their referenced CSS/scripts; April attribution is distinguished from a verified December capture.

Actual runtime evidence: docs/evidence/recovery/backend-integration.json and PNGs. Historical reference renderings are labeled historical-reference-*; they are not implemented-site screenshots. Stable shell geometry/typography comparisons are limited to their measured selectors, not full parity.

Remaining: authenticated Avatar/Settings/Groups/Develop and other legacy bodies, verified late-2018 continuity for the April sources, complete historical interactions, real RCC rendering and multiplayer. No complete revival milestone is claimed.

## 2026-10-27 — December search and Friends actions (Milestones 4/6, partial)

**Implemented:** `/search/users` now runs the December 3 original HTML, templates, controller, pagination directive and stylesheet through an adapter to BubbaBlox. Fixed the search service URL, query encoding and pagination parameter names. Restored the Friends image bindings, headings and captured card menu, fixed hash-tab initialization, mutation locking/error recovery and Ignore All across every request page. Fixed Catalog's missing languageResource Intl dependency.

**Reused from BubbaBlox:** Authentication/session middleware, search, presence, friendship, following and thumbnail APIs, PostgreSQL schema, Redis, C# website, existing universal Frame/sidebar/footer. No replacement backend or duplicated navigation.

**Recovered from 2018:** December 3 search document and its exact referenced CSS, templates, controller, pagination and Intl/String code. April-attributed Friends menu and avatar image bindings restored from the already recorded mirror; December continuity is not asserted.

**Backend integration:** Real login/search paging, all 105 request dismissals, unfollow and SQL restart persistence verified. API-contract tests additionally exercise add/accept states, errors and other-profile controls.

**Tests:** .NET 6 MSBuild restore/build passed. `verify-social-view.mjs`: 7 checks / 3 screenshots. `verify-social-backend.mjs`: 4 checks / 3 screenshots, no browser runtime exceptions or API 500s. `git diff --check` passed.

**Screenshots:** `evidence/social-2018-live/` is the running C# + SQL site; `evidence/social-2018/` uses explicit browser API fixtures. Both contain viewport/URL/date/source metadata. Avatar placeholders are not render proof.

**Still broken:** No full 1:1 certification. Search metadata/mobile/chat/join parity remains incomplete. Remaining legacy page bodies, Windows RCC/client validation and multiplayer remain outstanding.

**Next actions:** Recover usable original inventory, avatar, settings and development documents; retain original working routes until authentic bodies are available. Validate additional social and group controls against the real backend.

**Git status:** Source and evidence are published together in the commit containing this entry. Test metadata names the source base commit and identifies the changed worktree; no screenshot is represented as an exact clean-commit build.
