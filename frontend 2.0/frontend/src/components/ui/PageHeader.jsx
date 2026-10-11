import { ArrowLeft } from "lucide-react";

export const BackLink = ({ onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className="-ml-1.5 inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm font-medium text-ink-3 transition-colors hover:bg-brand-50 hover:text-brand-700"
  >
    <ArrowLeft size={16} aria-hidden="true" />
    {children}
  </button>
);

const PageHeader = ({ title, description, icon: Icon, back, meta, actions }) => (
  <header className="mb-6 lg:mb-8">
    {back && <div className="mb-3">{back}</div>}

    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="flex min-w-0 items-start gap-3.5">
        {Icon && (
          <span
            aria-hidden="true"
            className="mt-0.5 hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-white sm:inline-flex"
          >
            <Icon size={21} />
          </span>
        )}

        <div className="min-w-0">
          <h1 className="text-2xl font-semibold leading-tight text-ink sm:text-[26px]">
            {title}
          </h1>
          {description && (
            <p className="mt-1 max-w-2xl text-[15px] text-ink-3">{description}</p>
          )}
        </div>
      </div>

      {(meta || actions) && (
        <div className="flex flex-wrap items-center gap-3">
          {meta}
          {actions}
        </div>
      )}
    </div>
  </header>
);

export default PageHeader;
