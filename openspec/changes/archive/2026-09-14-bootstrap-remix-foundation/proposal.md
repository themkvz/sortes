## Why

Sortes has product requirements and visual design sources but no runnable application or development checks. Establish a small Remix 3 foundation so the reading experience can be developed in tested increments without choosing tooling during each feature.

## What Changes

- Bootstrap the application inside the existing Git/OpenSpec repository, preserving its history, documents, design file, and agent workflows.
- Use the actual Remix 3 release line and `remix/ui`, with a pinned compatible Node 24 runtime and Bun for package management. The observed `remix@next` release is `3.0.0-rc.2`, requiring Node `>=24.3.0`; reconcile the older Node baseline in the tech document during implementation.
- Add strict TypeScript, Biome, Lefthook, a reproducible lockfile, documented scripts, minimal environment configuration, a single application container, and local CI configuration.
- Establish minimal TDD using the starter's Node test runner: critical domain invariants and input boundaries get tests before implementation; visual styling gets browser verification.
- Render an accessible, responsive initial-board preview at `/`, using the existing pen.dev foundation and first-screen design. This foundation milestone has no working reading session; its primary action is visibly disabled until the next feature slice.
- Record an ordered roadmap from this foundation through deck content, the reading engine, complete interaction, safe sharing, and release verification. Later slices require their own planning/apply work.

## Capabilities

### New Capabilities

- `application-shell`: Server-rendered initial board, design-source fidelity, responsive/accessibility basics, and controlled route failures.

### Modified Capabilities

None. There are no existing capability specs.

## Impact

Implementation will add the application manifest and lockfile, Remix entry points/controllers, initial-board CSS/assets, targeted tests, developer configuration, a Dockerfile, CI workflow, and contributor documentation. It will update the runtime/testing guidance in `design/mvp-tech-design.md` to match the chosen foundation.

Initial production dependency: `remix`. Initial development dependencies: `typescript`, `@types/node`, `@biomejs/biome`, and `lefthook`. Browser automation is introduced with the first functional reading flow. Remix subpath imports do not require separate packages.

No application code or dependency installation occurs in this proposal workflow. No database, authentication, React ecosystem packages, deployment, commits, or remote repository changes are included. The full reading loop, final deck copy, sharing, and remaining visual states are follow-up work.
