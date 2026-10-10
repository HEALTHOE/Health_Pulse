import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Search,
  MapPin,
  Clock,
} from "lucide-react";
import api from "../services/api";

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/api/alerts", {
          params: {
            district_id: 1,
          },
        });

        setAlerts(response.data || []);
      } catch (err) {
        setError(
          err.response?.data?.error?.message ||
            "Failed to load alerts."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchesSearch =
        alert.indicator_name
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        alert.message
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        alert.block_name
          ?.toLowerCase()
          .includes(search.toLowerCase());

      const matchesSeverity =
        severityFilter === "ALL" ||
        alert.severity === severityFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        alert.status === statusFilter;

      return (
        matchesSearch &&
        matchesSeverity &&
        matchesStatus
      );
    });
  }, [alerts, search, severityFilter, statusFilter]);

  const activeCount = alerts.filter(
    (alert) => alert.status === "ACTIVE"
  ).length;

  const warningCount = alerts.filter(
    (alert) =>
      alert.status === "ACTIVE" &&
      alert.severity === "WARNING"
  ).length;

  const criticalCount = alerts.filter(
    (alert) =>
      alert.status === "ACTIVE" &&
      alert.severity === "CRITICAL"
  ).length;

  const getSeverityClasses = (severity) => {
    if (severity === "CRITICAL") {
      return "bg-red-100 text-red-700 border-red-200";
    }

    return "bg-yellow-100 text-yellow-700 border-yellow-200";
  };

  const getStatusClasses = (status) => {
    if (status === "ACTIVE") {
      return "bg-blue-100 text-blue-700";
    }

    return "bg-slate-100 text-slate-600";
  };

  return (
    <div>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Alerts
        </h1>

        <p className="mt-2 text-slate-500">
          Health performance alerts for North District.
        </p>
      </div>

      {/* Summary cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Active Alerts
            </p>

            <AlertTriangle
              size={20}
              className="text-blue-600"
            />
          </div>

          <p className="text-3xl font-bold mt-3 text-slate-900">
            {loading ? "—" : activeCount}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            Current alerts requiring attention
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-sm text-slate-500">
            Warning Alerts
          </p>

          <p className="text-3xl font-bold mt-3 text-yellow-600">
            {loading ? "—" : warningCount}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            Indicators below their target
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-sm text-slate-500">
            Critical Alerts
          </p>

          <p className="text-3xl font-bold mt-3 text-red-600">
            {loading ? "—" : criticalCount}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            Issues requiring immediate attention
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-8 bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search alerts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500"
            />
          </div>

          {/* Severity */}
          <select
            value={severityFilter}
            onChange={(e) =>
              setSeverityFilter(e.target.value)
            }
            className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:border-blue-500"
          >
            <option value="ALL">All Severities</option>
            <option value="WARNING">Warning</option>
            <option value="CRITICAL">Critical</option>
          </select>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:border-blue-500"
          >
            <option value="ACTIVE">Active</option>
            <option value="RESOLVED">Resolved</option>
            <option value="ALL">All Statuses</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="mt-6">
        {loading && (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
            <p className="text-slate-500">
              Loading alerts...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-white rounded-xl border border-red-200 p-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {!loading &&
          !error &&
          filteredAlerts.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
              <AlertTriangle
                size={32}
                className="mx-auto text-slate-400"
              />

              <p className="mt-3 font-medium text-slate-700">
                No alerts found
              </p>

              <p className="mt-1 text-sm text-slate-500">
                No alerts match the selected filters.
              </p>
            </div>
          )}

        {!loading &&
          !error &&
          filteredAlerts.length > 0 && (
            <div className="space-y-4">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-white rounded-xl border border-slate-200 p-6"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex gap-4">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          alert.severity === "CRITICAL"
                            ? "bg-red-50"
                            : "bg-yellow-50"
                        }`}
                      >
                        <AlertTriangle
                          size={20}
                          className={
                            alert.severity === "CRITICAL"
                              ? "text-red-600"
                              : "text-yellow-600"
                          }
                        />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-900">
                            {alert.indicator_name}
                          </h3>

                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getSeverityClasses(
                              alert.severity
                            )}`}
                          >
                            {alert.severity}
                          </span>

                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusClasses(
                              alert.status
                            )}`}
                          >
                            {alert.status}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-slate-600">
                          {alert.message}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Alert details */}
                  <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-slate-500">
                        Current Value
                      </p>

                      <p className="mt-1 font-semibold text-slate-900">
                        {alert.current_value}%
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Target
                      </p>

                      <p className="mt-1 font-semibold text-slate-900">
                        {alert.threshold}%
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Location
                      </p>

                      <div className="mt-1 flex items-center gap-1 text-sm font-medium text-slate-800">
                        <MapPin size={14} />
                        {alert.block_name ||
                          alert.district_name}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Period
                      </p>

                      <div className="mt-1 flex items-center gap-1 text-sm font-medium text-slate-800">
                        <Clock size={14} />
                        {alert.period}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
};

export default Alerts;