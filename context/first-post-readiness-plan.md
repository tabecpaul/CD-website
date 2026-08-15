# First post readiness implementation plan

## Task 1: Trusted administrator origins

- Add a server helper that accepts only the configured start and official HTTPS origins.
- Replace duplicated origin comparisons in content and callback write routes.
- Add unit tests for both accepted domains and rejected origins.
- Run focused tests, lint, and TypeScript checks.

## Task 2: Correct the Instagram copy source

- Update the Instagram section in `campaigns/blog-launch-2026q3/copy/instagram-facebook.md`.
- Regenerate or directly synchronize `contentCatalog.generated.json` through the existing catalog generator.
- Verify Facebook wording and all channel-specific UTM sources remain distinct.

## Task 3: Build the eight-card visual package

- Use the approved eight slide texts and existing Career Direct Korea brand assets.
- Create a square eight-page editable PPTX with the presentation artifact runtime.
- Render all slides to 1080×1080 PNG files.
- Inspect individual slides and a montage for clipping, contrast, hierarchy, and logo use.
- Add the PPTX and PNG files to the campaign output package without overwriting unrelated outputs.

## Task 4: Publish and validate

- Commit only scoped source, tests, design source, and deliverables.
- Push a dedicated branch, open a PR, pass checks, and merge.
- Verify both official domains and administrator save behavior in production.
- Change all four first-post channel tasks to `ready` only after visual validation.
- Confirm the administrator list shows four ready tasks and that notification processing remains healthy.

