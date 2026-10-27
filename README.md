# Bubba18

BubbaBlox v2 → late-2018 Roblox revival. This is the existing C#/Next.js project, kept in its original root directory structure.

Baseline: [`rileyyyyyyx/bubbablox-v2`, branch `2021`](https://github.com/rileyyyyyyx/bubbablox-v2/tree/2021), commit `612227933b3d24df11a965430f9d6ee694e03857`.

The earlier transient checkout was lost. Recovery commits rebuild its recorded changes; old screenshots and previous test claims are not evidence that this checkout works. See `docs/recovery-baseline.json` for the restored source inventory. Proprietary RCC executables/native libraries are kept separate: each original runtime directory remains in the correct location for your authorized installation.

```
2016-roblox-main/       Existing Next.js frontend, being converted in place
Roblox/                Existing .NET solution, APIs, services and data models
api/sql/schema.sql     Original PostgreSQL schema
renderer/              Existing rendering service
AssetProxy/            Existing asset proxy
AssetValidationServiceV2/
admin/                 Existing administration frontend
RCCService2018/        Authorized Windows runtime location
```

Do not reuse upstream example secrets or developer-machine paths. Machine-local configuration, keys, dependencies and persistent database contents must remain outside commits. Setup and verification commands are added alongside their restored implementations.

This repository does not claim complete 2018 parity or working rendering/multiplayer. The upstream root LICENSE is retained as supplied; it is not a standard redistribution grant. The frontend's original permission notice is retained in `2016-roblox-main/LICENSE`; it does not establish rights to proprietary Roblox runtimes or assets.

## Local database and configuration

Requires Node.js, Python, Redis, and the .NET 6 SDK/runtime for the existing website. Production installations should use native PostgreSQL. A persistent PGlite development fallback is included for environments where PostgreSQL cannot run as a native process:

```sh
npm ci --prefix tools/dev-database
npm --prefix tools/dev-database run verify
npm --prefix tools/dev-database start
```

The fallback binds only to `127.0.0.1:5432`, imports `api/sql/schema.sql` unchanged, and stores data in `.local/pglite`. It multiplexes queries over one database engine and is not a production replacement for PostgreSQL authentication/concurrency.

In another terminal:

```sh
export BUBBABLOX_POSTGRES='Host=127.0.0.1;Port=5432;Database=postgres;Username=postgres;SSL Mode=Disable;Maximum Pool Size=10'
python tools/configure_local.py
npm ci --prefix 2016-roblox-main
redis-server
```

Run the existing website from `Roblox/Roblox.Website` with `dotnet run`, and the frontend with `npm --prefix 2016-roblox-main run dev`. The generator uses website port 5080 and frontend port 3000. Keep generated configs private. Browser authentication requires HTTPS for the secure session cookie; HTTP is useful for anonymous local startup checks.

Rebuild verification so far: original 97-table schema, PostgreSQL wire connection, parameters, rollback, and restart persistence pass (`docs/evidence/recovery/postgresql.json`). The C# website compiles after restoring the missing region terminator and configuration property. Runtime and browser results will be recorded only after this checkout is actually tested.
