import { Card } from "./Card";
import { CHART } from "./chartTheme";

// Key under the chart title: what the line and dashed line mean.
export const ChartLegend = ({ seriesLabel, targetLabel }) => (
  <ul className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-ink-3">
    <li className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className="inline-block h-0.5 w-5 rounded-full"
        style={{ background: CHART.line }}
      />
      {seriesLabel}
    </li>

    {targetLabel && (
      <li className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="inline-block w-5 border-t-2 border-dashed"
          style={{ borderColor: CHART.target }}
        />
        {targetLabel}
      </li>
    )}
  </ul>
);

const ChartCard = ({ title, description, legend, controls, children, className = "" }) => (
  <Card className={`p-5 sm:p-6 ${className}`}>
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-ink-3">{description}</p>}
        {legend && <div className="mt-3">{legend}</div>}
      </div>

      {controls && <div className="w-full shrink-0 md:w-64">{controls}</div>}
    </div>

    <div className="mt-6">{children}</div>
  </Card>
);

export default ChartCard;
