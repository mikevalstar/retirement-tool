import dayjs from "dayjs";

export { dayjs };

export const DATE_FORMATS = {
  ISO: "YYYY-MM-DD",
  DISPLAY: "MMM D, YYYY",
  MONTH_DAY: "MMM D",
  MONTH_YEAR: "MMM YYYY",
} as const;
