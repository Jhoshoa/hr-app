import { DEFAULT_TIME_ZONE, formatDateInTimeZone } from "@hr-app/timezones";

export const formatShortDate = (
  value: string | Date,
  input: { readonly locale?: string; readonly timeZone?: string } = {}
) =>
  formatDateInTimeZone(value, {
    dateStyle: "medium",
    locale: input.locale ?? "en-US",
    timeZone: input.timeZone ?? DEFAULT_TIME_ZONE
  });
