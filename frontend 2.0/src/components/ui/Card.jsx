import { TONES } from "./status";

export const Card = ({ as: Tag = "section", className = "", children, ...rest }) => (
  <Tag
    className={`rounded-xl border border-line bg-surface shadow-card ${className}`}
    {...rest}
  >
    {children}
  </Tag>
);

export const SectionHeader = ({ id, title, description, action, className = "" }) => (
  <div
    className={`flex flex-wrap items-end justify-between gap-x-4 gap-y-2 ${className}`}
  >
    <div className="min-w-0">
      <h2 id={id} className="text-lg font-semibold text-ink">
        {title}
      </h2>
      {description && (
        <p className="mt-0.5 text-sm text-ink-3">{description}</p>
      )}
    </div>
    {action}
  </div>
);

// Round icon tile used in headers and cards. Tone only tints it.
export const IconTile = ({ icon: Icon, tone = "info", size = "md" }) => {
  const t = TONES[tone];
  const box = size === "lg" ? "h-12 w-12" : size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const glyph = size === "lg" ? 22 : size === "sm" ? 16 : 19;

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-lg border ${box} ${t.bg} ${t.border}`}
    >
      <Icon size={glyph} className={t.icon} />
    </span>
  );
};

// Thin horizontal scale for 0–100 values.
export const ProgressBar = ({ value, tone = "info", label, size = "sm", className = "" }) => {
  const numeric = Number(value);
  const pct = Number.isFinite(numeric) ? Math.min(Math.max(numeric, 0), 100) : 0;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={`${size === "lg" ? "h-3" : "h-1.5"} w-full overflow-hidden rounded-full bg-line ${className}`}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-700 ease-out ${TONES[tone].bar}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};
