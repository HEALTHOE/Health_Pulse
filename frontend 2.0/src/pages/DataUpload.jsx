import { useRef, useState } from "react";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  ShieldCheck,
} from "lucide-react";
import { uploadHealthData } from "../services/dataService";
import {
  Button,
  Card,
  IconTile,
  PageHeader,
  SectionHeader,
  Table,
  TableShell,
  Td,
  Th,
  Tr,
} from "../components/ui";

const ResultMetric = ({ label, value, valueClassName = "text-ink" }) => (
  <div className="rounded-lg border border-line bg-surface p-4">
    <p className="text-xs text-ink-3">{label}</p>
    <p className={`num mt-1.5 text-2xl font-semibold ${valueClassName}`}>{value}</p>
  </div>
);

const ResultDetail = ({ label, value }) => (
  <div>
    <dt className="text-xs text-ink-3">{label}</dt>
    <dd className="num mt-1 text-sm font-medium text-ink">{value}</dd>
  </div>
);

const DataUpload = () => {
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];

    setResult(null);
    setError("");

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const allowedTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    const allowedExtensions = [".csv", ".xls", ".xlsx"];
    const fileName = selectedFile.name.toLowerCase();

    const validType =
      allowedTypes.includes(selectedFile.type) ||
      allowedExtensions.some((extension) =>
        fileName.endsWith(extension)
      );

    if (!validType) {
      setError("Please select a CSV or Excel file.");
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    setUploading(true);
    setError("");
    setResult(null);

    try {
      const data = await uploadHealthData(file);
      setResult(data);
    } catch (err) {
      const message =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        "Failed to upload the file. Please try again.";

      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setResult(null);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      {/* Page Header */}
      <PageHeader
        title="Data Upload"
        description="Upload HMIS data for processing and analysis."
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Upload Card */}
        <Card className="p-5 sm:p-7">
          <SectionHeader
            title="Upload Health Data"
            description="Select a CSV or Excel file containing HMIS data."
          />

          {/* File Selection */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-6 flex w-full flex-col items-center rounded-xl border-2 border-dashed border-line-strong bg-sunken px-6 py-10 text-center transition-colors duration-150 hover:border-brand-500 hover:bg-brand-50"
          >
            <span
              aria-hidden="true"
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600 ring-1 ring-brand-100"
            >
              <Upload size={22} />
            </span>

            <span className="mt-4 text-sm font-semibold text-ink">
              Click to select a file
            </span>

            <span className="mt-1 text-xs text-ink-3">
              Supported formats: CSV, XLS, XLSX
            </span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xls,.xlsx"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Select a CSV or Excel file"
          />

          {/* Selected File */}
          {file && (
            <div className="mt-5 flex items-center justify-between gap-3 rounded-lg border border-line bg-surface p-3.5 shadow-card">
              <div className="flex min-w-0 items-center gap-3">
                <IconTile icon={FileText} tone="info" />

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    {file.name}
                  </p>

                  <p className="num mt-0.5 text-xs text-ink-3">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={removeFile}
                disabled={uploading}
                aria-label="Remove selected file"
                className="shrink-0 rounded-lg p-2 text-ink-4 transition-colors hover:bg-sunken hover:text-ink disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* Processing state */}
          {uploading && (
            <div role="status" aria-live="polite" className="mt-5">
              <div className="flex items-center gap-2.5 text-sm text-ink-2">
                <Loader2 size={16} className="animate-spin text-brand-600" aria-hidden="true" />
                Uploading and validating your file...
              </div>

              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
                <div className="h-full w-1/3 animate-[hp-slide_1.2s_ease-in-out_infinite] rounded-full bg-brand-600" />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-3 rounded-lg border border-crit-100 bg-crit-50 p-4"
            >
              <AlertCircle
                className="mt-0.5 shrink-0 text-crit-600"
                size={18}
                aria-hidden="true"
              />

              <p className="text-sm text-crit-700">{error}</p>
            </div>
          )}

          {/* Upload Result */}
          {result && (
            <div
              role="status"
              className="mt-6 rounded-xl border border-ok-100 bg-ok-50 p-5"
            >
              {/* Success Header */}
              <div className="flex items-start gap-3">
                <CheckCircle
                  className="mt-0.5 shrink-0 text-ok-600"
                  size={20}
                  aria-hidden="true"
                />

                <div>
                  <p className="font-semibold text-ok-700">
                    Data uploaded successfully
                  </p>

                  <p className="mt-0.5 text-sm text-ok-700/90">
                    The uploaded dataset was validated and processed
                    successfully.
                  </p>
                </div>
              </div>

              {/* Upload Statistics */}
              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                <ResultMetric label="Total Rows" value={result.total_rows} />

                <ResultMetric
                  label="Valid Rows"
                  value={result.valid_rows}
                  valueClassName="text-ok-700"
                />

                <ResultMetric
                  label="Invalid Rows"
                  value={result.invalid_rows}
                  valueClassName={
                    Number(result.invalid_rows) > 0 ? "text-crit-700" : "text-ink"
                  }
                />

                <ResultMetric
                  label="Updated"
                  value={result.updated}
                  valueClassName="text-brand-700"
                />
              </div>

              {/* Processing Details */}
              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-ok-100 pt-4 md:grid-cols-3">
                <ResultDetail
                  label="Indicator values recomputed"
                  value={result.indicator_values_recomputed}
                />

                <ResultDetail
                  label="Latest reporting period"
                  value={result.alerts?.latest_period || "—"}
                />

                <ResultDetail
                  label="Processing status"
                  value={result.status || "—"}
                />

                <ResultDetail
                  label="Alerts created"
                  value={result.alerts?.created ?? 0}
                />

                <ResultDetail
                  label="Alerts resolved"
                  value={result.alerts?.resolved ?? 0}
                />
              </dl>

              {/* Row-level validation errors */}
              {Array.isArray(result.errors) && result.errors.length > 0 && (
                <div className="mt-5 border-t border-ok-100 pt-4">
                  <h3 className="text-sm font-semibold text-ink">
                    Row-level validation errors ({result.errors.length})
                  </h3>

                  <p className="mt-1 text-xs text-ink-3">
                    Fix these rows in your file and upload again. Valid rows
                    were already saved.
                  </p>

                  <TableShell className="mt-3">
                    <Table>
                      <thead>
                        <Tr>
                          <Th align="right">Row</Th>
                          <Th>Column</Th>
                          <Th>Issue</Th>
                        </Tr>
                      </thead>

                      <tbody>
                        {result.errors.slice(0, 50).map((item, index) => (
                          <Tr key={`${item.row}-${item.column}-${index}`}>
                            <Td align="right" className="num">
                              {item.row}
                            </Td>

                            <Td>{item.column}</Td>

                            <Td>{item.message}</Td>
                          </Tr>
                        ))}
                      </tbody>
                    </Table>
                  </TableShell>

                  {result.errors.length > 50 && (
                    <p className="mt-2 text-xs text-ink-3">
                      Showing 50 of {result.errors.length} errors.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Upload Button */}
          <div className="mt-7 flex justify-end border-t border-line pt-5">
            <Button
              size="lg"
              onClick={handleUpload}
              disabled={!file || uploading}
            >
              {uploading ? (
                <Loader2 size={17} className="animate-spin" aria-hidden="true" />
              ) : (
                <Upload size={17} aria-hidden="true" />
              )}
              {uploading ? "Uploading..." : "Upload Data"}
            </Button>
          </div>
        </Card>

        {/* Upload Guidelines */}
        <Card className="h-fit p-5 sm:p-6" aria-labelledby="upload-guidelines">
          <div className="flex items-center gap-3">
            <IconTile icon={ShieldCheck} tone="info" />

            <h2 id="upload-guidelines" className="font-semibold text-ink">
              Upload Guidelines
            </h2>
          </div>

          <ul className="mt-5 space-y-3.5 text-sm text-ink-2">
            {[
              "Use CSV or Excel format.",
              "Ensure the dataset follows the HMIS structure.",
              "Do not upload real patient-identifiable information.",
              "Uploaded data will be validated and processed by the backend.",
            ].map((rule) => (
              <li key={rule} className="flex gap-3">
                <CheckCircle
                  size={16}
                  className="mt-0.5 shrink-0 text-brand-600"
                  aria-hidden="true"
                />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default DataUpload;
