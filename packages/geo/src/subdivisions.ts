import type { CountryCode } from "./country-types";
import type { SubdivisionCode, SubdivisionMetadata } from "./subdivision-types";

const country = (value: string) => value as CountryCode;
const subdivision = (value: string) => value as SubdivisionCode;

export const AMERICA_SUBDIVISIONS = [
  { code: subdivision("BO-B"), countryCode: country("BO"), name: "Beni" },
  { code: subdivision("BO-C"), countryCode: country("BO"), name: "Cochabamba" },
  { code: subdivision("BO-H"), countryCode: country("BO"), name: "Chuquisaca" },
  { code: subdivision("BO-L"), countryCode: country("BO"), name: "La Paz" },
  { code: subdivision("BO-N"), countryCode: country("BO"), name: "Pando" },
  { code: subdivision("BO-O"), countryCode: country("BO"), name: "Oruro" },
  { code: subdivision("BO-P"), countryCode: country("BO"), name: "Potosi" },
  { code: subdivision("BO-S"), countryCode: country("BO"), name: "Santa Cruz" },
  { code: subdivision("BO-T"), countryCode: country("BO"), name: "Tarija" },
  { code: subdivision("US-CA"), countryCode: country("US"), name: "California" },
  { code: subdivision("US-FL"), countryCode: country("US"), name: "Florida" },
  { code: subdivision("US-NY"), countryCode: country("US"), name: "New York" },
  { code: subdivision("US-TX"), countryCode: country("US"), name: "Texas" },
  { code: subdivision("US-WA"), countryCode: country("US"), name: "Washington" },
  { code: subdivision("MX-CMX"), countryCode: country("MX"), name: "Ciudad de Mexico" },
  { code: subdivision("MX-JAL"), countryCode: country("MX"), name: "Jalisco" },
  { code: subdivision("MX-NLE"), countryCode: country("MX"), name: "Nuevo Leon" },
  { code: subdivision("CO-ANT"), countryCode: country("CO"), name: "Antioquia" },
  { code: subdivision("CO-DC"), countryCode: country("CO"), name: "Bogota D.C." },
  { code: subdivision("CO-VAC"), countryCode: country("CO"), name: "Valle del Cauca" },
  { code: subdivision("PE-ARE"), countryCode: country("PE"), name: "Arequipa" },
  { code: subdivision("PE-CUS"), countryCode: country("PE"), name: "Cusco" },
  { code: subdivision("PE-LIM"), countryCode: country("PE"), name: "Lima" },
  { code: subdivision("AR-B"), countryCode: country("AR"), name: "Buenos Aires" },
  { code: subdivision("AR-C"), countryCode: country("AR"), name: "Ciudad Autonoma de Buenos Aires" },
  { code: subdivision("AR-X"), countryCode: country("AR"), name: "Cordoba" },
  { code: subdivision("CL-RM"), countryCode: country("CL"), name: "Region Metropolitana de Santiago" },
  { code: subdivision("CL-VS"), countryCode: country("CL"), name: "Valparaiso" },
  { code: subdivision("BR-RJ"), countryCode: country("BR"), name: "Rio de Janeiro" },
  { code: subdivision("BR-SP"), countryCode: country("BR"), name: "Sao Paulo" }
] as const satisfies readonly SubdivisionMetadata[];

export const getAmericaSubdivisions = (): readonly SubdivisionMetadata[] => AMERICA_SUBDIVISIONS;
