import { useId } from "react";
import { ChevronDown, Search } from "lucide-react";

export const SelectField = ({
  id,
  label,
  hideLabel = false,
  value,
  onChange,
  children,
  className = "",
}) => {
  const generatedId = useId();
  const selectId = id || generatedId;

  return (
    <div className={className}>
      <label
        htmlFor={selectId}
        className={hideLabel ? "sr-only" : "mb-1.5 block text-xs font-medium text-ink-3"}
      >
        {label}
      </label>

      <div className="relative">
        <select
          id={selectId}
          value={value}
          onChange={onChange}
          className="w-full appearance-none rounded-lg border border-line-strong bg-surface py-2.5 pl-3.5 pr-10 text-sm text-ink shadow-card transition-colors hover:border-ink-4 focus:border-brand-600"
        >
          {children}
        </select>

        <ChevronDown
          size={16}
          aria-hidden="true"
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-3"
        />
      </div>
    </div>
  );
};

export const SearchField = ({ label, value, onChange, placeholder, className = "" }) => {
  const id = useId();

  return (
    <div className={className}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>

      <div className="relative">
        <Search
          size={17}
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-4"
        />

        <input
          id={id}
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full rounded-lg border border-line-strong bg-surface py-2.5 pl-10 pr-4 text-sm text-ink shadow-card transition-colors placeholder:text-ink-4 hover:border-ink-4 focus:border-brand-600"
        />
      </div>
    </div>
  );
};
