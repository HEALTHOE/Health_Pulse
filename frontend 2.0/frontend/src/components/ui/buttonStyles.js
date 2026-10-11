const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50";

const variants = {
  primary: "bg-brand-600 text-white shadow-card hover:bg-brand-700 active:bg-brand-700",
  secondary:
    "border border-line-strong bg-surface text-ink shadow-card hover:border-ink-4 hover:bg-sunken",
  ghost: "text-brand-700 hover:bg-brand-50",
  danger: "bg-crit-600 text-white shadow-card hover:bg-crit-700 active:bg-crit-700",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-[15px]",
};

export const buttonClasses = ({ variant = "primary", size = "md", className = "" } = {}) =>
  `${base} ${variants[variant]} ${sizes[size]} ${className}`;

