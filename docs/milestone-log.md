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

## 2026-10-27 — Group contracts verified against C# (Milestone 4, partial)

**Implemented:** Fixed empty group pagination cursors and adapted the actual flat v1 role-member payload. Protected wall denial no longer prevents public group details from loading. Authentication finishes before loading membership controls. No backend permission checks were weakened.

**Reused / recovered:** Existing C# group, role, wall and thumbnail APIs; original November 17 group document/CSS; the universal Frame. No replacement UI was drawn.

**Tests / screenshots:** Expanded live integration now passes six checks with five screenshots in `evidence/social-2018-live/`, including Groups Games and Members. Signed-in membership hides Join; an anonymous session receives 401/403 for protected reads and never displays the protected post. Social database restart checks still pass. The earlier API fixture was corrected to match the real flat member schema.

**Still broken / next:** Group relationships, store, shouts, paging and full membership/admin parity remain incomplete. Rendering and full historical visual certification remain outstanding.

**Git status:** This entry and its actual runtime evidence are published with the corresponding source patch; test metadata identifies the source base and changed worktree.

## 2026-10-27 — Group layout corrected from the supplied reference

**Implemented:** Replaced the active November Group.aspx body with original redesigned group components: left group rail, image/name/count/rank header, four tabs, shout, description, members and wall. `/My/Groups.aspx` shares this component; old management/reference implementations are retained separately. Shared sidebar state now reserves its known width for this wide page.

**Reused / recovered:** Original C# permissions, group/status/wall/catalog/member APIs and the universal Frame. Later original component templates/CSS recovered from a May 2019 capture; the Dec 13 beta announcement and supplied image establish the intended arrangement. Exact December bundles are unrecovered, so full 1:1 is not claimed.

**Tests / screenshots:** Eight live integration checks, two genuine screenshots, no browser API mocks. Shout and wall writes survive SQL restart; anonymous posting/read restrictions remain enforced. See `evidence/groups-redesign/` for metadata and remaining gaps.

**Still broken / next:** Affiliates persistence, complete menus/paging, exact December typography/resources and rendering. Next work is the actual December 2018 landing client requested by the user. Source and screenshots are committed together; metadata records the changed worktree used for capture.

## 2026-10-27 — Actual December landing client integrated

**Implemented / reused:** Replaced the actual native `api/public/Data/index.html` with the December 22 landing mount/footer and original AuthSite templates, controllers, validators, translations, CSS, artwork and scroll widgets. Existing C# authentication, signup verification, cooldowns and session handling remain authoritative. Landing adapters and HTML revalidate instead of being cached for a year. The existing login page now displays the original client's error-code messages.

**Recovery / integration:** Same-day December AuthSite bundles and 67 local CSS dependency paths; immutable original hashes and exact dates in the source manifest. One unused Facebook image has a January 3 capture, explicitly recorded. Generic original resources are separate from local transport/bootstrap adaptations.

**Tests / screenshots:** Actual C# + Redis + persistent PostgreSQL wire engine + Next.js, no browser mocks. Build passed. Browser test covers original scrolling, mobile expansion, username uniqueness, validation, real signup verification denial, wrong password, successful session and local redirect. Six real screenshots and exact outcomes are in `evidence/landing-2018/`.

**Still broken / next:** Signup requires configured Discord OAuth; no verification was bypassed. Only English is connected. Store links lead to the local download page; genuine 2018 client/rendering compatibility is still unverified. Full pixel comparison remains outstanding. Continue converting remaining page bodies after publishing this milestone.

## 2026-10-27 — Discord signup replaced by self-hosted CAP

**Implemented / reused:** The original December signup controller/form solves CAP before using native C# registration. Official pinned CAP core/widget, local WASM/assets and Redis single-use nonce/token storage run behind restricted C# proxy routes. Removed the signup-only Discord gate, OAuth routes and identity/token/webhook coupling; optional existing-account login/recovery stays available.

**Tests / screenshots:** Real browser, C#, Redis and SQL checks in `evidence/cap-signup/`; no successful-verification fixtures. Includes first-account creation, session, related data, replay rejection, fail-closed outage and SQL restart. The signup transaction now shares its approval connection, and missing renderer leaves actual pending thumbnails instead of failing account creation. Build succeeds; genuine screenshots accompany source.

**Limits / next:** Actual RCC thumbnails/multiplayer remain unverified. Production Redis must retain nonce data through restarts. Next requested tasks are the archived embed/favicon, shared navigation/layout/dropdown fixes, profile Creations, original Messages/Develop/Trade bodies, admin repair and a local 2018 Blog page. No full historical parity is claimed.
