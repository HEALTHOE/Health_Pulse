import { useEffect, useState } from "react";
import { TONES, toPercent } from "./status";

// 270° instrument-style gauge. The arc length is only a visual
// representation of the value passed in; the number shown comes
// from `children` (the untouched API value).
const ScoreRing = ({ value, tone = "neutral", size = 168, stroke = 12, label, children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const arc = circumference * 0.75;
  const pct = toPercent(value);
  const filled = mounted ? (arc * pct) / 100 : 0;

  const common = {
    cx: size / 2,
    cy: size / 2,
    r: radius,
    fill: "none",
    strokeWidth: stroke,
    strokeLinecap: "round",
    transform: `rotate(135 ${size / 2} ${size / 2})`,
  };

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={label}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          {...common}
          stroke="var(--color-line)"
          strokeDasharray={`${arc} ${circumference}`}
        />
        <circle
          {...common}
          stroke={TONES[tone].hex}
          strokeDasharray={`${filled} ${circumference}`}
          style={{ transition: "stroke-dasharray 900ms cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center pb-2 text-center">
        {children}
      </div>
    </div>
  );
};

export default ScoreRing;
