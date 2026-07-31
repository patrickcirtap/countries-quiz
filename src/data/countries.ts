// Every feature in countries.geojson carries all of these; alternativeNames
// and capitalCity may be empty, but are never absent.
export interface CountryProperties {
  isoName: string;
  fullName: string;
  alternativeNames: string[];
  centreCoords: [number, number];
  capitalCity: string;
}

export type CountriesData = GeoJSON.FeatureCollection<
  GeoJSON.Geometry,
  CountryProperties
>;
