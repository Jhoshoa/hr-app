export const formatShortDate = (value: string | Date, locale = "es-BO") =>
  new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
