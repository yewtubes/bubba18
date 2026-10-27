# Known issues

- Full late-2018 route, pixel and interaction parity has not been established. See 2018-route-coverage.md for retained legacy bodies.
- Home, Friends and signed-in navigation were recovered from an April-attributed mirror. December continuity remains unverified. Historical Egg Hunt/Ready Player One sponsor cards are removed from live navigation.
- The mirrored group MHTML claims Tue, 12 Feb 2018. That date was a Monday; Tuesday matches 2019. Its contents are not used as verified December-2018 evidence.
- Renderer, RCCService2018, client joining and multiplayer are not validated. Missing thumbnails remain unavailable; screenshots do not prove rendering.
- Structured browser checks distinguish runtime exceptions and API 500s from console diagnostics. The preserved site still emits CSP/resource errors for unavailable services and legacy dependencies.
- Native PostgreSQL is recommended for deployment. PGlite is a tested local fallback, not a production concurrency/authentication replacement.
- No real payment or gift-card system is connected.
- The opaque upstream settings ZIP is not published; active C# sources do not reference it. Proprietary Windows runtimes are installed separately.
- December player-search markup, controller and templates are integrated and tested against C# and SQL. The exact 2018 metadata response remains unrecovered; the three-character minimum is from a 2021 metadata capture. Mobile, chat and join controls are not fully integrated.
- The original Catalog languageResource adapter now exposes the recovered Intl comparison implementation; the previous langSensitiveCompare error is fixed and browser-tested.
