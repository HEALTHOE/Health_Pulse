// Single source of truth for the semantic status palette.
// NORMAL -> ok (green) · WARNING -> warn (amber) · CRITICAL -> crit (red)
// NO_DATA / unknown -> neutral (slate) · info (brand blue) is for non-severity states.

export const TONES = {
  ok: {
    text: "text-ok-700",
    bg: "bg-ok-50",
    border: "border-ok-100",
    dot: "bg-ok-600",
    bar: "bg-ok-600",
    icon: "text-ok-600",
    hex: "#1e8a5b",
  },
  warn: {
    text: "text-warn-700",
    bg: "bg-warn-50",
    border: "border-warn-100",
    dot: "bg-warn-500",
    bar: "bg-warn-500",
    icon: "text-warn-700",
    hex: "#d99a1b",
  },
  crit: {
    text: "text-crit-700",
    bg: "bg-crit-50",
    border: "border-crit-100",
    dot: "bg-crit-600",
    bar: "bg-crit-600",
    icon: "text-crit-600",
    hex: "#c8372f",
  },
  neutral: {
    text: "text-ink-2",
    bg: "bg-sunken",
    border: "border-line",
    dot: "bg-ink-4",
    bar: "bg-ink-4",
    icon: "text-ink-3",
    hex: "#8795a8",
  },
  info: {
    text: "text-brand-700",
    bg: "bg-brand-50",
    border: "border-brand-100",
    dot: "bg-brand-600",
    bar: "bg-brand-600",
    icon: "text-brand-600",
    hex: "#1d5fb0",
  },
};

export const toneForStatus = (status, fallback = "neutral") => {
  const normalized = String(status ?? "").toUpperCase();

  if (normalized === "NORMAL") return "ok";
  if (normalized === "WARNING") return "warn";
  if (normalized === "CRITICAL") return "crit";
  if (normalized === "NO_DATA") return "neutral";

  return fallback;
};

// "NO_DATA" -> "No data", "WARNING" -> "Warning"
export const formatStatus = (status) => {
  const text = String(status ?? "")
    .replace(/_/g, " ")
    .toLowerCase();

  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "—";
};

// Clamp any API-provided number to 0–100 for visual scales only.
// (Never used to change a displayed value.)
export const toPercent = (value) => {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) return 0;

  return Math.min(Math.max(numeric, 0), 100);
};
