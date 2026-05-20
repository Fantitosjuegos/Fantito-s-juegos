# ⚠️ Git History Cleanup — Run This Before Anything Else

Your `.env` file (with Supabase credentials) was committed to GitHub.
Even after adding it to `.gitignore`, the keys are still visible in the git
history. Follow these steps to fully purge them.

---

## Step 0 — Rotate your Supabase anon key (do this first!)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. **Settings → API → Reset anon/public key**
3. Copy the new key
4. Update your local `.env` with the new key

> The old key will still work until you rotate it, so this is urgent.

---

## Step 1 — Purge .env from git history

Run these commands in your local repo root:

```bash
# 1. Install the BFG Repo-Cleaner (fast & safe alternative to git filter-branch)
#    macOS:
brew install bfg
#    Or download the jar: https://rtyley.github.io/bfg-repo-cleaner/

# 2. Clone a fresh mirror of your repo (BFG works on a bare clone)
git clone --mirror https://github.com/YOUR_USERNAME/YOUR_REPO.git repo-mirror.git
cd repo-mirror.git

# 3. Tell BFG to delete all .env files from history
bfg --delete-files .env

# 4. Clean up dangling commits
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 5. Force-push the clean history
git push --force

# 6. Delete the mirror clone
cd ..
rm -rf repo-mirror.git
```

---

## Step 2 — Apply the new files to your working repo

```bash
# In your working repo root:

# Copy the new files from this PR
cp .gitignore .gitignore
cp .env.example .env.example
cp src/lib/env.ts src/lib/env.ts
cp src/integrations/supabase/client.ts src/integrations/supabase/client.ts
cp src/pages/Auth.tsx src/pages/Auth.tsx
cp vite.config.ts vite.config.ts
cp package.json package.json

# Make sure .env is NOT tracked anymore
git rm --cached .env 2>/dev/null || true
git rm --cached -r .lovable/ 2>/dev/null || true

# Verify .env is ignored
git status  # .env should NOT appear here

# Install deps (removes lovable packages)
npm install

# Commit
git add .
git commit -m "chore: step 1 — repo hygiene, remove Lovable lock-in, env validation"
git push
```

---

## Step 3 — Ask all collaborators to re-clone

After a force-push, your teammates' local repos have the old history.
They should:

```bash
# Backup any local uncommitted changes first!
git fetch --all
git reset --hard origin/main
```

---

## Checklist

- [ ] Supabase anon key rotated in dashboard
- [ ] `.env` removed from git history (BFG)
- [ ] `.env` in `.gitignore`
- [ ] `.env.example` committed
- [ ] `src/lib/env.ts` committed
- [ ] `@lovable.dev/cloud-auth-js` removed from `package.json`
- [ ] `lovable-tagger` removed from `package.json`
- [ ] `src/integrations/lovable/` folder deleted
- [ ] `.lovable/` folder deleted
- [ ] `vite.config.ts` cleaned
- [ ] `src/pages/Auth.tsx` uses Supabase OAuth directly
- [ ] All teammates have re-synced