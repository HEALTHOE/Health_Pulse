import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Target,
  Activity,
  AlertCircle,
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

  const getDirectionIcon = () => {
    if (indicator?.direction === "LOWER_IS_BETTER") {
      return <ArrowDown size={17} />;
    }

    return <ArrowUp size={17} />;
  };

  if (loading) {
    return (
      <div>
        <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
        <div className="mt-4 h-8 w-72 bg-slate-200 rounded animate-pulse" />

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="bg-white border border-slate-200 rounded-xl p-6 animate-pulse"
            >
              <div className="h-4 w-24 bg-slate-200 rounded" />
              <div className="mt-4 h-8 w-28 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !indicator) {
    return (
      <div>
        <button
          onClick={() => navigate("/indicators")}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft size={17} />
          Back to Indicators
        </button>

        <div className="mt-8 bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-3">
          <AlertCircle
            size={20}
            className="text-red-500 shrink-0"
          />

          <div>
            <p className="font-medium text-red-800">
              Unable to load indicator
            </p>

            <p className="mt-1 text-sm text-red-700">
              {error || "Indicator not found."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const selectedDistrictName =
    districts.find(
      (district) => String(district.id) === String(selectedDistrict)
    )?.name || "District";

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => navigate("/indicators")}
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
      >
        <ArrowLeft size={17} />
        Back to Indicators
      </button>

      {/* Header */}
      <div className="mt-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
            <Activity
              size={23}
              className="text-blue-600"
            />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {indicator.name}
            </h1>

            <p className="mt-1 text-sm font-medium text-slate-400">
              {indicator.code}
            </p>

            <p className="mt-2 text-slate-500">
              {indicator.description}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-2 text-slate-500">
            <Target size={17} />

            <span className="text-sm">
              Target
            </span>
          </div>

          <p className="mt-3 text-3xl font-bold text-slate-900">
            {formatValue(indicator.target)}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-2 text-slate-500">
            {getDirectionIcon()}

            <span className="text-sm">
              Performance Direction
            </span>
          </div>

          <p className="mt-3 text-lg font-semibold text-slate-900">
            {getDirectionLabel()}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <p className="text-sm text-slate-500">
            Unit
          </p>

          <p className="mt-3 text-3xl font-bold text-slate-900">
            {indicator.unit}
          </p>
        </div>
      </div>

      {/* Thresholds */}
      <div className="mt-6 bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-semibold text-slate-900">
          Performance Thresholds
        </h2>

        <div className="mt-4 flex flex-wrap gap-4">
          <div className="px-4 py-3 rounded-lg bg-yellow-50 border border-yellow-100">
            <p className="text-xs text-yellow-700">
              Warning Threshold
            </p>

            <p className="mt-1 font-semibold text-yellow-800">
              {formatValue(indicator.warning_threshold)}
            </p>
          </div>

          <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-100">
            <p className="text-xs text-red-700">
              Critical Threshold
            </p>

            <p className="mt-1 font-semibold text-red-800">
              {formatValue(indicator.critical_threshold)}
            </p>
          </div>
        </div>
      </div>

      {/* Trend */}
      <div className="mt-6 bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {indicator.name} Trend
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              District-level monthly performance for{" "}
              {selectedDistrictName}.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              District
            </label>

            <select
              value={selectedDistrict}
              onChange={(event) =>
                setSelectedDistrict(event.target.value)
              }
              className="w-56 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {districts.map((district) => (
                <option
                  key={district.id}
                  value={district.id}
                >
                  {district.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-8 h-[420px]">
          {trendLoading ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm text-slate-500">
                Loading trend data...
              </p>
            </div>
          ) : trendData.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Activity
                  size={32}
                  className="mx-auto text-slate-400"
                />

                <p className="mt-3 font-medium text-slate-700">
                  No trend data available
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  There is no monthly data available for this indicator.
                </p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendData}
                margin={{
                  top: 10,
                  right: 20,
                  left: 10,
                  bottom: 20,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                />

                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 12 }}
                />

                <Tooltip
                  formatter={(value) => [
                    `${Number(value).toFixed(2)}${
                      indicator.unit === "%" ? "%" : ""
                    }`,
                    indicator.name,
                  ]}
                />

                <ReferenceLine
                  y={indicator.target}
                  stroke="#94a3b8"
                  strokeDasharray="5 5"
                  label={{
                    value: `Target: ${indicator.target}`,
                    position: "insideRight",
                    fontSize: 12,
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{
                    r: 3,
                    fill: "#ffffff",
                    stroke: "#2563eb",
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 5,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Formula */}
      <div className="mt-6 bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="font-semibold text-slate-900">
          Calculation
        </h2>

        <div className="mt-3 bg-slate-50 rounded-lg p-4">
          <p className="text-sm text-slate-600 font-mono">
            {indicator.formula}
          </p>
        </div>
      </div>
    </div>
  );
};

export default IndicatorDetail;