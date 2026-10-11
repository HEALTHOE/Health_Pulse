import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCheck,
  Clock,
  MapPin,
  OctagonAlert,
} from "lucide-react";
import api from "../services/api";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconTile,
  LoadingState,
  PageHeader,
  SearchField,
  SelectField,
  StatStrip,
  StatusBadge,
  formatStatus,
} from "../components/ui";

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [updatingId, setUpdatingId] = useState(null);
  const [actionError, setActionError] = useState("");

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

  const handleStatusChange = async (alert, nextStatus) => {
    setUpdatingId(alert.id);
    setActionError("");

    try {
      const response = await api.patch(`/api/alerts/${alert.id}`, {
        status: nextStatus,
      });

      setAlerts((prev) =>
        prev.map((item) => (item.id === alert.id ? response.data : item))
      );
    } catch (err) {
      setActionError(
        err.response?.data?.error?.message ||
          `Could not update alert #${alert.id}.`
      );
    } finally {
      setUpdatingId(null);
    }
  };

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

  return (
    <div>
      {/* Header */}
      <PageHeader
        title="Alerts"
        description="Health performance alerts for North District."
      />

      {/* Summary cards */}
      <StatStrip
        columns="lg:grid-cols-3"
        items={[
          {
            label: "Active Alerts",
            value: loading ? "—" : activeCount,
            hint: "Current alerts requiring attention",
            icon: Bell,
            tone: "info",
          },
          {
            label: "Warning Alerts",
            value: loading ? "—" : warningCount,
            hint: "Indicators below their target",
            icon: AlertTriangle,
            tone: "warn",
            valueClassName: "text-warn-700",
          },
          {
            label: "Critical Alerts",
            value: loading ? "—" : criticalCount,
            hint: "Issues requiring immediate attention",
            icon: OctagonAlert,
            tone: "crit",
            valueClassName: "text-crit-700",
          },
        ]}
      />

      {/* Filters */}
      <Card className="mt-6 p-4 sm:p-5" aria-label="Alert filters">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_13rem_13rem]">
          {/* Search */}
          <SearchField
            label="Search alerts"
            placeholder="Search alerts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* Severity */}
          <SelectField
            label="Severity"
            hideLabel
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <option value="ALL">All Severities</option>
            <option value="WARNING">Warning</option>
            <option value="CRITICAL">Critical</option>
          </SelectField>

          {/* Status */}
          <SelectField
            label="Status"
            hideLabel
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ACTIVE">Active</option>
            <option value="RESOLVED">Resolved</option>
            <option value="ALL">All Statuses</option>
          </SelectField>
        </div>
      </Card>

      {/* Content */}
      <div className="mt-6">
        {loading && <LoadingState label="Loading alerts..." />}

        {!loading && error && (
          <ErrorState title="Unable to load alerts" message={error} />
        )}

        {!loading && !error && filteredAlerts.length === 0 && (
          <EmptyState
            icon={AlertTriangle}
            title="No alerts found"
            description="No alerts match the selected filters."
          />
        )}

        {!loading && !error && filteredAlerts.length > 0 && (
          <>
            {actionError && (
              <p
                role="alert"
                className="mb-3 rounded-lg border border-crit-100 bg-crit-50 p-3 text-sm text-crit-700"
              >
                {actionError}
              </p>
            )}

            <p className="mb-3 text-sm text-ink-3" aria-live="polite">
              Showing{" "}
              <span className="num font-medium text-ink-2">
                {filteredAlerts.length}
              </span>{" "}
              {filteredAlerts.length === 1 ? "alert" : "alerts"}
            </p>

            <ul className="space-y-3">
              {filteredAlerts.map((alert) => {
                const isCritical = alert.severity === "CRITICAL";

                return (
                  <li key={alert.id}>
                    <Card
                      as="article"
                      className={`overflow-hidden border-l-4 ${
                        isCritical ? "border-l-crit-600" : "border-l-warn-500"
                      }`}
                    >
                      <div className="p-5 sm:p-6">
                        <div className="flex gap-4">
                          <IconTile
                            icon={AlertTriangle}
                            tone={isCritical ? "crit" : "warn"}
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-ink">
                                {alert.indicator_name}
                              </h3>

                              <StatusBadge
                                tone={isCritical ? "crit" : "warn"}
                                size="sm"
                              >
                                {isCritical ? "Critical" : "Warning"}
                              </StatusBadge>

                              <StatusBadge
                                tone={alert.status === "ACTIVE" ? "info" : "neutral"}
                                size="sm"
                              >
                                {formatStatus(alert.status)}
                              </StatusBadge>

                              {alert.status !== "RESOLVED" && (
                                <span className="ml-auto flex shrink-0 items-center gap-2">
                                  {alert.status === "ACTIVE" && (
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      disabled={updatingId === alert.id}
                                      onClick={() =>
                                        handleStatusChange(alert, "ACKNOWLEDGED")
                                      }
                                    >
                                      <Check size={15} aria-hidden="true" />
                                      {updatingId === alert.id
                                        ? "Working..."
                                        : "Acknowledge"}
                                    </Button>
                                  )}

                                  <Button
                                    size="sm"
                                    variant="primary"
                                    disabled={updatingId === alert.id}
                                    onClick={() =>
                                      handleStatusChange(alert, "RESOLVED")
                                    }
                                  >
                                    <CheckCheck size={15} aria-hidden="true" />
                                    Resolve
                                  </Button>
                                </span>
                              )}
                            </div>

                            <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
                              {alert.message}
                            </p>
                          </div>
                        </div>

                        {/* Alert details */}
                        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-line pt-4 md:grid-cols-4">
                          <div>
                            <dt className="text-xs text-ink-3">Current Value</dt>

                            <dd
                              className={`num mt-1 text-lg font-semibold ${
                                isCritical ? "text-crit-700" : "text-ink"
                              }`}
                            >
                              {alert.current_value}
                            </dd>
                          </div>

                          <div>
                            <dt className="text-xs text-ink-3">Threshold</dt>

                            <dd className="num mt-1 text-lg font-semibold text-ink">
                              {alert.threshold}
                            </dd>
                          </div>

                          <div>
                            <dt className="text-xs text-ink-3">Location</dt>

                            <dd className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-ink">
                              <MapPin size={14} className="text-ink-4" aria-hidden="true" />
                              {alert.block_name || alert.district_name}
                            </dd>
                          </div>

                          <div>
                            <dt className="text-xs text-ink-3">Period</dt>

                            <dd className="num mt-1.5 flex items-center gap-1.5 text-sm font-medium text-ink">
                              <Clock size={14} className="text-ink-4" aria-hidden="true" />
                              {alert.period}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

export default Alerts;
