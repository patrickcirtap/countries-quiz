# Countries Quiz

See how many countries you can name.

**Live site:** https://patrickcirtap.github.io/countries-quiz/

A Claude-Code-driven React rebuild of a previous Angular version. Uses Leaflet
and GeoJSON to display and interact with the countries.

## Getting started

Requires **Node 24**

```bash
npm ci       # install exact dependencies
npm run dev  # http://localhost:5173/countries-quiz/
```

## Country data

`public/countries.geojson` is the single source of truth for every country. It
is fetched at runtime, not imported, so the geometry stays out of the
JavaScript bundle.

It holds 218 features, and every one carries the same five properties;
`alternativeNames` and `capitalCity` may be empty, but are never absent:

```ts
{
  isoName: string;                 // unique key, ISO 3166-1 alpha-3
  fullName: string;                // display name
  alternativeNames: string[];      // other accepted spellings
  centreCoords: [number, number];  // [lat, lng] anchor for the label and pin
  capitalCity: string;             // '' for Antarctica, Hong Kong and Vatican
}
```
