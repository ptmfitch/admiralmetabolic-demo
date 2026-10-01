---
name: startup
description: >-
  Stop Metabolic Insights and the dev processes it spawned, return this
  repository to an up-to-date main, and start the app. Use when the user
  says startup, start fresh, reset to main, or asks to kill the running
  app and relaunch it.
disable-model-invocation: true
---

# Startup

Reset this repository to latest `main` and start Metabolic Insights. Do the steps in order. Stop if a step fails.

The app is `apps/metabolic-insights`. From the repository root it starts with `pnpm dev:metabolic` and listens on port **5173**. `@demo/ui` is source imported by Vite; it has no server of its own. The processes to stop are the dev script and anything it spawned: `pnpm`, `vite`, and `esbuild` whose working directory is this repository.

## 1. Stop the app

From the repository root, find only processes that belong to this checkout:

- Listeners on TCP 5173.
- Commands containing `dev:metabolic`, `metabolic-insights`, or `vite`, whose cwd is this repository.

```bash
lsof -nP -iTCP:5173 -sTCP:LISTEN
```

Confirm each pid's cwd is inside this repository (`lsof -a -p <pid> -d cwd`) before signaling it. Kill the process group (`kill -TERM -<pgid>`), which stops the `pnpm` parent and the Vite and esbuild children together. Wait, then check the port again. If a confirmed pid is still listening, send `SIGKILL` to that same process group.

Leave processes from other repositories, R sessions, and anything not serving this app alone. Continue only when nothing from this repo is listening on 5173.

## 2. Uncommitted changes

```bash
git status --porcelain=v1
git branch --show-current
```

If the porcelain output is empty, go to step 3.

If it is not empty, stop and ask with AskQuestion. Do not stash, commit, discard, reset, or check out another branch before they answer.

Question: "This checkout has uncommitted changes. Stash them or commit them before switching to main?"

- **Stash** — `git stash push -u -m "startup"` on the current branch, then continue.
- **Commit** — commit on the current branch using the user's git commit steps, then continue. Do not push.
- **Stop** — end the skill. Leave the tree and branch as they are. Do not start the app.

After a stash or a commit on a branch other than `main`, name that branch and say the work stayed there.

## 3. Update main

```bash
git checkout main
git pull --ff-only origin main
```

If the pull is not a fast-forward, stop and report the git error. Do not merge, rebase, or reset.

If `node_modules` is missing, or the pull changed `pnpm-lock.yaml` or any `package.json`, run `pnpm install` from the repository root before starting.

## 4. Start the app

From the repository root, start `pnpm dev:metabolic` in the background. Wait until Vite prints a local URL or port 5173 is accepting connections. Reply with:

- the branch (`main`) and the short commit after the pull
- whether changes were stashed, committed, or already clean, and the previous branch name when it was not `main`
- the local URL, `http://localhost:5173`
