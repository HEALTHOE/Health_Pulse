import { Card, IconTile, ProgressBar } from "./Card";
import StatusBadge from "./StatusBadge";
import { toneForStatus } from "./status";

// "What is it, what is its value, is it healthy?" in one glance.
// `display` is the already-formatted string shown to the user;
// `value` only drives the scale underneath.
const IndicatorCard = ({ name, display, value, status, statusFallbackTone, icon }) => {
  const tone = toneForStatus(status, statusFallbackTone);

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {icon && <IconTile icon={icon} tone="info" size="sm" />}
          <p className="text-sm font-medium text-ink-2">{name}</p>
        </div>

        <StatusBadge status={status} fallbackTone={statusFallbackTone} size="sm" />
      </div>

      <p className="num mt-4 text-3xl font-semibold leading-none tracking-tight text-ink">
        {display}
      </p>

      <ProgressBar
        className="mt-4"
        value={value}
        tone={tone}
        label={`${name} value`}
      />
    </Card>
  );
};

export default IndicatorCard;
