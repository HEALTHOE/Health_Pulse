import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Map,
} from "lucide-react";
import api from "../services/api";
import {
  Button,
  Card,
  CardSkeleton,
  ErrorState,
  IconTile,
  IndicatorCard,
  KpiCard,
  PageHeader,
  ScoreHero,
  SectionHeader,
} from "../components/ui";

const Dashboard = () => {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/api/dashboard/summary");
        setSummary(response.data);
      } catch (err) {
        const message =
          err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Failed to load dashboard data.";

        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div aria-busy="true">
        <PageHeader
          title="Dashboard"
          description="Overview of district health performance."
        />

        <div role="status" aria-live="polite" className="sr-only">
          Loading dashboard data...
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CardSkeleton lines={4} />
          </div>
          <CardSkeleton lines={3} />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <CardSkeleton key={item} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader
          title="Dashboard"
          description="Overview of district health performance."
        />

        <ErrorState title="Unable to load dashboard" message={error} />
      </div>
    );
  }

  const indicators = [
    {
      name: "Immunization",
      value: summary.indicators.immunization.value,
      status: summary.indicators.immunization.status,
    },
    {
      name: "ANC Coverage",
      value: summary.indicators.anc.value,
      status: summary.indicators.anc.status,
    },
    {
      name: "TB Treatment Success",
      value: summary.indicators.tb_success.value,
      status: summary.indicators.tb_success.status,
    },
    {
      name: "Institutional Delivery",
      value: summary.indicators.institutional_delivery.value,
      status: summary.indicators.institutional_delivery.status,
    },
  ];

  const performanceTotal =
    Number(summary.performance.normal) +
    Number(summary.performance.warning) +
    Number(summary.performance.critical);

  const segment = (count) =>
    performanceTotal > 0 ? (Number(count) / performanceTotal) * 100 : 0;

  const hasCriticalAlerts = Number(summary.critical_alerts) > 0;

  return (
    <div>
      {/* Header */}
      <PageHeader
        title="Dashboard"
        description="Overview of district health performance."
      />

      {/* Health score + headline KPIs */}
      <div className="grid gap-5 lg:grid-cols-3">
        <ScoreHero
          className="lg:col-span-2"
          contextLabel="Selected district"
          title={summary.district.name}
          score={summary.health_score}
          status={summary.health_status}
          caption="Overall district performance"
        >
          <div className="mt-5 flex justify-center sm:justify-start">
            <Button
              onClick={() => navigate(`/districts/${summary.district.id}`)}
            >
              View District
              <ArrowRight size={16} aria-hidden="true" />
            </Button>
          </div>
        </ScoreHero>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
          <KpiCard
            label="Critical Alerts"
            value={summary.critical_alerts}
            hint="Issues requiring immediate attention"
            icon={AlertTriangle}
            tone={hasCriticalAlerts ? "crit" : "neutral"}
            valueClassName={hasCriticalAlerts ? "text-crit-700" : "text-ink"}
          />

          <KpiCard
            label="Reporting Period"
            value={summary.period}
            hint="Latest available data"
            icon={CalendarDays}
            tone="info"
          />
        </div>
      </div>

      {/* Indicator Performance */}
      <section className="mt-10" aria-labelledby="indicator-performance">
        <SectionHeader
          id="indicator-performance"
          title="Indicator Performance"
          description={`Key health indicators for ${summary.district.name}.`}
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate("/indicators")}>
              View all
              <ArrowRight size={15} aria-hidden="true" />
            </Button>
          }
        />

        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {indicators.map((indicator) => (
            <IndicatorCard
              key={indicator.name}
              name={indicator.name}
              display={`${indicator.value}%`}
              value={indicator.value}
              status={indicator.status}
            />
          ))}
        </div>
      </section>

      {/* Performance Summary */}
      <Card className="mt-10 p-5 sm:p-6" aria-labelledby="performance-summary">
        <SectionHeader
          id="performance-summary"
          title="Performance Summary"
          description="Distribution of indicator performance."
        />

        {/* Proportional bar of the three status counts */}
        <div
          role="img"
          aria-label={`${summary.performance.normal} normal, ${summary.performance.warning} warning, ${summary.performance.critical} critical indicators`}
          className="mt-6 flex h-3 w-full overflow-hidden rounded-full bg-line"
        >
          <div
            className="h-full bg-ok-600 transition-[width] duration-700"
            style={{ width: `${segment(summary.performance.normal)}%` }}
          />
          <div
            className="h-full bg-warn-500 transition-[width] duration-700"
            style={{ width: `${segment(summary.performance.warning)}%` }}
          />
          <div
            className="h-full bg-crit-600 transition-[width] duration-700"
            style={{ width: `${segment(summary.performance.critical)}%` }}
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-ok-100 bg-ok-50 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-ok-700">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-ok-600" />
              Normal
            </div>

            <p className="num mt-2 text-3xl font-semibold text-ok-700">
              {summary.performance.normal}
            </p>

            <p className="mt-1 text-xs text-ok-700/80">
              Indicators performing normally
            </p>
          </div>

          <div className="rounded-lg border border-warn-100 bg-warn-50 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-warn-700">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-warn-500" />
              Warning
            </div>

            <p className="num mt-2 text-3xl font-semibold text-warn-700">
              {summary.performance.warning}
            </p>

            <p className="mt-1 text-xs text-warn-700/80">Indicators below target</p>
          </div>

          <div className="rounded-lg border border-crit-100 bg-crit-50 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-crit-700">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-crit-600" />
              Critical
            </div>

            <p className="num mt-2 text-3xl font-semibold text-crit-700">
              {summary.performance.critical}
            </p>

            <p className="mt-1 text-xs text-crit-700/80">
              Indicators requiring immediate attention
            </p>
          </div>
        </div>
      </Card>

      {/* Quick Navigation */}
      <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
        <button
          type="button"
          onClick={() => navigate("/districts")}
          className="group flex items-center gap-4 rounded-xl border border-line bg-surface p-5 text-left shadow-card transition duration-150 hover:border-brand-500 hover:shadow-raised"
        >
          <IconTile icon={Map} tone="info" size="lg" />

          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-ink">Explore Districts</h3>

            <p className="mt-0.5 text-sm text-ink-3">
              Compare district and block-level performance.
            </p>
          </div>

          <ArrowRight
            size={18}
            aria-hidden="true"
            className="shrink-0 text-ink-4 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-brand-600"
          />
        </button>

        <button
          type="button"
          onClick={() => navigate("/alerts")}
          className="group flex items-center gap-4 rounded-xl border border-line bg-surface p-5 text-left shadow-card transition duration-150 hover:border-brand-500 hover:shadow-raised"
        >
          <IconTile icon={AlertTriangle} tone="crit" size="lg" />

          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-ink">Review Alerts</h3>

            <p className="mt-0.5 text-sm text-ink-3">
              Review indicators that need attention.
            </p>
          </div>

          <ArrowRight
            size={18}
            aria-hidden="true"
            className="shrink-0 text-ink-4 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-brand-600"
          />
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
