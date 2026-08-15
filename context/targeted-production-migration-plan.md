# Targeted production migration implementation plan

## Source specification

`docs/superpowers/specs/2026-08-15-targeted-production-migration-design.md`

## Implementation order

### Task 1: Replace the broken full-history migration command

- File: `.github/workflows/db-migrate.yml`
- Change: use the existing `PRODUCTION_DATABASE_URL` secret with `psql`; check for `public.content_operation_items`; apply only `packages/db/drizzle/0013_small_puma.sql` when absent.
- Safety: enable `ON_ERROR_STOP`; keep the workflow manual-only; never print the connection string.
- Verification: validate YAML and inspect the diff for any secret interpolation or arbitrary input.

### Task 2: Add post-migration schema verification

- File: `.github/workflows/db-migrate.yml`
- Change: verify all four content tables with `to_regclass` and fail unless the result count is four.
- Verification: run a YAML parser locally and confirm the fixed SQL path exists.

### Task 3: Publish and execute

- Files: committed workflow and plan only.
- Change: push the branch, open a PR, verify Vercel/GitHub checks, merge, and manually dispatch `db-migrate.yml` on `main`.
- Verification: GitHub Actions must complete successfully.

### Task 4: Production acceptance

- Target: `https://www.careerdirect.kr/admin/content`
- Verify: authenticated page loads; nine content items and 36 channel tasks are present.
- Verify: the Cron endpoint accepts the configured bearer token through Supabase; the production Cron remains active at `*/10 * * * *`.
- Rollback: if the workflow fails, do not change `DATABASE_URL`; stop before any schema deletion or secret rotation.

