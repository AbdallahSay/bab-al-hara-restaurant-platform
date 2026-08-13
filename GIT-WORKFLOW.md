# GIT-WORKFLOW.md — Source Control Rules

Remote repository:
`https://github.com/AbdallahSay/bab-al-hara-restaurant-platform.git`

## Permanent rule
Local work is never the only copy of completed work. Stable completed changes must be committed and pushed to GitHub.

## Branches
- `main`: production-ready, protected mentally even if GitHub protection is not configured yet.
- `develop`: optional integration branch when multiple features are active in parallel.
- `feature/<short-name>`: product feature work.
- `fix/<short-name>`: bug fixes.
- `chore/<short-name>`: tooling/infrastructure/documentation setup.

Prefer feature branches and pull requests for substantial changes.

## Commit style
Use concise Conventional Commit-style messages when practical:
- `feat: ...`
- `fix: ...`
- `refactor: ...`
- `test: ...`
- `docs: ...`
- `chore: ...`

Do not create noisy commits such as `changes`, `update`, `fix stuff`, or dozens of single-line commits for one coherent task.

## Required completion sequence
For each meaningful task:
1. `git status`
2. run frontend/backend checks relevant to the task
3. `git add ...`
4. `git commit -m "..."`
5. `git push -u origin <branch>` on first push, otherwise `git push`
6. verify `git status` is clean or only contains intentionally uncommitted work

## Pull requests
For a substantial vertical slice:
- push feature branch
- open a PR into `main` (or `develop` if intentionally used)
- include summary, architecture/data changes, screenshots for UI work, test results, migration notes, and known limitations
- do not merge with failing CI

## Safety
- Never commit `.env`, secrets, API keys, payment secrets, database passwords, access tokens, or production credentials.
- Never force-push `main`.
- Never delete remote branches that may contain unmerged work without explicit confirmation.
- Do not rewrite shared history.

## If remote push fails
Do not lose work and do not claim completion.
- preserve local commit
- report the exact Git error
- show current branch and latest commit SHA
- wait for authentication/permission/network remediation
