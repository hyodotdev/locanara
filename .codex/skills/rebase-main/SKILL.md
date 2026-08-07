---
name: rebase-main
description: Safely synchronize local main with a fast-forward-only pull, optionally rebase the current work branch onto it, resolve conflicts without losing local work, and restore staged, unstaged, and untracked changes. Use when asked to pull main, update a branch from main, resolve rebase conflicts, or run rebase-main.
---

# Rebase Main

Update `main`, rebase the current work branch, and preserve every pre-existing
working-tree change. Do not commit or push unless separately authorized.

## Establish The Target

1. Read `AGENTS.md` and the repository Git rules.
2. Record the current branch, `HEAD`, upstream, worktrees, staged changes,
   unstaged changes, untracked files, and relevant ignored environment files
   with content fingerprints.
3. Stop if the checkout is detached or another merge, rebase, or cherry-pick is
   active. If the current branch is `main`, use main-only mode: update it and
   skip the work-branch rebase. Otherwise record the work branch for rebasing.
4. Stop if `main` is checked out in another worktree that cannot safely be
   updated. The current worktree's own `main` checkout is valid in main-only
   mode.
5. Use `origin` and `main` by default. Derive another target from repository
   configuration or ask when either is absent.

## Safeguard Local Work

If the worktree is dirty:

1. Capture status and content fingerprints so restoration can be checked.
2. Create one clearly named stash with `--include-untracked`. Never use `--all`;
   ignored credentials, environment files, and caches must remain in place.
3. Record the stash object and confirm tracked and untracked state is clean.
4. If a modified ignore rule exposes an ignored local file, protect only its
   exact path in `.git/info/exclude` after confirming neither target tree tracks
   it. Stop on any tracked-path collision.
5. Stop before switching branches if the stash or safety checks are incomplete.

Keep the stash as a recovery point until restoration is verified.

## Update Main And Rebase When Needed

Before each branch switch, check recorded ignored/local paths against the
destination tree. Use `git checkout --no-overwrite-ignore <branch>` for guarded
transitions.

1. Run `git fetch origin main` and check recorded paths against local `main` and
   fetched `origin/main`.
2. Check out `main` when not already there, then run
   `git merge --ff-only origin/main`.
3. Confirm local `main` and `origin/main` resolve to the same commit. Stop on
   ahead-only or divergent local history; never reset or create a merge commit.
4. In main-only mode, skip directly to restoration and verification.
5. Otherwise, check out the recorded work branch after repeating the collision
   check and run `git rebase origin/main`.
6. Resolve each conflict by inspecting base, new-main, and work-branch intent.
   Regenerate generated files from their source instead of choosing blanket
   `ours` or `theirs`.
7. Continue only after reviewing staged resolutions. Leave an ambiguous rebase
   recoverable and ask for direction.

Never use `git reset --hard`, `git checkout --`, `git clean`, or destructive
recovery shortcuts.

## Restore And Verify

1. Apply the recorded stash with its index.
2. Resolve restoration conflicts carefully and retain the stash until the
   original staged, unstaged, and untracked state is reproduced.
3. Remove temporary `.git/info/exclude` entries after normal ignore rules cover
   the protected paths again.
4. Confirm ignored environment files still exist and remain untracked.
5. Drop only the named safeguard stash after exact restoration.
6. Run `git status`, `git diff --check`, and affected lightweight checks.
7. Report old and new main heads, the work-branch head when applicable, and any
   skipped verification.

If the work branch was published, explain that rewritten history requires a
later `git push --force-with-lease`. Never perform that push without explicit
authorization.
