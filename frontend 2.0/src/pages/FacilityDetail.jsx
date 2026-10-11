import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  Building2,
  MapPin,
  Target,
  TrendingDown,
  TrendingUp,
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
  ChartCard,
  ChartLegend,
  ErrorState,
  IconTile,
  LoadingState,
  PageHeader,
  SelectField,
  chartTheme,
} from "../components/ui";

const InfoItem = ({ label, children }) => (
  <div>
    <dt className="text-xs text-ink-3">{label}</dt>
    <dd className="mt-1 text-sm font-medium text-ink">{children}</dd>
  </div>
);

const FacilityDetail = () => {
  const { facilityId } = useParams();
  const navigate = useNavigate();

  const [facility, setFacility] = useState(null);
  const [indicators, setIndicators] = useState([]);
  const [selectedIndicatorId, setSelectedIndicatorId] = useState("");

  const [trend, setTrend] = useState(null);

  const [loadingFacility, setLoadingFacility] = useState(true);
  const [loadingIndicators, setLoadingIndicators] = useState(true);
  const [loadingTrend, setLoadingTrend] = useState(false);

  const [error, setError] = useState("");

  // --------------------------------------------------
  // Fetch facility
  // --------------------------------------------------
  useEffect(() => {
    const fetchFacility = async () => {
      try {
        setLoadingFacility(true);
        setError("");

        const response = await api.get(`/api/facilities/${facilityId}`);

        setFacility(response.data);
      } catch (err) {
        setError(
          err?.response?.data?.error?.message ||
            err?.response?.data?.message ||
            "Failed to load facility details."
        );
      } finally {
        setLoadingFacility(false);
      }
    };

    fetchFacility();
  }, [facilityId]);

  // --------------------------------------------------
  // Fetch indicators
  // --------------------------------------------------
  useEffect(() => {
    const fetchIndicators = async () => {
      try {
        setLoadingIndicators(true);

        const response = await api.get("/api/indicators");

        setIndicators(response.data);

        if (response.data.length > 0) {
          setSelectedIndicatorId(String(response.data[0].id));
        }
      } catch (err) {
        setError(
          err?.response?.data?.error?.message ||
            err?.response?.data?.message ||
            "Failed to load indicators."
        );
      } finally {
        setLoadingIndicators(false);
      }
    };

    fetchIndicators();
  }, []);

  // --------------------------------------------------
  // Selected indicator
  // --------------------------------------------------
  const selectedIndicator = useMemo(() => {
    return indicators.find(
      (indicator) => String(indicator.id) === String(selectedIndicatorId)
    );
  }, [indicators, selectedIndicatorId]);

  // --------------------------------------------------
  // Fetch facility-level trend
  // --------------------------------------------------
  useEffect(() => {
    if (!facilityId || !selectedIndicatorId) {
      return;
    }

    const fetchTrend = async () => {
      try {
        setLoadingTrend(true);
        setTrend(null);

        const response = await api.get(
          `/api/indicators/${selectedIndicatorId}/trend`,
          {
            params: {
              level: "FACILITY",
              facility_id: facilityId,
            },
          }
        );

        setTrend(response.data);
      } catch (err) {
        setTrend(null);

        setError(
          err?.response?.data?.error?.message ||
            err?.response?.data?.message ||
            "Failed to load facility trend."
        );
      } finally {
        setLoadingTrend(false);
      }
    };

    fetchTrend();
  }, [facilityId, selectedIndicatorId]);

  // --------------------------------------------------
  // Chart data
  // --------------------------------------------------
  const chartData = trend?.data || [];

  const latestValue =
    chartData.length > 0
      ? chartData[chartData.length - 1]?.value
      : null;

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------
  if (loadingFacility || loadingIndicators) {
    return (
      <div>
        <PageHeader title="Facility Details" />

        <LoadingState label="Loading facility information..." />
      </div>
    );
  }

  // --------------------------------------------------
  // Error / no facility
  // --------------------------------------------------
  if (error && !facility) {
    return (
      <div>
        <BackLink onClick={() => navigate("/blocks")}>Back to Blocks</BackLink>

        <ErrorState className="mt-6" title="Unable to load facility" message={error} />
      </div>
    );
  }

  if (!facility) {
    return null;
  }

  const unitSuffix =
    selectedIndicator?.unit === "%" ? "%" : ` ${selectedIndicator?.unit ?? ""}`;

  return (
    <div>
      {/* Back + header */}
      <PageHeader
        back={
          <BackLink onClick={() => navigate(`/blocks/${facility.block_id}`)}>
            Back to Block
          </BackLink>
        }
        icon={Building2}
        title={facility.name}
        description="Facility information and health performance details."
      />

      {/* Facility information */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* Facility card */}
        <Card className="p-6">
          <div className="flex items-center gap-3.5">
            <IconTile icon={Building2} tone="info" size="lg" />

            <div className="min-w-0">
              <p className="text-sm text-ink-3">Facility</p>
              <p className="text-lg font-semibold leading-snug text-ink">
                {facility.name}
              </p>
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-5 border-t border-line pt-5">
            <InfoItem label="Facility Type">{facility.facility_type}</InfoItem>
            <InfoItem label="Facility ID">
              <span className="num">{facility.id}</span>
            </InfoItem>
          </dl>
        </Card>

        {/* Location card */}
        <Card className="p-6">
          <div className="flex items-center gap-3.5">
            <IconTile icon={MapPin} tone="info" size="lg" />

            <div className="min-w-0">
              <p className="text-sm text-ink-3">Location</p>
              <p className="text-lg font-semibold leading-snug text-ink">
                {facility.district_name}
              </p>
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-5 border-t border-line pt-5">
            <InfoItem label="District">{facility.district_name}</InfoItem>

            <InfoItem label="Block">
              <button
                type="button"
                onClick={() => navigate(`/blocks/${facility.block_id}`)}
                className="rounded text-left font-medium text-brand-700 hover:text-brand-600 hover:underline"
              >
                {facility.block_name}
              </button>
            </InfoItem>
          </dl>
        </Card>
      </div>

      {/* Facility Analytics */}
      <ChartCard
        className="mt-8"
        title="Facility Analytics"
        description="Facility-level health indicator performance."
        controls={
          <SelectField
            label="Indicator"
            value={selectedIndicatorId}
            onChange={(event) => setSelectedIndicatorId(event.target.value)}
          >
            {indicators.map((indicator) => (
              <option key={indicator.id} value={indicator.id}>
                {indicator.name}
              </option>
            ))}
          </SelectField>
        }
      >
        {/* Indicator summary */}
        {selectedIndicator && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-line bg-sunken p-4">
              <div className="flex items-center gap-2 text-ink-3">
                <TrendingUp size={16} aria-hidden="true" />
                <p className="text-sm">Latest Value</p>
              </div>

              <p className="num mt-2.5 text-2xl font-semibold text-ink">
                {latestValue !== null
                  ? `${Number(latestValue).toFixed(2)}${unitSuffix}`
                  : "—"}
              </p>

              {chartData.length > 0 && (
                <p className="mt-1 text-xs text-ink-3">
                  Latest period: {chartData[chartData.length - 1]?.month}
                </p>
              )}
            </div>

            <div className="rounded-lg border border-line bg-sunken p-4">
              <div className="flex items-center gap-2 text-ink-3">
                <Target size={16} aria-hidden="true" />
                <p className="text-sm">Target</p>
              </div>

              <p className="num mt-2.5 text-2xl font-semibold text-ink">
                {selectedIndicator.target}
                {selectedIndicator.unit === "%" ? "%" : ""}
              </p>

              <p className="mt-1 text-xs text-ink-3">Performance target</p>
            </div>

            <div className="rounded-lg border border-line bg-sunken p-4">
              <div className="flex items-center gap-2 text-ink-3">
                {selectedIndicator.direction === "LOWER_IS_BETTER" ? (
                  <TrendingDown size={16} aria-hidden="true" />
                ) : (
                  <TrendingUp size={16} aria-hidden="true" />
                )}

                <p className="text-sm">Direction</p>
              </div>

              <p className="mt-2.5 text-lg font-semibold text-ink">
                {selectedIndicator.direction === "LOWER_IS_BETTER"
                  ? "Lower is better"
                  : "Higher is better"}
              </p>

              <p className="mt-1 text-xs text-ink-3">{selectedIndicator.unit}</p>
            </div>
          </div>
        )}

        {/* Indicator description */}
        {selectedIndicator?.description && (
          <p className="mt-4 rounded-lg border-l-4 border-brand-500 bg-brand-50 px-4 py-3 text-sm leading-relaxed text-ink-2">
            {selectedIndicator.description}
          </p>
        )}

        {/* Trend chart */}
        <div className="mt-7">
          {loadingTrend ? (
            <div
              role="status"
              aria-live="polite"
              className="flex h-80 items-center justify-center rounded-lg border border-dashed border-line-strong bg-sunken"
            >
              <p className="text-sm text-ink-3">Loading facility trend...</p>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex h-80 flex-col items-center justify-center rounded-lg border border-dashed border-line-strong bg-sunken px-6 text-center">
              <Activity size={26} className="text-ink-4" aria-hidden="true" />
              <p className="mt-3 text-sm text-ink-3">
                No trend data available for this facility.
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <h3 className="text-base font-semibold text-ink">
                  {selectedIndicator?.name} Trend
                </h3>

                <p className="mt-0.5 text-xs text-ink-3">
                  Monthly facility-level performance for {facility.name}.
                </p>

                <div className="mt-3">
                  <ChartLegend
                    seriesLabel="Monthly value"
                    targetLabel={
                      selectedIndicator?.target !== undefined
                        ? `Target ${selectedIndicator.target}`
                        : undefined
                    }
                  />
                </div>
              </div>

              <div className="h-80" role="img" aria-label={`${selectedIndicator?.name} monthly trend chart`}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{
                      top: 16,
                      right: 24,
                      left: 0,
                      bottom: 8,
                    }}
                  >
                    <CartesianGrid {...chartTheme.gridStyle} />

                    <XAxis dataKey="month" {...chartTheme.xAxisStyle} />

                    <YAxis
                      domain={["auto", "auto"]}
                      {...chartTheme.yAxisStyle}
                      tickFormatter={(tick) =>
                        selectedIndicator?.unit === "%" ? `${tick}%` : tick
                      }
                    />

                    <Tooltip
                      {...chartTheme.tooltipStyle}
                      formatter={(value) => [
                        `${Number(value).toFixed(2)} ${
                          selectedIndicator?.unit || ""
                        }`,
                        selectedIndicator?.name,
                      ]}
                    />

                    {selectedIndicator?.target !== undefined && (
                      <ReferenceLine
                        y={selectedIndicator.target}
                        {...chartTheme.targetLineStyle}
                        label={chartTheme.targetLabel(
                          `Target ${selectedIndicator.target}`
                        )}
                      />
                    )}

                    <Line dataKey="value" {...chartTheme.lineStyle} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </ChartCard>

      {/* Error for trend only */}
      {error && facility && (
        <ErrorState className="mt-4" title="Trend unavailable" message={error} />
      )}
    </div>
  );
};

export default FacilityDetail;
