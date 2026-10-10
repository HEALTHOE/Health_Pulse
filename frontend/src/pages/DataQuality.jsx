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
        <h1 className="text-2xl font-bold text-slate-900">
          Data Quality
        </h1>

        <p className="mt-2 text-slate-500">
          Review data completeness, validity, and quality issues.
        </p>

        <div className="mt-8 bg-white border border-slate-200 rounded-xl p-8">
          <p className="text-sm text-slate-500">
            Loading data quality information...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Data Quality
        </h1>

        <p className="mt-2 text-slate-500">
          Review data completeness, validity, and quality issues.
        </p>

        <div className="mt-8 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-5">
          <AlertCircle
            className="text-red-500 shrink-0"
            size={20}
          />

          <div>
            <p className="font-medium text-red-800">
              Unable to load data quality information
            </p>

            <p className="mt-1 text-sm text-red-700">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const qualityMetrics = [
    {
      label: "Total Records",
      value: quality.total_records,
      description: "Records currently in the system",
      icon: Database,
      valueClass: "text-slate-900",
    },
    {
      label: "Uploaded Rows",
      value: quality.uploaded_rows,
      description: "Rows processed from uploads",
      icon: Upload,
      valueClass: "text-blue-600",
    },
    {
      label: "Valid Rows",
      value: quality.valid_rows,
      description: "Rows passing validation",
      icon: CheckCircle,
      valueClass: "text-green-600",
    },
    {
      label: "Invalid Rows",
      value: quality.invalid_rows,
      description: "Rows failing validation",
      icon: AlertCircle,
      valueClass:
        quality.invalid_rows > 0
          ? "text-red-600"
          : "text-green-600",
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
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Data Quality
        </h1>

        <p className="mt-2 text-slate-500">
          Review data completeness, validity, and quality issues.
        </p>
      </div>

      {/* Quality Overview */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {qualityMetrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <div
              key={metric.label}
              className="bg-white border border-slate-200 rounded-xl p-6"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  {metric.label}
                </p>

                <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center">
                  <Icon
                    size={19}
                    className={metric.valueClass}
                  />
                </div>
              </div>

              <p
                className={`mt-3 text-3xl font-bold ${metric.valueClass}`}
              >
                {metric.value}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                {metric.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Completeness */}
      <div className="mt-6 bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Data Completeness
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Overall completeness of the uploaded dataset.
            </p>
          </div>

          <div className="text-right">
            <p className="text-3xl font-bold text-green-600">
              {quality.completeness_pct}%
            </p>

            <p className="text-xs text-slate-500 mt-1">
              Complete
            </p>
          </div>
        </div>

        <div className="mt-5 h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all"
            style={{
              width: `${Math.min(
                Math.max(quality.completeness_pct, 0),
                100
              )}%`,
            }}
          />
        </div>
      </div>

      {/* Upload Information */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <FileText
                size={20}
                className="text-blue-600"
              />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Latest Upload
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Most recently processed dataset
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <p className="text-xs text-slate-500">
                Filename
              </p>

              <p className="mt-1 text-sm font-medium text-slate-800">
                {quality.last_upload?.filename || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Status
              </p>

              <span className="inline-flex mt-1 items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                <CheckCircle size={14} />
                {quality.last_upload?.status || "—"}
              </span>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Uploaded At
              </p>

              <div className="mt-1 flex items-center gap-2 text-sm text-slate-700">
                <Clock size={15} />
                {lastUploadTime}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
              <Upload
                size={20}
                className="text-blue-600"
              />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Upload Summary
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Dataset processing history
              </p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm text-slate-500">
              Total Uploads
            </p>

            <p className="mt-1 text-3xl font-bold text-slate-900">
              {quality.total_uploads}
            </p>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              Current validation status
            </p>

            <div className="mt-2 flex items-center gap-2">
              <CheckCircle
                size={18}
                className="text-green-600"
              />

              <span className="text-sm font-medium text-green-700">
                All uploaded rows are valid
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Breakdown */}
      <div className="mt-6 bg-white border border-slate-200 rounded-xl p-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Latest Upload Error Breakdown
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Validation issues detected in the most recent upload.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {issueBreakdown.map((issue) => (
            <div
              key={issue.label}
              className="rounded-lg border border-slate-200 p-4"
            >
              <p className="text-xs text-slate-500">
                {issue.label}
              </p>

              <p
                className={`mt-2 text-2xl font-bold ${
                  issue.value > 0
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                {issue.value}
              </p>
            </div>
          ))}
        </div>

        {quality.invalid_rows === 0 && (
          <div className="mt-6 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
            <CheckCircle
              size={20}
              className="text-green-600 shrink-0"
            />

            <div>
              <p className="text-sm font-semibold text-green-800">
                No data quality issues detected
              </p>

              <p className="mt-1 text-sm text-green-700">
                The latest upload passed all validation checks.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataQuality;