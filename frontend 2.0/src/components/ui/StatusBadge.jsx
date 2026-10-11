import { TONES, formatStatus, toneForStatus } from "./status";

const StatusBadge = ({ status, tone, fallbackTone, size = "md", children }) => {
  const resolved = TONES[tone || toneForStatus(status, fallbackTone)];

  const sizing =
    size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border font-medium ${sizing} ${resolved.text} ${resolved.bg} ${resolved.border}`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${resolved.dot}`}
      />
      {children ?? formatStatus(status)}
    </span>
  );
};

export default StatusBadge;
