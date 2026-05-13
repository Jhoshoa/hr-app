export const formatCurrency = (value: number, currency = "BOB", locale = "es-BO") =>
  new Intl.NumberFormat(locale, {
    currency,
    maximumFractionDigits: 0,
    style: "currency"
  }).format(value);
