# Vite+ Migration — Website (`@batijs/elements`) Analysis

## Status

The `website` package has been **excluded from the pnpm workspace** (`pnpm-workspace.yaml`) so that
`vp run` can load the workspace task graph without errors.

## Root Cause

When `vp run` starts, it resolves the task graph by loading **every** `vite.config.ts` in the
workspace. The `website/vite.config.ts` imports `vike/plugin`, whose `assertViteRoot` check throws
an internal error ([Bug] tag) when the config is loaded outside the website's own directory:

```
[vike@0.4.255][Bug] You stumbled upon a Vike bug.
  at assertViteRoot (vike/dist/node/api/resolveViteConfigFromUser.js:228)
```

`assertViteRoot` compares the **early-resolved root** (the `cwd` at the time vp starts, i.e. the
monorepo root) with `config.root`. Because neither value equals the website directory, the
assertion fails and vp aborts task-graph construction.

Setting `root: __dirname` inside `website/vite.config.ts` makes the mismatch _worse_ — the early
root (monorepo root) would then differ from `config.root` (website dir).

This is a bug in `vike@0.4.255`; the plugin is not designed to be instantiated from an arbitrary
working directory.

## What Was Changed

| File                   | Change                                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm-workspace.yaml`  | Removed `- website` entry                                                                                                                    |
| `website/package.json` | Changed `"@batijs/features": "workspace:*"` → `"file:../packages/features"` so the local package is still resolved without workspace linkage |

## Manual Steps Required for the Website

1. **Install dependencies** separately from the monorepo:

   ```bash
   cd website
   pnpm install
   ```

2. **Build / develop** as before — the website scripts are unchanged:

   ```bash
   pnpm run build:pages    # Vike SSR build
   pnpm run build:widget   # Web-component build
   pnpm run dev            # Vike dev server
   ```

3. **Longer-term fix**: Upgrade `vike` to a version that does not call `assertViteRoot` during
   plugin _instantiation_ (only during an actual build/dev command). Once fixed, `website` can be
   re-added to `pnpm-workspace.yaml` and `@batijs/features` restored to `workspace:*`.
