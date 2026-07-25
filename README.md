# Countries Quiz

An interactive quiz to name the countries of the world on a map. Type country
names to fill in an empty world map and see how many you can remember.

> **Status:** in active development — being rebuilt from an earlier Angular
> version with a focus on code quality and repository hygiene.

**Live site:** https://patrickcirtap.github.io/countries-quiz/

## Tech stack

- **React 19** + **TypeScript**, bundled with **Vite**
- **Leaflet** + **GeoJSON** for the map (planned)
- **Vitest** + **React Testing Library** for tests and coverage
- **ESLint** + **Prettier** for linting and formatting
- Hosted on **GitHub Pages**, deployed by **GitHub Actions**

## Getting started

Requires **Node 24** (pinned in `.nvmrc`; run `nvm use` if you use nvm).

```bash
npm ci        # install exact dependencies
npm run dev   # start the dev server (http://localhost:5173/countries-quiz/)
```

## Scripts

| Script                  | Purpose                                     |
| ----------------------- | ------------------------------------------- |
| `npm run dev`           | Start the Vite dev server                   |
| `npm run build`         | Type-check (`tsc`) and build for production |
| `npm run preview`       | Preview the production build locally        |
| `npm run lint`          | Run ESLint                                  |
| `npm run format`        | Format all files with Prettier              |
| `npm run format:check`  | Check formatting without writing            |
| `npm run typecheck`     | Type-check without emitting                 |
| `npm run test`          | Run the test suite once                     |
| `npm run test:watch`    | Run tests in watch mode                     |
| `npm run test:coverage` | Run tests with a coverage report            |

## CI/CD

The `CI` workflow (`.github/workflows/ci.yml`) runs on every push and pull
request. Its `verify` job gates format, lint, type-check, tests, and build; the
`deploy` job then publishes to GitHub Pages on `main` — but only if `verify`
passes, so a red run of any check blocks the deploy.

## Roadmap / TODO

<!--
  Dependabot (deferred — add when ready)

  Create `.github/dependabot.yml` with the config below to get weekly PRs that
  bump npm dependencies and GitHub Actions versions. Each update PR runs through
  the CI `verify` gate, so only passing updates get merged.

  version: 2
  updates:
    - package-ecosystem: npm
      directory: "/"
      schedule:
        interval: weekly
      open-pull-requests-limit: 5
    - package-ecosystem: github-actions
      directory: "/"
      schedule:
        interval: weekly
-->

- [ ] Add **Dependabot** for automated npm + GitHub Actions updates (config
      drafted in the HTML comment above).
- [ ] Enforce a coverage threshold once there is real game logic.
- [ ] Build out the interactive world map (Leaflet + GeoJSON).
