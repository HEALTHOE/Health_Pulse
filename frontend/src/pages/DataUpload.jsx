import { useRef, useState } from "react";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";
import { uploadHealthData } from "../services/dataService";

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
    <div className="max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Data Upload
        </h1>

        <p className="mt-2 text-slate-500">
          Upload HMIS data for processing and analysis.
        </p>
      </div>

      {/* Upload Card */}
      <div className="mt-8 bg-white border border-slate-200 rounded-xl p-8">
        {/* Upload Header */}
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
            <Upload className="text-blue-600" size={26} />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Upload Health Data
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Select a CSV or Excel file containing HMIS data.
          </p>
        </div>

        {/* File Selection */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="mt-8 border-2 border-dashed border-slate-300 rounded-xl p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition"
        >
          <FileText
            className="mx-auto text-slate-400"
            size={36}
          />

          <p className="mt-3 text-sm font-medium text-slate-700">
            Click to select a file
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Supported formats: CSV, XLS, XLSX
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xls,.xlsx"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Selected File */}
        {file && (
          <div className="mt-6 flex items-center justify-between border border-slate-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <FileText
                  className="text-blue-600"
                  size={20}
                />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-800">
                  {file.name}
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>

            <button
              onClick={removeFile}
              disabled={uploading}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertCircle
              className="text-red-500 shrink-0"
              size={20}
            />

            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>
        )}

        {/* Upload Result */}
        {result && (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5">
            {/* Success Header */}
            <div className="flex items-start gap-3">
              <CheckCircle
                className="text-green-600 shrink-0"
                size={20}
              />

              <div>
                <p className="text-sm font-semibold text-green-800">
                  Data uploaded successfully
                </p>

                <p className="mt-1 text-sm text-green-700">
                  The uploaded dataset was validated and
                  processed successfully.
                </p>
              </div>
            </div>

            {/* Upload Statistics */}
            <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-green-100 p-4">
                <p className="text-xs text-slate-500">
                  Total Rows
                </p>

                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {result.total_rows}
                </p>
              </div>

              <div className="bg-white rounded-lg border border-green-100 p-4">
                <p className="text-xs text-slate-500">
                  Valid Rows
                </p>

                <p className="mt-1 text-xl font-semibold text-green-600">
                  {result.valid_rows}
                </p>
              </div>

              <div className="bg-white rounded-lg border border-green-100 p-4">
                <p className="text-xs text-slate-500">
                  Invalid Rows
                </p>

                <p className="mt-1 text-xl font-semibold text-red-600">
                  {result.invalid_rows}
                </p>
              </div>

              <div className="bg-white rounded-lg border border-green-100 p-4">
                <p className="text-xs text-slate-500">
                  Updated
                </p>

                <p className="mt-1 text-xl font-semibold text-blue-600">
                  {result.updated}
                </p>
              </div>
            </div>

            {/* Processing Details */}
            <div className="mt-5 border-t border-green-200 pt-4 text-sm text-slate-600">
              <p>
                <span className="font-medium">
                  Indicator values recomputed:
                </span>{" "}
                {result.indicator_values_recomputed}
              </p>

              <p className="mt-1">
                <span className="font-medium">
                  Latest reporting period:
                </span>{" "}
                {result.alerts?.latest_period || "—"}
              </p>

              <p className="mt-1">
                <span className="font-medium">
                  Alerts created:
                </span>{" "}
                {result.alerts?.created ?? 0}
                {" · "}
                <span className="font-medium">
                  Alerts resolved:
                </span>{" "}
                {result.alerts?.resolved ?? 0}
              </p>

              <p className="mt-1">
                <span className="font-medium">
                  Processing status:
                </span>{" "}
                {result.status || "—"}
              </p>
            </div>
          </div>
        )}

        {/* Upload Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
          >
            {uploading ? "Uploading..." : "Upload Data"}
          </button>
        </div>
      </div>

      {/* Upload Guidelines */}
      <div className="mt-6 bg-white border border-slate-200 rounded-xl p-6">
        <h3 className="font-semibold text-slate-900">
          Upload Guidelines
        </h3>

        <ul className="mt-3 space-y-2 text-sm text-slate-500 list-disc list-inside">
          <li>Use CSV or Excel format.</li>

          <li>
            Ensure the dataset follows the HMIS structure.
          </li>

          <li>
            Do not upload real patient-identifiable information.
          </li>

          <li>
            Uploaded data will be validated and processed by
            the backend.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default DataUpload;