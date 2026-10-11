import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { Card } from "./Card";
import Button from "./Button";

export const LoadingState = ({ label = "Loading…", className = "" }) => (
  <Card
    role="status"
    aria-live="polite"
    className={`flex items-center justify-center px-6 py-16 ${className}`}
  >
    <div className="flex items-center gap-3 text-sm text-ink-3">
      <Loader2 size={18} className="animate-spin text-brand-600" aria-hidden="true" />
      {label}
    </div>
  </Card>
);

export const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse rounded-md bg-line ${className}`} />
);

export const CardSkeleton = ({ lines = 2 }) => (
  <Card className="p-6" aria-hidden="true">
    <Skeleton className="h-4 w-28" />
    <Skeleton className="mt-4 h-8 w-24" />
    {Array.from({ length: lines - 1 }).map((_, index) => (
      <Skeleton key={index} className="mt-3 h-3 w-full" />
    ))}
  </Card>
);

export const ErrorState = ({ title = "Something went wrong", message, onRetry, className = "" }) => (
  <div
    role="alert"
    className={`flex items-start gap-3.5 rounded-xl border border-crit-100 bg-crit-50 p-5 ${className}`}
  >
    <AlertCircle size={20} className="mt-0.5 shrink-0 text-crit-600" aria-hidden="true" />

    <div className="min-w-0 flex-1">
      <p className="font-semibold text-crit-700">{title}</p>
      {message && <p className="mt-1 text-sm text-crit-700/90">{message}</p>}

      {onRetry && (
        <Button variant="danger" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw size={15} aria-hidden="true" />
          Retry
        </Button>
      )}
    </div>
  </div>
);

export const EmptyState = ({ icon: Icon, title, description, className = "" }) => (
  <Card className={`flex flex-col items-center px-6 py-14 text-center ${className}`}>
    {Icon && (
      <span
        aria-hidden="true"
        className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-line bg-sunken text-ink-4"
      >
        <Icon size={22} />
      </span>
    )}
    <p className="mt-4 font-semibold text-ink">{title}</p>
    {description && <p className="mt-1 max-w-sm text-sm text-ink-3">{description}</p>}
  </Card>
);
