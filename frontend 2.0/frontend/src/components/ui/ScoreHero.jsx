import { Card } from "./Card";
import ScoreRing from "./ScoreRing";
import StatusBadge from "./StatusBadge";
import { toneForStatus } from "./status";

// Health score presentation shared by dashboard, district and block pages.
// `score` is displayed exactly as supplied; `scoreValue` only drives the arc.
const ScoreHero = ({
  contextLabel,
  title,
  score,
  scoreValue,
  status,
  statusFallbackTone,
  caption,
  scoreAriaLabel = "Health score",
  className = "",
  children,
}) => {
  const tone = toneForStatus(status, statusFallbackTone);

  return (
    <Card className={`p-6 sm:p-7 ${className}`}>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
        <ScoreRing
          value={scoreValue ?? score}
          tone={tone}
          label={`${scoreAriaLabel}: ${score ?? "not available"}`}
        >
          <span className="num text-4xl font-semibold leading-none tracking-tight text-ink">
            {score ?? "—"}
          </span>
          <span className="mt-1.5 text-xs font-medium text-ink-3">Health score</span>
        </ScoreRing>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          {contextLabel && <p className="text-sm text-ink-3">{contextLabel}</p>}

          {title && (
            <h2 className="mt-0.5 text-2xl font-semibold leading-tight text-ink">
              {title}
            </h2>
          )}

          <div
            className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:justify-start ${
              title || contextLabel ? "mt-3" : ""
            }`}
          >
            <StatusBadge status={status} fallbackTone={statusFallbackTone} />
            {caption && <span className="text-sm text-ink-3">{caption}</span>}
          </div>

          {children}
        </div>
      </div>
    </Card>
  );
};

export default ScoreHero;
