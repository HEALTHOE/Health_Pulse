import { Card, IconTile } from "./Card";

// Stand-alone KPI: label, prominent value, optional supporting line.
export const KpiCard = ({
  label,
  value,
  hint,
  icon,
  tone = "info",
  valueClassName = "text-ink",
  children,
  className = "",
}) => (
  <Card className={`p-5 ${className}`}>
    <div className="flex items-start justify-between gap-3">
      <p className="text-sm font-medium text-ink-3">{label}</p>
      {icon && <IconTile icon={icon} tone={tone} size="sm" />}
    </div>

    <p
      className={`num mt-3 text-3xl font-semibold leading-none tracking-tight ${valueClassName}`}
    >
      {value}
    </p>

    {hint && <p className="mt-2 text-xs text-ink-3">{hint}</p>}

    {children}
  </Card>
);

// A single card split into cells – denser than a row of separate cards.
export const StatStrip = ({ items, columns = "lg:grid-cols-4", className = "" }) => (
  <div
    className={`grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line shadow-card sm:grid-cols-2 ${columns} ${className}`}
  >
    {items.map((item) => (
      <div key={item.label} className="bg-surface p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-ink-3">{item.label}</p>
          {item.icon && <IconTile icon={item.icon} tone={item.tone || "info"} size="sm" />}
        </div>

        <div
          className={`num mt-3 text-2xl font-semibold leading-none tracking-tight ${
            item.valueClassName || "text-ink"
          }`}
        >
          {item.value}
        </div>

        {item.hint && <p className="mt-2 text-xs text-ink-3">{item.hint}</p>}
      </div>
    ))}
  </div>
);
