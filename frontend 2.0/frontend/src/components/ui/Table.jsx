// Semantic table primitives. The wrapper scrolls horizontally on small
// screens so wide tables stay usable instead of being squeezed.
export const TableShell = ({ children, className = "" }) => (
  <div
    className={`scrollbar-thin overflow-x-auto rounded-xl border border-line bg-surface shadow-card ${className}`}
  >
    {children}
  </div>
);

export const Table = ({ children, minWidth = "min-w-[34rem]" }) => (
  <table className={`w-full border-collapse text-sm ${minWidth}`}>{children}</table>
);

export const Th = ({ children, align = "left", className = "" }) => (
  <th
    scope="col"
    className={`border-b border-line bg-sunken px-5 py-3 text-xs font-semibold text-ink-3 ${
      align === "right" ? "text-right" : "text-left"
    } ${className}`}
  >
    {children}
  </th>
);

export const Tr = ({ children, className = "" }) => (
  <tr className={`border-b border-line last:border-b-0 transition-colors hover:bg-sunken ${className}`}>
    {children}
  </tr>
);

export const Td = ({ children, align = "left", className = "" }) => (
  <td
    className={`px-5 py-3.5 align-middle text-ink-2 ${
      align === "right" ? "text-right" : "text-left"
    } ${className}`}
  >
    {children}
  </td>
);
