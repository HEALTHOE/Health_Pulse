import { useEffect, useState } from "react";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Target,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  Button,
  Card,
  CardSkeleton,
  EmptyState,
  ErrorState,
  IconTile,
  PageHeader,
  SectionHeader,
  StatStrip,
} from "../components/ui";

const Indicators = () => {
  const navigate = useNavigate();

  const [indicators, setIndicators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchIndicators = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/api/indicators");

        setIndicators(response.data);
      } catch (err) {
        setError(
          err?.response?.data?.error?.message ||
            err?.response?.data?.message ||
            "Failed to load indicators."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchIndicators();
  }, []);

  const getDirectionIcon = (direction) => {
    if (direction === "LOWER_IS_BETTER") {
      return <ArrowDown size={15} />;
    }

    return <ArrowUp size={15} />;
  };

  const getDirectionLabel = (direction) => {
    if (direction === "LOWER_IS_BETTER") {
      return "Lower is better";
    }

    return "Higher is better";
  };

  const formatValue = (value, unit) => {
    if (unit === "%") {
      return `${value}%`;
    }

    return value;
  };

  if (loading) {
    return (
      <div aria-busy="true">
        <PageHeader
          title="Indicators"
          description="Monitor key health indicators and their performance."
        />

        <div role="status" aria-live="polite" className="sr-only">
          Loading indicators...
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <CardSkeleton key={item} lines={4} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader
          title="Indicators"
          description="Monitor key health indicators and their performance."
        />

        <ErrorState title="Unable to load indicators" message={error} />
      </div>
    );
  }

  const higherIsBetterCount = indicators.filter(
    (indicator) => indicator.direction === "HIGHER_IS_BETTER"
  ).length;

  const lowerIsBetterCount = indicators.filter(
    (indicator) => indicator.direction === "LOWER_IS_BETTER"
  ).length;

  return (
    <div>
      {/* Page Header */}
      <PageHeader
        title="Indicators"
        description="Monitor key health indicators and their performance."
      />

      {/* Summary */}
      <StatStrip
        columns="lg:grid-cols-3"
        items={[
          {
            label: "Total Indicators",
            value: indicators.length,
            icon: Activity,
            tone: "info",
          },
          {
            label: "Higher is Better",
            value: higherIsBetterCount,
            icon: TrendingUp,
            tone: "ok",
          },
          {
            label: "Lower is Better",
            value: lowerIsBetterCount,
            icon: ArrowDown,
            tone: "warn",
          },
        ]}
      />

      {/* Indicator List */}
      <section className="mt-10" aria-labelledby="indicator-list">
        <SectionHeader
          id="indicator-list"
          title="Health Indicators"
          description="Definitions, targets and performance thresholds."
          action={
            <span className="text-sm text-ink-3">
              <span className="num font-medium text-ink-2">{indicators.length}</span>{" "}
              indicators
            </span>
          }
        />

        {indicators.length === 0 ? (
          <EmptyState
            className="mt-5"
            icon={Activity}
            title="No indicators available"
            description="There are currently no indicators configured in the system."
          />
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {indicators.map((indicator) => (
              <Card
                as="article"
                key={indicator.id}
                className="flex flex-col p-6 transition duration-150 hover:border-brand-500 hover:shadow-raised"
              >
                {/* Indicator Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <IconTile icon={Activity} tone="info" size="lg" />

                    <div>
                      <h3 className="text-base font-semibold text-ink">
                        {indicator.name}
                      </h3>

                      <p className="mt-0.5 font-mono text-xs text-ink-3">
                        {indicator.code}
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 rounded-full border border-line bg-sunken px-2.5 py-1 text-xs font-medium text-ink-2">
                    {indicator.unit}
                  </span>
                </div>

                {/* Description */}
                <p className="mt-4 text-sm leading-6 text-ink-3">
                  {indicator.description}
                </p>

                {/* Metrics */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {/* Target */}
                  <div className="rounded-lg border border-line bg-sunken p-4">
                    <div className="flex items-center gap-2 text-ink-3">
                      <Target size={15} aria-hidden="true" />
                      <span className="text-xs">Target</span>
                    </div>

                    <p className="num mt-2 text-2xl font-semibold text-ink">
                      {formatValue(indicator.target, indicator.unit)}
                    </p>
                  </div>

                  {/* Direction */}
                  <div className="rounded-lg border border-line bg-sunken p-4">
                    <div className="flex items-center gap-2 text-ink-3">
                      {getDirectionIcon(indicator.direction)}
                      <span className="text-xs">Performance</span>
                    </div>

                    <p className="mt-2 text-sm font-semibold leading-snug text-ink">
                      {getDirectionLabel(indicator.direction)}
                    </p>
                  </div>
                </div>

                {/* Thresholds */}
                <div className="mt-5 border-t border-line pt-4">
                  <p className="text-xs font-medium text-ink-3">
                    Performance thresholds
                  </p>

                  <div className="mt-2.5 flex flex-wrap gap-2.5 text-xs font-medium">
                    <span className="inline-flex items-center gap-2 rounded-full border border-warn-100 bg-warn-50 px-3 py-1.5 text-warn-700">
                      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-warn-500" />
                      Warning:{" "}
                      <span className="num">
                        {formatValue(indicator.warning_threshold, indicator.unit)}
                      </span>
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-full border border-crit-100 bg-crit-50 px-3 py-1.5 text-crit-700">
                      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-crit-600" />
                      Critical:{" "}
                      <span className="num">
                        {formatValue(indicator.critical_threshold, indicator.unit)}
                      </span>
                    </span>
                  </div>
                </div>

                {/* View Details */}
                <div className="mt-auto pt-5">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/indicators/${indicator.id}`)}
                    aria-label={`View details for ${indicator.name}`}
                  >
                    View Details
                    <ArrowRight size={15} aria-hidden="true" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Indicators;
