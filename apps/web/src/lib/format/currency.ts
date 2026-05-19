export const formatCurrency = (value: number, currency = "USD", locale = "en-US") =>
  new Intl.NumberFormat(locale, {
    currency,
    maximumFractionDigits: 0,
    style: "currency"
  }).format(value);
