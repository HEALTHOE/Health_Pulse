import { useEffect, useState } from "react";
import {
  Database,
  CheckCircle,
  AlertCircle,
  Upload,
  FileText,
  Clock,
} from "lucide-react";
import api from "../services/api";
import {
  Card,
  ErrorState,
  IconTile,
  KpiCard,
  LoadingState,
  PageHeader,
  ProgressBar,
  SectionHeader,
  StatusBadge,
} from "../components/ui";

const DataQuality = () => {
  const [quality, setQuality] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchQuality = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/api/data/quality");
        setQuality(response.data);
      } catch (err) {
        const message =
          err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Failed to load data quality information.";

        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuality();
  }, []);

  if (loading) {
    return (
      <div>
        <PageHeader
          title="Data Quality"
          description="Review data completeness, validity, and quality issues."
        />

        <LoadingState label="Loading data quality information..." />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader
          title="Data Quality"
          description="Review data completeness, validity, and quality issues."
        />

        <ErrorState
          title="Unable to load data quality information"
          message={error}
        />
      </div>
    );
  }

  const qualityMetrics = [
    {
      label: "Total Records",
      value: quality.total_records,
      description: "Records currently in the system",
      icon: Database,
      tone: "neutral",
      valueClass: "text-ink",
    },
    {
      label: "Uploaded Rows",
      value: quality.uploaded_rows,
      description: "Rows processed from uploads",
      icon: Upload,
      tone: "info",
      valueClass: "text-brand-700",
    },
    {
      label: "Valid Rows",
      value: quality.valid_rows,
      description: "Rows passing validation",
      icon: CheckCircle,
      tone: "ok",
      valueClass: "text-ok-700",
    },
    {
      label: "Invalid Rows",
      value: quality.invalid_rows,
      description: "Rows failing validation",
      icon: AlertCircle,
      tone: quality.invalid_rows > 0 ? "crit" : "ok",
      valueClass:
        quality.invalid_rows > 0
          ? "text-crit-700"
          : "text-ok-700",
    },
  ];

  const issueBreakdown = [
    {
      label: "Missing Data",
      value: quality.last_upload_error_breakdown?.missing ?? 0,
    },
    {
      label: "Range Errors",
      value: quality.last_upload_error_breakdown?.range ?? 0,
    },
    {
      label: "Date Errors",
      value: quality.last_upload_error_breakdown?.date ?? 0,
    },
    {
      label: "Duplicate Records",
      value: quality.last_upload_error_breakdown?.duplicate ?? 0,
    },
    {
      label: "Location Errors",
      value: quality.last_upload_error_breakdown?.location ?? 0,
    },
    {
      label: "Other Errors",
      value: quality.last_upload_error_breakdown?.other ?? 0,
    },
  ];

  const lastUploadTime = quality.last_upload?.at
    ? new Date(quality.last_upload.at).toLocaleString()
    : "—";

  return (
    <div>
      {/* Page Header */}
      <PageHeader
        title="Data Quality"
        description="Review data completeness, validity, and quality issues."
      />

      {/* Quality Overview */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {qualityMetrics.map((metric) => (
          <KpiCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            hint={metric.description}
            icon={metric.icon}
            tone={metric.tone}
            valueClassName={metric.valueClass}
          />
        ))}
      </div>

      {/* Completeness */}
      <Card className="mt-6 p-5 sm:p-6" aria-labelledby="completeness">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeader
            id="completeness"
            title="Data Completeness"
            description="Overall completeness of the uploaded dataset."
          />

          <div className="text-right">
            <p className="num text-4xl font-semibold leading-none tracking-tight text-ink">
              {quality.completeness_pct}%
            </p>

            <p className="mt-1.5 text-xs text-ink-3">Complete</p>
          </div>
        </div>

        <ProgressBar
          className="mt-5"
          size="lg"
          tone="info"
          value={quality.completeness_pct}
          label="Data completeness"
        />
      </Card>

      {/* Upload Information */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5 sm:p-6" aria-labelledby="latest-upload">
          <div className="flex items-center gap-3.5">
            <IconTile icon={FileText} tone="info" size="lg" />

            <div>
              <h2 id="latest-upload" className="font-semibold text-ink">
                Latest Upload
              </h2>

              <p className="mt-0.5 text-xs text-ink-3">
                Most recently processed dataset
              </p>
            </div>
          </div>

          <dl className="mt-6 space-y-4 border-t border-line pt-5">
            <div>
              <dt className="text-xs text-ink-3">Filename</dt>

              <dd className="mt-1 break-all text-sm font-medium text-ink">
                {quality.last_upload?.filename || "—"}
              </dd>
            </div>

            <div>
              <dt className="text-xs text-ink-3">Status</dt>

              <dd className="mt-1.5">
                <StatusBadge tone="ok">
                  <CheckCircle size={13} aria-hidden="true" />
                  {quality.last_upload?.status || "—"}
                </StatusBadge>
              </dd>
            </div>

            <div>
              <dt className="text-xs text-ink-3">Uploaded At</dt>

              <dd className="num mt-1 flex items-center gap-2 text-sm text-ink-2">
                <Clock size={15} className="text-ink-4" aria-hidden="true" />
                {lastUploadTime}
              </dd>
            </div>
          </dl>
        </Card>

        <Card className="p-5 sm:p-6" aria-labelledby="upload-summary">
          <div className="flex items-center gap-3.5">
            <IconTile icon={Upload} tone="info" size="lg" />

            <div>
              <h2 id="upload-summary" className="font-semibold text-ink">
                Upload Summary
              </h2>

              <p className="mt-0.5 text-xs text-ink-3">
                Dataset processing history
              </p>
            </div>
          </div>

          <div className="mt-6 border-t border-line pt-5">
            <p className="text-sm text-ink-3">Total Uploads</p>

            <p className="num mt-1.5 text-4xl font-semibold leading-none tracking-tight text-ink">
              {quality.total_uploads}
            </p>
          </div>

          <div className="mt-6 border-t border-line pt-5">
            <p className="text-sm text-ink-3">Current validation status</p>

            <div className="mt-2 flex items-center gap-2">
              <CheckCircle size={18} className="text-ok-600" aria-hidden="true" />

              <span className="text-sm font-medium text-ok-700">
                All uploaded rows are valid
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Error Breakdown */}
      <Card className="mt-6 p-5 sm:p-6" aria-labelledby="error-breakdown">
        <SectionHeader
          id="error-breakdown"
          title="Latest Upload Error Breakdown"
          description="Validation issues detected in the most recent upload."
        />

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {issueBreakdown.map((issue) => (
            <div
              key={issue.label}
              className={`rounded-lg border p-4 ${
                issue.value > 0
                  ? "border-crit-100 bg-crit-50"
                  : "border-line bg-sunken"
              }`}
            >
              <p className="text-xs text-ink-3">{issue.label}</p>

              <p
                className={`num mt-2 text-2xl font-semibold ${
                  issue.value > 0 ? "text-crit-700" : "text-ink"
                }`}
              >
                {issue.value}
              </p>
            </div>
          ))}
        </div>

        {quality.invalid_rows === 0 && (
          <div className="mt-6 flex items-center gap-3 rounded-lg border border-ok-100 bg-ok-50 p-4">
            <CheckCircle
              size={20}
              className="shrink-0 text-ok-600"
              aria-hidden="true"
            />

            <div>
              <p className="text-sm font-semibold text-ok-700">
                No data quality issues detected
              </p>

              <p className="mt-0.5 text-sm text-ok-700/90">
                The latest upload passed all validation checks.
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default DataQuality;
