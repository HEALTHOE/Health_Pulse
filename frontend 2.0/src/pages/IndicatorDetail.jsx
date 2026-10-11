import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  Target,
  Activity,
  Ruler,
  Sigma,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import api from "../services/api";
import {
  BackLink,
  Card,
  CardSkeleton,
  ChartCard,
  ChartLegend,
  ErrorState,
  PageHeader,
  SectionHeader,
  SelectField,
  Skeleton,
  StatStrip,
  chartTheme,
} from "../components/ui";

const IndicatorDetail = () => {
  const { indicatorId } = useParams();
  const navigate = useNavigate();

  const [indicator, setIndicator] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState("1");
  const [trendData, setTrendData] = useState([]);

  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch indicator + districts
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError("");

        const [indicatorResponse, districtsResponse] =
          await Promise.all([
            api.get(`/api/indicators/${indicatorId}`),
            api.get("/api/districts"),
          ]);

        setIndicator(indicatorResponse.data);
        setDistricts(districtsResponse.data);

        if (districtsResponse.data.length > 0) {
          setSelectedDistrict(
            String(districtsResponse.data[0].id)
          );
        }
      } catch (err) {
        setError(
          err?.response?.data?.error?.message ||
            err?.response?.data?.message ||
            "Failed to load indicator details."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [indicatorId]);

  // Fetch trend
  useEffect(() => {
    if (!indicatorId || !selectedDistrict) {
      return;
    }

    const fetchTrend = async () => {
      try {
        setTrendLoading(true);

        const response = await api.get(
          `/api/indicators/${indicatorId}/trend`,
          {
            params: {
              level: "DISTRICT",
              district_id: selectedDistrict,
            },
          }
        );

        setTrendData(response.data?.data || []);
      } catch (err) {
        setTrendData([]);
      } finally {
        setTrendLoading(false);
      }
    };

    fetchTrend();
  }, [indicatorId, selectedDistrict]);

  const formatValue = (value) => {
    if (value === null || value === undefined) {
      return "—";
    }

    return `${Number(value).toFixed(2)}${
      indicator?.unit === "%" ? "%" : ""
    }`;
  };

  const getDirectionLabel = () => {
    if (indicator?.direction === "LOWER_IS_BETTER") {
      return "Lower is better";
    }

    return "Higher is better";
  };

  if (loading) {
    return (
      <div aria-busy="true">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="mt-4 h-8 w-72" />

        <div role="status" aria-live="polite" className="sr-only">
          Loading indicator...
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <CardSkeleton key={item} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !indicator) {
    return (
      <div>
        <BackLink onClick={() => navigate("/indicators")}>
          Back to Indicators
        </BackLink>

        <ErrorState
          className="mt-6"
          title="Unable to load indicator"
          message={error || "Indicator not found."}
        />
      </div>
    );
  }

  const selectedDistrictName =
    districts.find(
      (district) => String(district.id) === String(selectedDistrict)
    )?.name || "District";

  return (
    <div>
      {/* Back + header */}
      <PageHeader
        back={
          <BackLink onClick={() => navigate("/indicators")}>
            Back to Indicators
          </BackLink>
        }
        icon={Activity}
        title={indicator.name}
        description={indicator.description}
        meta={
          indicator.code ? (
            <span className="rounded-md border border-line bg-surface px-2.5 py-1 font-mono text-xs text-ink-2 shadow-card">
              {indicator.code}
            </span>
          ) : null
        }
      />

      {/* Summary */}
      <StatStrip
        columns="lg:grid-cols-3"
        items={[
          {
            label: "Target",
            value: formatValue(indicator.target),
            icon: Target,
            tone: "info",
          },
          {
            label: "Performance Direction",
            value: <span className="text-xl">{getDirectionLabel()}</span>,
            icon: indicator.direction === "LOWER_IS_BETTER" ? ArrowDown : ArrowUp,
            tone: "info",
          },
          {
            label: "Unit",
            value: indicator.unit,
            icon: Ruler,
            tone: "info",
          },
        ]}
      />

      {/* Trend */}
      <ChartCard
        className="mt-6"
        title={`${indicator.name} Trend`}
        description={`District-level monthly performance for ${selectedDistrictName}.`}
        legend={
          <ChartLegend
            seriesLabel="Monthly value"
            targetLabel={`Target: ${indicator.target}`}
          />
        }
        controls={
          <SelectField
            label="District"
            value={selectedDistrict}
            onChange={(event) => setSelectedDistrict(event.target.value)}
          >
            {districts.map((district) => (
              <option key={district.id} value={district.id}>
                {district.name}
              </option>
            ))}
          </SelectField>
        }
      >
        <div className="h-[360px] sm:h-[420px]">
          {trendLoading ? (
            <div
              role="status"
              aria-live="polite"
              className="flex h-full items-center justify-center rounded-lg border border-dashed border-line-strong bg-sunken"
            >
              <p className="text-sm text-ink-3">Loading trend data...</p>
            </div>
          ) : trendData.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-line-strong bg-sunken px-6">
              <div className="text-center">
                <Activity size={28} className="mx-auto text-ink-4" aria-hidden="true" />

                <p className="mt-3 font-semibold text-ink">
                  No trend data available
                </p>

                <p className="mt-1 text-sm text-ink-3">
                  There is no monthly data available for this indicator.
                </p>
              </div>
            </div>
          ) : (
            <div
              className="h-full"
              role="img"
              aria-label={`${indicator.name} monthly trend chart for ${selectedDistrictName}`}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trendData}
                  margin={{
                    top: 16,
                    right: 24,
                    left: 0,
                    bottom: 12,
                  }}
                >
                  <CartesianGrid {...chartTheme.gridStyle} />

                  <XAxis dataKey="month" {...chartTheme.xAxisStyle} />

                  <YAxis
                    domain={["auto", "auto"]}
                    {...chartTheme.yAxisStyle}
                    tickFormatter={(tick) =>
                      indicator.unit === "%" ? `${tick}%` : tick
                    }
                  />

                  <Tooltip
                    {...chartTheme.tooltipStyle}
                    formatter={(value) => [
                      `${Number(value).toFixed(2)}${
                        indicator.unit === "%" ? "%" : ""
                      }`,
                      indicator.name,
                    ]}
                  />

                  <ReferenceLine
                    y={indicator.target}
                    {...chartTheme.targetLineStyle}
                    label={chartTheme.targetLabel(
                      `Target: ${indicator.target}`,
                      "insideTopRight"
                    )}
                  />

                  <Line dataKey="value" {...chartTheme.lineStyle} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </ChartCard>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Thresholds */}
        <Card className="p-5 sm:p-6" aria-labelledby="indicator-thresholds">
          <SectionHeader
            id="indicator-thresholds"
            title="Performance Thresholds"
            description="Values at which an alert is raised."
          />

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-warn-100 bg-warn-50 p-4">
              <p className="flex items-center gap-2 text-xs font-medium text-warn-700">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-warn-500" />
                Warning Threshold
              </p>

              <p className="num mt-2 text-2xl font-semibold text-warn-700">
                {formatValue(indicator.warning_threshold)}
              </p>
            </div>

            <div className="rounded-lg border border-crit-100 bg-crit-50 p-4">
              <p className="flex items-center gap-2 text-xs font-medium text-crit-700">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-crit-600" />
                Critical Threshold
              </p>

              <p className="num mt-2 text-2xl font-semibold text-crit-700">
                {formatValue(indicator.critical_threshold)}
              </p>
            </div>
          </div>
        </Card>

        {/* Formula */}
        <Card className="p-5 sm:p-6" aria-labelledby="indicator-calculation">
          <SectionHeader
            id="indicator-calculation"
            title="Calculation"
            description="How this indicator is computed."
          />

          <div className="mt-5 flex items-start gap-3 rounded-lg border border-line bg-sunken p-4">
            <Sigma size={18} className="mt-0.5 shrink-0 text-ink-4" aria-hidden="true" />

            <p className="break-words font-mono text-sm leading-relaxed text-ink-2">
              {indicator.formula}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default IndicatorDetail;
