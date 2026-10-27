# Corrected group layout — actual running site

The user-supplied image targets the redesigned group page: group rail, image/name/count/rank header, About/Store/Games/Affiliates tabs, Shout, Description and a nine-member row. The previously integrated November Group.aspx document predates this design and is retained solely as a reference.

The December 13, 2018 beta announcement establishes the redesign's target period: https://devforum.roblox.com/t/new-group-details-page-is-live/210819. The component templates and CSS recovered for this integration are referenced by a **May 24, 2019** capture. They are original components, adapted to the supplied December arrangement; they are **not represented as recovered December source or certified 1:1**. In particular, Games has been moved back to its separate tab. Exact December resource recovery and full typography/pixel verification remain outstanding.

Screenshots show the actual C# website + Redis + disk-backed PostgreSQL engine (PGlite wire server) + Next.js. Accounts and group content are explicit local test records; no browser API mocks are used. Images remain pending where rendering is unavailable. These screenshots do not establish RCC functionality.

`backend-integration.json` records 1366×768 viewport, URLs, UTC capture timestamps, source base commit/dirty state and measured geometry. Eight checks cover structure, nine-member paging, shout posting, wall posting, tabs, My Groups/shared sidebar, anonymous authorization and SQL restart persistence.

Reproduction: `node tools/dev-database/verify-group-redesign.mjs`, using the same private configuration and tool environment as ../social-2018-live. The generator is `tools/research/prepare_group_redesign.py`; scope its original CSS with `node tools/research/scope_pages.cjs group-redesign.original.css`. Compatibility rules are separate in `group-redesign-adapter.css`.

Remaining: true Affiliates storage, complete store/game paging, membership/menu actions, responsive verification, exact December typography and unavailable rendering. Original November artifacts and earlier screenshots remain labeled historical milestones, not proof of the active target layout.
