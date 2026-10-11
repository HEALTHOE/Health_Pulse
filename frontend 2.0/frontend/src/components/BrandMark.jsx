// HealthPulse logomark: a rounded tile carrying a single ECG trace.
const BrandMark = ({ size = 36, className = "" }) => (
  <span
    aria-hidden="true"
    className={`inline-flex shrink-0 items-center justify-center rounded-[10px] bg-brand-600 ${className}`}
    style={{ width: size, height: size }}
  >
    <svg
      width={size * 0.62}
      height={size * 0.62}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#ffffff"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12.5h4.2l2.3-6.2 4 12 2.5-5.8H22" />
    </svg>
  </span>
);

export default BrandMark;
