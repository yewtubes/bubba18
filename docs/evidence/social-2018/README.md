# Social browser contract milestone

These are genuine Next.js browser screenshots at a 1366×768 viewport (full-page output). All displayed identities and API responses are explicitly synthetic fixtures. They are separate from the live backend evidence in ../social-2018-live.

`browser-contract.json` records source base commit, changed-worktree status, URLs, UTC capture timestamps and seven passing checks. `tools/dev-database/verify-social-view.mjs` runs the original December search controller, original templates and original CSS; Friends retains its recovered April-attributed document and menu. External browser requests are blocked.

Checks cover 12-card search pagination, add/accept friendship state transitions, escaped search text, all 105 incoming requests across two API pages, recovered Following menu/unfollow, failed mutation recovery, other-profile request controls, and the Catalog Intl dependency. The intentional failure case returns HTTP 500; that expected diagnostic remains recorded. No JavaScript runtime/type errors remain in the passing run.

No screenshot certifies full 1:1 accuracy. Empty thumbnail placeholders originate in preserved frontend resources; no RCC rendering is demonstrated.
