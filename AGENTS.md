# Project guide

- This is a Remix 3 project. Follow official installed Remix 3 documentation and
  first-party Remix APIs for app code and tests. Start with
  `./.agents/skills/remix/SKILL.md` and consult version-matched docs in
  `node_modules/remix/INDEX.md`. Bun is the intentional runtime exception.
- Use Bun as the runtime and package manager. Keep the existing package scripts and
  `bun.lock` in sync; do not substitute npm or Node-specific development instructions.
- Install dependencies with `bun install --frozen-lockfile`.
- Start local development with `bun run dev`; run the production server with
  `bun run start`.
- Run project checks with `bun run verify`; run server tests with `bun run test:server`
  and browser/E2E tests with `bun run test:browser`.
- Run `bun run doctor` to check the local environment.
- Install Chromium for browser tests once with
  `bun x --bun --no-install playwright install chromium`.
- Use Playwright as the browser automation library for browser control.
- Format with the project’s Bun formatter and lint with Biome; use the existing scripts
  and configuration.
