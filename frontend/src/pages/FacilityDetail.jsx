import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
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
        <h1 className="text-2xl font-bold text-slate-900">
          Facility Details
        </h1>

        <div className="mt-8 bg-white border border-slate-200 rounded-xl p-8">
          <p className="text-sm text-slate-500">
            Loading facility information...
          </p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // Error / no facility
  // --------------------------------------------------
  if (error && !facility) {
    return (
      <div>
        <button
          onClick={() => navigate("/blocks")}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft size={16} />
          Back to Blocks
        </button>

        <div className="mt-6 bg-white border border-red-200 rounded-xl p-6">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!facility) {
    return null;
  }

  return (
    <div>
      {/* --------------------------------------------------
          Back button
      -------------------------------------------------- */}
      <button
        onClick={() => navigate(`/blocks/${facility.block_id}`)}
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
      >
        <ArrowLeft size={16} />
        Back to Block
      </button>

      {/* --------------------------------------------------
          Header
      -------------------------------------------------- */}
      <div className="mt-6">
        <h1 className="text-2xl font-bold text-slate-900">
          {facility.name}
        </h1>

        <p className="mt-2 text-slate-500">
          Facility information and health performance details.
        </p>
      </div>

      {/* --------------------------------------------------
          Facility information
      -------------------------------------------------- */}
      <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Facility card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Building2 size={22} className="text-blue-600" />
            </div>

            <div>
              <p className="text-sm text-slate-500">Facility</p>

              <p className="text-lg font-semibold text-slate-900 mt-1">
                {facility.name}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <p className="text-xs text-slate-500">
                Facility Type
              </p>

              <p className="mt-1 text-sm font-medium text-slate-900">
                {facility.facility_type}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Facility ID
              </p>

              <p className="mt-1 text-sm font-medium text-slate-900">
                {facility.id}
              </p>
            </div>
          </div>
        </div>

        {/* Location card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <MapPin size={22} className="text-blue-600" />
            </div>

            <div>
              <p className="text-sm text-slate-500">Location</p>

              <p className="text-lg font-semibold text-slate-900 mt-1">
                {facility.district_name}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <p className="text-xs text-slate-500">
                District
              </p>

              <p className="mt-1 text-sm font-medium text-slate-900">
                {facility.district_name}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Block
              </p>

              <button
                onClick={() =>
                  navigate(`/blocks/${facility.block_id}`)
                }
                className="mt-1 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                {facility.block_name}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------
          Facility Analytics
      -------------------------------------------------- */}
      <div className="mt-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Activity size={22} className="text-blue-600" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Facility Analytics
                  </h2>

                  <p className="text-sm text-slate-500 mt-1">
                    Facility-level health indicator performance.
                  </p>
                </div>
              </div>
            </div>

            {/* Indicator selector */}
            <div className="w-full lg:w-72">
              <label className="block text-xs font-medium text-slate-600 mb-2">
                Indicator
              </label>

              <select
                value={selectedIndicatorId}
                onChange={(event) =>
                  setSelectedIndicatorId(event.target.value)
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {indicators.map((indicator) => (
                  <option
                    key={indicator.id}
                    value={indicator.id}
                  >
                    {indicator.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Indicator summary */}
          {selectedIndicator && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border border-slate-200 p-5">
                <div className="flex items-center gap-2">
                  <TrendingUp
                    size={17}
                    className="text-blue-600"
                  />

                  <p className="text-sm text-slate-500">
                    Latest Value
                  </p>
                </div>

                <p className="mt-3 text-2xl font-bold text-slate-900">
                  {latestValue !== null
                    ? `${Number(latestValue).toFixed(2)} ${selectedIndicator.unit === "%" ? "%" : selectedIndicator.unit}`
                    : "—"}
                </p>

                {chartData.length > 0 && (
                  <p className="mt-1 text-xs text-slate-500">
                    Latest period:{" "}
                    {chartData[chartData.length - 1]?.month}
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-slate-200 p-5">
                <div className="flex items-center gap-2">
                  <Target
                    size={17}
                    className="text-blue-600"
                  />

                  <p className="text-sm text-slate-500">
                    Target
                  </p>
                </div>

                <p className="mt-3 text-2xl font-bold text-slate-900">
                  {selectedIndicator.target}
                  {selectedIndicator.unit === "%" ? "%" : ""}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Performance target
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 p-5">
                <div className="flex items-center gap-2">
                  {selectedIndicator.direction ===
                  "LOWER_IS_BETTER" ? (
                    <TrendingDown
                      size={17}
                      className="text-blue-600"
                    />
                  ) : (
                    <TrendingUp
                      size={17}
                      className="text-blue-600"
                    />
                  )}

                  <p className="text-sm text-slate-500">
                    Direction
                  </p>
                </div>

                <p className="mt-3 text-base font-semibold text-slate-900">
                  {selectedIndicator.direction ===
                  "LOWER_IS_BETTER"
                    ? "Lower is better"
                    : "Higher is better"}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {selectedIndicator.unit}
                </p>
              </div>
            </div>
          )}

          {/* Indicator description */}
          {selectedIndicator?.description && (
            <div className="mt-5 rounded-lg bg-slate-50 border border-slate-200 p-4">
              <p className="text-sm text-slate-600">
                {selectedIndicator.description}
              </p>
            </div>
          )}

          {/* --------------------------------------------------
              Trend chart
          -------------------------------------------------- */}
          <div className="mt-6">
            {loadingTrend ? (
              <div className="h-80 flex items-center justify-center border border-slate-200 rounded-lg">
                <p className="text-sm text-slate-500">
                  Loading facility trend...
                </p>
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-80 flex items-center justify-center border border-slate-200 rounded-lg">
                <p className="text-sm text-slate-500">
                  No trend data available for this facility.
                </p>
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-slate-900">
                    {selectedIndicator?.name} Trend
                  </h3>

                  <p className="text-xs text-slate-500 mt-1">
                    Monthly facility-level performance for{" "}
                    {facility.name}.
                  </p>
                </div>

                <div className="h-80">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <LineChart
                      data={chartData}
                      margin={{
                        top: 10,
                        right: 20,
                        left: 10,
                        bottom: 10,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />

                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11 }}
                      />

                      <YAxis
                        domain={["auto", "auto"]}
                        tick={{ fontSize: 11 }}
                      />

                      <Tooltip
                        formatter={(value) => [
                          `${Number(value).toFixed(2)} ${
                            selectedIndicator?.unit || ""
                          }`,
                          selectedIndicator?.name,
                        ]}
                      />

                      {selectedIndicator?.target !==
                        undefined && (
                        <ReferenceLine
                          y={selectedIndicator.target}
                          stroke="#94a3b8"
                          strokeDasharray="6 4"
                          label={{
                            value: `Target ${selectedIndicator.target}`,
                            position: "insideTopRight",
                            fontSize: 11,
                          }}
                        />
                      )}

                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#2563eb"
                        strokeWidth={2.5}
                        dot={{
                          r: 3,
                          strokeWidth: 2,
                        }}
                        activeDot={{
                          r: 5,
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error for trend only */}
      {error && facility && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
};

export default FacilityDetail;