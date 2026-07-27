export interface CountryProperties {
  isoName: string;
  fullName: string;
  alternativeNames?: string[];
  centreCoords: [number, number];
}

export type CountriesData = GeoJSON.FeatureCollection<
  GeoJSON.Geometry,
  CountryProperties
>;
