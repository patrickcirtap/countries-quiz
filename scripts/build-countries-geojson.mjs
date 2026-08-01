// Rebuilds the country data: exactly the 218 countries the original Angular app
// defined, with one uniform property set on every feature.
//
//   node scripts/build-countries-geojson.mjs <old-countries.json> <natural-earth.geojson> <out.geojson>
//
// <old-countries.json>      the original app's src/assets/countries.json
// <natural-earth.geojson>   the 242-feature Natural Earth 1:50m export. It is no
//                           longer in the working tree; recover it with
//                           `git show 69565ab:public/countries.geojson > ne.geojson`
//
// Verified to reproduce public/countries.geojson.orig byte for byte.
import fs from 'node:fs';

const [, , OLD, SOURCE, OUT] = process.argv;
if (!OLD || !SOURCE || !OUT) {
  console.error(
    'usage: node scripts/build-countries-geojson.mjs <old-countries.json> <natural-earth.geojson> <out.geojson>',
  );
  process.exit(1);
}

// ISO 3166-1 gives Somaliland no alpha-3 (it falls under Somalia, SOM), and the
// old list's SLL is really the ISO 4217 currency code for the Sierra Leonean
// Leone. Use Natural Earth's ADM0_A3 instead, as Kosovo (KOS) already does.
const ISO_CORRECTION = { SLL: 'SOL' };

const oldList = JSON.parse(fs.readFileSync(OLD, 'utf8'));
const geo = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
const byIso = new Map(geo.features.map((f) => [f.properties.isoName, f]));

const round4 = (c) =>
  Array.isArray(c) ? c.map(round4) : Math.round(c * 1e4) / 1e4;

const norm = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const features = [];
const report = { fromOldGeometry: [], noCapital: [], renamed: [] };

for (const entry of oldList) {
  const o = entry.properties;
  const isoName = ISO_CORRECTION[o.ISO_A3] ?? o.ISO_A3;
  const match = byIso.get(isoName);

  // Keep the old app's display name; Natural Earth's spelling becomes an alias
  // so both still match what the player types.
  const fullName = o.ADMIN;
  const aliases = [
    ...(o.names ?? []),
    ...(match?.properties.alternativeNames ?? []),
    match?.properties.fullName,
  ].filter(Boolean);

  const seen = new Set([norm(fullName)]);
  const alternativeNames = [];
  for (const alias of aliases) {
    const key = norm(alias);
    if (key && !seen.has(key)) {
      seen.add(key);
      alternativeNames.push(alias);
    }
  }

  if (match && match.properties.fullName !== fullName) {
    report.renamed.push(
      `${isoName} ${match.properties.fullName} -> ${fullName}`,
    );
  }

  const capitalCity = (o.capital_city ?? '').trim();
  if (!capitalCity) report.noCapital.push(`${isoName} ${fullName}`);

  // Natural Earth 1:50m omits Gibraltar, so fall back to the old app's geometry.
  let geometry;
  if (match) {
    geometry = match.geometry;
  } else {
    geometry = {
      ...entry.geometry,
      coordinates: round4(entry.geometry.coordinates),
    };
    report.fromOldGeometry.push(`${isoName} ${fullName}`);
  }

  features.push({
    type: 'Feature',
    properties: {
      isoName,
      fullName,
      alternativeNames,
      centreCoords: o.center_coords,
      capitalCity,
    },
    geometry,
  });
}

fs.writeFileSync(OUT, JSON.stringify({ type: 'FeatureCollection', features }));

// ---- verification -------------------------------------------------------
const KEYS = [
  'isoName',
  'fullName',
  'alternativeNames',
  'centreCoords',
  'capitalCity',
];
const problems = [];
const isos = new Set();

for (const f of features) {
  const p = f.properties;
  const keys = Object.keys(p);
  if (keys.length !== KEYS.length || !KEYS.every((k) => keys.includes(k))) {
    problems.push(`${p.isoName}: property set is ${keys.join(',')}`);
  }
  if (typeof p.fullName !== 'string' || !p.fullName)
    problems.push(`${p.isoName}: bad fullName`);
  if (!Array.isArray(p.alternativeNames))
    problems.push(`${p.isoName}: alternativeNames not an array`);
  if (p.alternativeNames.some((n) => typeof n !== 'string' || !n))
    problems.push(`${p.isoName}: blank alias`);
  if (typeof p.capitalCity !== 'string')
    problems.push(`${p.isoName}: bad capitalCity`);
  if (
    !Array.isArray(p.centreCoords) ||
    p.centreCoords.length !== 2 ||
    !p.centreCoords.every((n) => typeof n === 'number' && Number.isFinite(n))
  ) {
    problems.push(`${p.isoName}: bad centreCoords`);
  }
  const [lat, lng] = p.centreCoords;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180)
    problems.push(`${p.isoName}: centreCoords out of range`);
  if (!f.geometry?.type || !f.geometry?.coordinates)
    problems.push(`${p.isoName}: missing geometry`);
  if (isos.has(p.isoName)) problems.push(`${p.isoName}: duplicate isoName`);
  isos.add(p.isoName);
}

// An alias must not collide with another country's name.
const owner = new Map();
for (const f of features) {
  const p = f.properties;
  for (const n of [p.fullName, ...p.alternativeNames]) {
    const k = norm(n);
    if (owner.has(k) && owner.get(k) !== p.isoName) {
      problems.push(
        `name "${n}" claimed by both ${owner.get(k)} and ${p.isoName}`,
      );
    }
    owner.set(k, p.isoName);
  }
}

console.log('features written:', features.length, '->', OUT);
console.log('size:', (fs.statSync(OUT).size / 1024 / 1024).toFixed(2), 'MB');
console.log(
  'geometry from old app:',
  report.fromOldGeometry.join(', ') || 'none',
);
console.log('display names kept from old app:', report.renamed.length);
console.log('empty capitalCity:', report.noCapital.join(', ') || 'none');
console.log(
  'countries with aliases:',
  features.filter((f) => f.properties.alternativeNames.length).length,
);
console.log(
  problems.length
    ? `\nPROBLEMS (${problems.length}):`
    : '\nvalidation: all checks passed',
);
problems.forEach((p) => console.log('  ', p));
