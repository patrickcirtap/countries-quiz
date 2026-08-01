# Countries Quiz

An interactive quiz to name the countries of the world on a map. Type country
names to fill in an empty world map and see how many you can remember.

> **Status:** in active development — being rebuilt from an earlier Angular
> version with a focus on code quality and repository hygiene.

**Live site:** https://patrickcirtap.github.io/countries-quiz/

> [!IMPORTANT]
> `public/countries.geojson` is currently cut down to **10 countries** so the
> give-up and completion flows can be played through by hand. The full
> 218-country file is committed as `public/countries.geojson.orig`. Restore it
> with `mv public/countries.geojson.orig public/countries.geojson`.

## How to play

Type country names into the box. Each correct guess fills that country red and
labels it, and the counter tracks your progress.

- **Press Enter** to check a guess straight away instead of waiting for the
  400 ms debounce.
- **Click a country** for hints — an unguessed one offers its first letters and
  its capital city; a guessed one (or any country, once you have given up) shows
  its name and capital outright.
- **The menu** (under the zoom controls) has _reset zoom_, toggles for country
  _names_ and _markers_, a _hint_ explainer, and _give up_, which reveals every
  country you missed in grey.
- Progress is not saved; reloading starts a new game, so the browser asks you to
  confirm before leaving the page.

## Tech stack

- **React 19** + **TypeScript**, bundled with **Vite**
- **Leaflet** + **GeoJSON** for the map
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

- [x] Build out the interactive world map (Leaflet + GeoJSON).
- [x] Guess mechanic, progress counter, and country name labels.
- [x] Controls menu: reset zoom, toggle names, toggle markers, hint, give up.
- [x] Give-up reveal, completion dialog, and click-a-country hint popups.
- [x] Enter-to-submit, unload warning, and full parity with the original app.
- [ ] **Restore the full 218-country data file** (see the note at the top).
- [ ] Add **Dependabot** for automated npm + GitHub Actions updates (config
      drafted in the HTML comment above).
- [ ] Enforce a coverage threshold (currently 99% statements / 94% branches).
- [ ] Add a `LICENSE`.
