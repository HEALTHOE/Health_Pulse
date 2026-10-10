import { useEffect, useState } from "react";
import {
  Search,
  Target,
  TrendingUp,
  TrendingDown,
  X,
  Loader2,
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

const Indicators = () => {
  const [indicators, setIndicators] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedIndicator, setSelectedIndicator] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [trendData, setTrendData] = useState([]);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendError, setTrendError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [indicatorResponse, districtResponse] = await Promise.all([
          api.get("/api/indicators"),
          api.get("/api/districts"),
        ]);

        setIndicators(indicatorResponse.data);
        setDistricts(districtResponse.data);

        if (districtResponse.data.length > 0) {
          setSelectedDistrict(String(districtResponse.data[0].id));
        }
      } catch (err) {
        setError(
          err.response?.data?.error?.message ||
            "Failed to load indicators."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedIndicator || !selectedDistrict) {
      return;
    }

    const fetchTrend = async () => {
      try {
        setTrendLoading(true);
        setTrendError("");

        const response = await api.get(
          `/api/indicators/${selectedIndicator.id}/trend`,
          {
            params: {
              level: "DISTRICT",
              district_id: selectedDistrict,
            },
          }
        );

        setTrendData(response.data.data || []);
      } catch (err) {
        setTrendData([]);
        setTrendError(
          err.response?.data?.error?.message ||
            "Unable to load indicator trend."
        );
      } finally {
        setTrendLoading(false);
      }
    };

    fetchTrend();
  }, [selectedIndicator, selectedDistrict]);

  const filteredIndicators = indicators.filter((indicator) => {
    const query = search.toLowerCase();

    return (
      indicator.name.toLowerCase().includes(query) ||
      indicator.code.toLowerCase().includes(query) ||
      indicator.description.toLowerCase().includes(query)
    );
  });

  const formatValue = (value, unit) => {
    if (unit === "%") {
      return `${value}%`;
    }

    return `${value} ${unit}`;
  };

  const openTrend = (indicator) => {
    setSelectedIndicator(indicator);
    setTrendData([]);
    setTrendError("");
  };

  const closeTrend = () => {
    setSelectedIndicator(null);
    setTrendData([]);
    setTrendError("");
  };

  const selectedDistrictName =
    districts.find(
      (district) => String(district.id) === String(selectedDistrict)
    )?.name || "";

  return (
    <div>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Health Indicators
        </h1>

        <p className="mt-2 text-slate-500">
          Monitor key health indicators, targets, and performance thresholds.
        </p>
      </div>

      {/* Search */}
      <div className="mt-6 max-w-lg relative">
        <Search
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type="text"
          placeholder="Search indicators..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-lg
                     pl-11 pr-4 py-3 text-sm outline-none
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="mt-8 bg-white border border-slate-200 rounded-xl p-8 text-center">
          <p className="text-slate-500">Loading indicators...</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="mt-8 bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Indicator count */}
      {!loading && !error && (
        <p className="mt-6 text-sm text-slate-500">
          {filteredIndicators.length}{" "}
          {filteredIndicators.length === 1 ? "indicator" : "indicators"}
        </p>
      )}

      {/* Cards */}
      {!loading && !error && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredIndicators.map((indicator) => {
            const isHigherBetter =
              indicator.direction === "HIGHER_IS_BETTER";

            return (
              <div
                key={indicator.id}
                className="bg-white border border-slate-200 rounded-xl p-6
                           hover:border-blue-300 hover:shadow-sm transition"
              >
                {/* Top */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      {isHigherBetter ? (
                        <TrendingUp size={20} className="text-blue-600" />
                      ) : (
                        <TrendingDown size={20} className="text-blue-600" />
                      )}
                    </div>

                    <div>
                      <h2 className="font-semibold text-slate-900">
                        {indicator.name}
                      </h2>

                      <p className="text-xs text-slate-400 mt-1">
                        {indicator.code}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                    {indicator.unit}
                  </span>
                </div>

                {/* Description */}
                <p className="mt-5 text-sm text-slate-500 leading-6">
                  {indicator.description}
                </p>

                {/* Target + Direction */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Target size={15} />
                      Target
                    </div>

                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      {formatValue(indicator.target, indicator.unit)}
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-xs text-slate-500">
                      Direction
                    </p>

                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {isHigherBetter
                        ? "Higher is better"
                        : "Lower is better"}
                    </p>
                  </div>
                </div>

                {/* Thresholds */}
                <div className="mt-5 pt-5 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500 mb-3">
                    Performance thresholds
                  </p>

                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-slate-400">Warning: </span>
                      <span className="font-medium text-amber-600">
                        {formatValue(
                          indicator.warning_threshold,
                          indicator.unit
                        )}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400">Critical: </span>
                      <span className="font-medium text-red-600">
                        {formatValue(
                          indicator.critical_threshold,
                          indicator.unit
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Formula */}
                <div className="mt-4">
                  <p className="text-xs text-slate-400">
                    Formula
                  </p>

                  <code className="block mt-1 text-xs bg-slate-50 rounded-md px-3 py-2 text-slate-600 break-words">
                    {indicator.formula}
                  </code>
                </div>

                {/* Trend button */}
                <button
                  onClick={() => openTrend(indicator)}
                  className="mt-5 w-full flex items-center justify-center gap-2
                             px-4 py-2.5 rounded-lg bg-blue-50 text-blue-600
                             text-sm font-medium hover:bg-blue-100 transition"
                >
                  View Trend
                  <TrendingUp size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filteredIndicators.length === 0 && (
        <div className="mt-8 bg-white border border-slate-200 rounded-xl p-10 text-center">
          <p className="text-slate-500">
            No indicators found matching "{search}".
          </p>
        </div>
      )}

      {/* Trend Modal */}
      {selectedIndicator && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {selectedIndicator.name} Trend
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  District-level monthly performance
                  {selectedDistrictName
                    ? ` for ${selectedDistrictName}.`
                    : "."}
                </p>
              </div>

              <button
                onClick={closeTrend}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* District selector */}
            <div className="px-6 pt-5">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                District
              </label>

              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full md:w-72 border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                {districts.map((district) => (
                  <option key={district.id} value={district.id}>
                    {district.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Chart */}
            <div className="p-6">
              {trendLoading && (
                <div className="h-80 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Loader2 size={18} className="animate-spin" />
                    Loading trend...
                  </div>
                </div>
              )}

              {!trendLoading && trendError && (
                <div className="h-80 flex items-center justify-center">
                  <p className="text-red-600 text-sm">
                    {trendError}
                  </p>
                </div>
              )}

              {!trendLoading &&
                !trendError &&
                trendData.length > 0 && (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={trendData}
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
                          tick={{ fontSize: 12 }}
                        />

                        <YAxis
                          domain={["auto", "auto"]}
                          tick={{ fontSize: 12 }}
                        />

                        <Tooltip
                          formatter={(value) => [
                            `${Number(value).toFixed(2)} ${
                              selectedIndicator.unit
                            }`,
                            selectedIndicator.name,
                          ]}
                        />

                        <ReferenceLine
                          y={selectedIndicator.target}
                          stroke="#64748b"
                          strokeDasharray="6 4"
                          label={{
                            value: `Target: ${selectedIndicator.target}`,
                            position: "insideTopRight",
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
                          }}
                          activeDot={{
                            r: 5,
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

              {!trendLoading &&
                !trendError &&
                trendData.length === 0 && (
                  <div className="h-80 flex items-center justify-center">
                    <p className="text-slate-500 text-sm">
                      No trend data available.
                    </p>
                  </div>
                )}
            </div>

            {/* Footer information */}
            <div className="px-6 pb-6">
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                  <div>
                    <span className="text-slate-500">
                      Target:{" "}
                    </span>
                    <span className="font-semibold text-slate-900">
                      {formatValue(
                        selectedIndicator.target,
                        selectedIndicator.unit
                      )}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500">
                      Direction:{" "}
                    </span>
                    <span className="font-semibold text-slate-900">
                      {selectedIndicator.direction ===
                      "HIGHER_IS_BETTER"
                        ? "Higher is better"
                        : "Lower is better"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500">
                      Data points:{" "}
                    </span>
                    <span className="font-semibold text-slate-900">
                      {trendData.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Indicators;