-- Normalize legacy country values that were stored before country became ISO alpha-2.
UPDATE "CompanySignupRequest"
SET "country" = CASE lower(trim("country"))
  WHEN 'bolivia' THEN 'BO'
  WHEN 'bo' THEN 'BO'
  WHEN 'united states' THEN 'US'
  WHEN 'united states of america' THEN 'US'
  WHEN 'usa' THEN 'US'
  WHEN 'us' THEN 'US'
  WHEN 'eeuu' THEN 'US'
  WHEN 'méxico' THEN 'MX'
  WHEN 'mexico' THEN 'MX'
  WHEN 'mx' THEN 'MX'
  WHEN 'colombia' THEN 'CO'
  WHEN 'co' THEN 'CO'
  WHEN 'peru' THEN 'PE'
  WHEN 'perú' THEN 'PE'
  WHEN 'pe' THEN 'PE'
  WHEN 'argentina' THEN 'AR'
  WHEN 'ar' THEN 'AR'
  WHEN 'chile' THEN 'CL'
  WHEN 'cl' THEN 'CL'
  WHEN 'brazil' THEN 'BR'
  WHEN 'brasil' THEN 'BR'
  WHEN 'br' THEN 'BR'
  ELSE "country"
END
WHERE "country" IS NOT NULL;

UPDATE "Location"
SET "country" = CASE lower(trim("country"))
  WHEN 'bolivia' THEN 'BO'
  WHEN 'bo' THEN 'BO'
  WHEN 'united states' THEN 'US'
  WHEN 'united states of america' THEN 'US'
  WHEN 'usa' THEN 'US'
  WHEN 'us' THEN 'US'
  WHEN 'eeuu' THEN 'US'
  WHEN 'méxico' THEN 'MX'
  WHEN 'mexico' THEN 'MX'
  WHEN 'mx' THEN 'MX'
  WHEN 'colombia' THEN 'CO'
  WHEN 'co' THEN 'CO'
  WHEN 'peru' THEN 'PE'
  WHEN 'perú' THEN 'PE'
  WHEN 'pe' THEN 'PE'
  WHEN 'argentina' THEN 'AR'
  WHEN 'ar' THEN 'AR'
  WHEN 'chile' THEN 'CL'
  WHEN 'cl' THEN 'CL'
  WHEN 'brazil' THEN 'BR'
  WHEN 'brasil' THEN 'BR'
  WHEN 'br' THEN 'BR'
  ELSE "country"
END;

-- Location.country is required. Unknown legacy values become the product default.
UPDATE "Location"
SET "country" = 'US'
WHERE "country" NOT IN ('BO', 'US', 'MX', 'CO', 'PE', 'AR', 'CL', 'BR');

-- Company signup country is optional. Unknown legacy values should not masquerade as valid codes.
UPDATE "CompanySignupRequest"
SET "country" = NULL
WHERE "country" IS NOT NULL
  AND "country" NOT IN ('BO', 'US', 'MX', 'CO', 'PE', 'AR', 'CL', 'BR');

-- Normalize timezones to the current product-supported catalog.
UPDATE "Tenant"
SET "timezone" = 'America/New_York'
WHERE "timezone" NOT IN (
  'America/New_York',
  'America/Detroit',
  'America/Kentucky/Louisville',
  'America/Kentucky/Monticello',
  'America/Indiana/Indianapolis',
  'America/Indiana/Vincennes',
  'America/Indiana/Winamac',
  'America/Indiana/Marengo',
  'America/Indiana/Petersburg',
  'America/Indiana/Vevay',
  'America/Chicago',
  'America/Indiana/Tell_City',
  'America/Indiana/Knox',
  'America/Menominee',
  'America/North_Dakota/Center',
  'America/North_Dakota/New_Salem',
  'America/North_Dakota/Beulah',
  'America/Denver',
  'America/Boise',
  'America/Phoenix',
  'America/Los_Angeles',
  'America/Anchorage',
  'America/Juneau',
  'America/Sitka',
  'America/Metlakatla',
  'America/Yakutat',
  'America/Nome',
  'America/Adak',
  'Pacific/Honolulu',
  'America/Puerto_Rico',
  'America/La_Paz',
  'America/Mexico_City',
  'America/Tijuana',
  'America/Cancun',
  'America/Bogota',
  'America/Lima',
  'America/Argentina/Buenos_Aires',
  'America/Santiago',
  'America/Sao_Paulo',
  'UTC'
);

UPDATE "Location" AS location
SET "timezone" = tenant."timezone"
FROM "Tenant" AS tenant
WHERE location."tenantId" = tenant."id"
  AND location."timezone" NOT IN (
    'America/New_York',
    'America/Detroit',
    'America/Kentucky/Louisville',
    'America/Kentucky/Monticello',
    'America/Indiana/Indianapolis',
    'America/Indiana/Vincennes',
    'America/Indiana/Winamac',
    'America/Indiana/Marengo',
    'America/Indiana/Petersburg',
    'America/Indiana/Vevay',
    'America/Chicago',
    'America/Indiana/Tell_City',
    'America/Indiana/Knox',
    'America/Menominee',
    'America/North_Dakota/Center',
    'America/North_Dakota/New_Salem',
    'America/North_Dakota/Beulah',
    'America/Denver',
    'America/Boise',
    'America/Phoenix',
    'America/Los_Angeles',
    'America/Anchorage',
    'America/Juneau',
    'America/Sitka',
    'America/Metlakatla',
    'America/Yakutat',
    'America/Nome',
    'America/Adak',
    'Pacific/Honolulu',
    'America/Puerto_Rico',
    'America/La_Paz',
    'America/Mexico_City',
    'America/Tijuana',
    'America/Cancun',
    'America/Bogota',
    'America/Lima',
    'America/Argentina/Buenos_Aires',
    'America/Santiago',
    'America/Sao_Paulo',
    'UTC'
  );

-- Normalize existing company signup phones only when they already carry a supported calling code.
WITH normalized_phone AS (
  SELECT
    "id",
    CASE
      WHEN regexp_replace(trim("phone"), '[\s().-]', '', 'g') LIKE '00%'
        THEN '+' || substring(regexp_replace(trim("phone"), '[\s().-]', '', 'g') from 3)
      ELSE regexp_replace(trim("phone"), '[\s().-]', '', 'g')
    END AS candidate
  FROM "CompanySignupRequest"
  WHERE "phone" IS NOT NULL
)
UPDATE "CompanySignupRequest" AS request
SET "phone" = normalized_phone.candidate
FROM normalized_phone
WHERE request."id" = normalized_phone."id"
  AND normalized_phone.candidate ~ '^\+[1-9][0-9]{7,14}$'
  AND (
    normalized_phone.candidate LIKE '+1%'
    OR normalized_phone.candidate LIKE '+591%'
    OR normalized_phone.candidate LIKE '+52%'
    OR normalized_phone.candidate LIKE '+57%'
    OR normalized_phone.candidate LIKE '+51%'
    OR normalized_phone.candidate LIKE '+54%'
    OR normalized_phone.candidate LIKE '+56%'
    OR normalized_phone.candidate LIKE '+55%'
  );
