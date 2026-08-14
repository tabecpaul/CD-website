# PDF callback compatibility design

## Problem

The page-12 CTA in the distributed career-direction workbook links to
`/callback`, while the live callback form is served at
`/assessment-consultation`. The old URL therefore returns 404. The printed QR
code is treated as another consumer of the same legacy URL.

## Design

Add a public compatibility route at `/callback`. It permanently redirects to
`/assessment-consultation` and preserves the complete query string, including
all UTM parameters. The route contains no form or duplicated business logic;
the existing assessment-consultation page remains the single implementation.

The next exported PDF should encode and link directly to
`/assessment-consultation`, while the compatibility route remains available for
already distributed files.

## Routing behavior

- `/callback` redirects to `/assessment-consultation`.
- `/callback?utm_source=pdf&...` redirects to
  `/assessment-consultation?utm_source=pdf&...` without dropping or rewriting
  attribution parameters.
- The route belongs to the `start.careerdirect.kr` conversion host. Existing
  host-routing rules must not send it to the official-site home page.

## Verification

- Confirm the route is recognized as start-owned.
- Run lint and TypeScript checks.
- Build the web application.
- Verify a request with page-12 UTM parameters returns a redirect whose
  location is the assessment-consultation page with identical parameters.

## Out of scope

- Re-exporting or visually editing the Canva/PDF source.
- Changing the callback form or its submission workflow.
- Changing the official-site link on page 12.
