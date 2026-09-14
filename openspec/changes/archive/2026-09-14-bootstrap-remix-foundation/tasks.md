## 1. Confirm the foundation inputs

- [x] 1.1 Recheck the published Remix 3 release, its Node engine requirement, and its generated starter in a temporary directory; record the chosen exact Remix/Node/Bun versions and relevant starter differences in the README, and verify no Remix 2 or React Router scaffold is selected.
- [x] 1.2 Inspect `design/design.pen` through pen.dev before visual work; record the foundation/initial-screen frame references, tokens, and required assets, and verify both a desktop and a phone layout can be implemented from those sources. Bootstrap/configuration tasks may proceed while canvas access is unavailable; visual completion may not be claimed.

## 2. Bootstrap runtime and developer tooling

- [x] 2.1 Integrate the minimum pinned starter files into the existing repository, add the private ESM manifest, Node version pin, Bun package-manager pin, `remix` dependency, TypeScript/Node types, and Bun lockfile; verify a frozen install and starter development server work and the existing Git/design/OpenSpec/agent files are preserved.
- [x] 2.2 Configure strict TypeScript using the pinned starter's Remix UI JSX and Node module settings; verify `typecheck` succeeds and a browser client module loads with no unresolved imports or React dependencies.
- [x] 2.3 Add Biome with the specified formatting/import rules and owned-file scope, plus `check` and `check:fix`; verify a temporary formatting violation fails the read-only check, an explicit fix resolves it, and design/agent/planning files remain untouched.
- [x] 2.4 Configure the native Node test runner and `test`, `test:watch`, and `verify` scripts; verify a temporary failing assertion produces a nonzero result and remove that disposable assertion after real tests in section 3 exist.
- [x] 2.5 Add Lefthook pre-commit checks and pre-push verification with an explicit `hooks:install` script; verify installed hooks invoke the expected scripts and failures block them without creating a commit, pushing, or automatically staging changes.
- [x] 2.6 Add `.gitignore`, `.dockerignore`, and a minimal `.env.example` for consumed server configuration; verify local env files and generated outputs are excluded while the example remains trackable and default startup needs no secrets.

## 3. Establish request and configuration behavior with TDD

- [x] 3.1 Write a failing request test for useful server-rendered `GET /` HTML, then implement the minimal document/controller/router with branding, question label, action, three empty positions, and inactive card area; verify the test passes through the real Request/Response boundary without starting an HTTP server.
- [x] 3.2 Write failing request tests for an unknown route and an unexpected production request failure, then add controlled 404/500 responses; verify status codes, a return link for 404, and no production stack trace, using only a narrowly scoped failure stub if needed.
- [x] 3.3 Write failing tests for actual environment-input validation, then implement the startup configuration boundary; verify invalid port/mode values fail with an actionable error, defaults succeed, and the browser bundle receives no environment object.

## 4. Implement the existing initial-screen preview

- [x] 4.1 Translate the inspected foundation tokens and required assets into application-owned CSS and the initial board; verify the screen against referenced canvas frames and record any necessary responsive adaptation without redesigning the product.
- [x] 4.2 Add question editing and `Ask`/`Surprise me` label updates while keeping the primary action visibly disabled with preview explanation; verify empty/whitespace/nonempty input, Enter behavior, absence of question network submission, and reset to empty on reload in a real browser.
- [x] 4.3 Check semantic controls, visible focus, text contrast, decorative-image treatment, and reduced-motion behavior; verify at 320px, a representative wider phone, and desktop widths that all spread positions remain understandable with no horizontal scrolling.

## 5. Make verification reproducible

- [x] 5.1 Add the single application Dockerfile with pinned runtime/install stages, required runtime sources/assets, writable cache if used, and a non-root user; verify a local image build, production startup, successful `/` and CSS/client asset responses, and exclusion of local env/design/agent/test files from the runtime image.
- [x] 5.2 Add a local GitHub Actions workflow for frozen install, verification, and bounded production/container smoke checks with read-only permissions; verify it uses the same Node/Bun pins and scripts, includes cleanup, and contains no publish/deploy steps or secrets.
- [x] 5.3 Write the README with setup, hook installation, command contract, minimal TDD workflow, preview limitations, and links to the MVP roadmap; verify the documented commands against a clean temporary application checkout without overwriting this worktree.
- [x] 5.4 Reconcile `design/mvp-tech-design.md` runtime/testing/production-build guidance with the approved Node baseline, native test runner, and actual Remix production startup; verify the product requirements and remaining MVP acceptance criteria are preserved.

## 6. Foundation acceptance and handoff

- [x] 6.1 Run full `verify`, framework diagnostics, and production/container checks after the final changes; record results and any unrelated failures, and verify no unused packages or fake build command were introduced.
- [x] 6.2 Record final desktop/phone browser checks against the application-shell spec, confirm only the initial preview is complete, and identify milestone 1 (deck content and reading rules) as the next change; verify all tasks here are done without counting future roadmap milestones as implemented or publishing the preview.
