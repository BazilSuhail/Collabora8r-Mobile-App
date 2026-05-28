const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;
const WEEK_HOURS = 40;
const DAY_HOURS = 8;

const toDate = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

// Hermes may ship without Intl.RelativeTimeFormat. Fall back to plain English wording.
const relFormat =
  typeof Intl !== "undefined" && typeof Intl.RelativeTimeFormat === "function"
    ? new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })
    : {
        format(value, unit) {
          if (unit === "day" && value === -1) return "yesterday";
          if (unit === "day" && value === 1) return "tomorrow";
          const n = Math.abs(value);
          const label = `${n} ${unit}${n === 1 ? "" : "s"}`;
          return value < 0 ? `${label} ago` : `in ${label}`;
        },
      };

export function relativeTime(value, now = Date.now()) {
  const date = toDate(value);
  if (!date) return "";
  const diff = date.getTime() - now;
  const abs = Math.abs(diff);
  if (abs < MINUTE) return "just now";
  if (abs >= 30 * DAY) return formatDate(date);
  const units = [
    ["day", DAY],
    ["hour", 60 * MINUTE],
    ["minute", MINUTE],
  ];
  for (const [unit, size] of units) {
    if (abs >= size) return relFormat.format(Math.round(diff / size), unit);
  }
  return relFormat.format(Math.round(diff / MINUTE), "minute");
}

export function formatDate(value, options = { dateStyle: "medium" }) {
  const date = toDate(value);
  return date ? new Intl.DateTimeFormat(undefined, options).format(date) : "";
}

export function formatDateTime(value) {
  return formatDate(value, { dateStyle: "medium", timeStyle: "short" });
}

export function formatNumber(value, options = {}) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "";
  return new Intl.NumberFormat(undefined, options).format(Number(value));
}

export function formatMoney(amount, currency = "USD") {
  if (amount === null || amount === undefined || !Number.isFinite(Number(amount))) return "";
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(Number(amount));
}

// Takes seconds, returns "1h 30m", "2h", "45m" or "0m".
export function formatDuration(seconds) {
  const minutes = Math.round(Number(seconds) / 60);
  if (!Number.isFinite(minutes) || minutes <= 0) return "0m";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return [hours && `${hours}h`, rest && `${rest}m`].filter(Boolean).join(" ");
}

const UNIT_SECONDS = {
  w: WEEK_HOURS * 3600,
  d: DAY_HOURS * 3600,
  h: 3600,
  m: 60,
};

// Accepts "1h 30m", "1.5h", "2d", "90m". Returns seconds, or null when the text is not a duration.
export function parseDuration(text) {
  const source = String(text ?? "").trim().toLowerCase();
  if (!source) return null;
  let total = 0;
  let consumed = "";
  for (const match of source.matchAll(/(\d+(?:\.\d+)?)\s*([wdhm])/g)) {
    total += Number(match[1]) * UNIT_SECONDS[match[2]];
    consumed += match[0];
  }
  if (!consumed || consumed.replace(/\s/g, "") !== source.replace(/\s/g, "")) return null;
  return Math.round(total);
}
