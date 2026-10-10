import { useEffect, useState } from "react";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Target,
  TrendingUp,
  AlertCircle,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

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
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Indicators
        </h1>

        <p className="mt-2 text-slate-500">
          Monitor key health indicators and their performance.
        </p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="bg-white border border-slate-200 rounded-xl p-6 animate-pulse"
            >
              <div className="h-5 w-40 bg-slate-200 rounded" />

              <div className="mt-4 h-4 w-full bg-slate-200 rounded" />

              <div className="mt-2 h-4 w-3/4 bg-slate-200 rounded" />

              <div className="mt-6 h-10 w-24 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Indicators
        </h1>

        <p className="mt-2 text-slate-500">
          Monitor key health indicators and their performance.
        </p>

        <div className="mt-8 bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-3">
          <AlertCircle
            size={20}
            className="text-red-500 shrink-0 mt-0.5"
          />

          <div>
            <p className="font-medium text-red-800">
              Unable to load indicators
            </p>

            <p className="mt-1 text-sm text-red-700">
              {error}
            </p>
          </div>
        </div>
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
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Indicators
        </h1>

        <p className="mt-2 text-slate-500">
          Monitor key health indicators and their performance.
        </p>
      </div>

      {/* Summary */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Total Indicators
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {indicators.length}
              </p>
            </div>

            <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center">
              <Activity
                size={21}
                className="text-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Higher is better */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Higher is Better
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {higherIsBetterCount}
              </p>
            </div>

            <div className="w-11 h-11 rounded-lg bg-green-50 flex items-center justify-center">
              <TrendingUp
                size={21}
                className="text-green-600"
              />
            </div>
          </div>
        </div>

        {/* Lower is better */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Lower is Better
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {lowerIsBetterCount}
              </p>
            </div>

            <div className="w-11 h-11 rounded-lg bg-amber-50 flex items-center justify-center">
              <ArrowDown
                size={21}
                className="text-amber-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Indicator List */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Health Indicators
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Definitions, targets and performance thresholds.
            </p>
          </div>

          <span className="text-sm text-slate-500">
            {indicators.length} indicators
          </span>
        </div>

        {indicators.length === 0 ? (
          <div className="mt-5 bg-white border border-slate-200 rounded-xl p-10 text-center">
            <Activity
              size={32}
              className="mx-auto text-slate-400"
            />

            <p className="mt-3 font-medium text-slate-700">
              No indicators available
            </p>

            <p className="mt-1 text-sm text-slate-500">
              There are currently no indicators configured in the system.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {indicators.map((indicator) => (
              <div
                key={indicator.id}
                className="bg-white border border-slate-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-sm transition"
              >
                {/* Indicator Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <Activity
                        size={20}
                        className="text-blue-600"
                      />
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {indicator.name}
                      </h3>

                      <p className="mt-1 text-xs font-medium text-slate-400">
                        {indicator.code}
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                    {indicator.unit}
                  </span>
                </div>

                {/* Description */}
                <p className="mt-5 text-sm leading-6 text-slate-500">
                  {indicator.description}
                </p>

                {/* Metrics */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  {/* Target */}
                  <div className="rounded-lg bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Target size={16} />

                      <span className="text-xs">
                        Target
                      </span>
                    </div>

                    <p className="mt-2 text-xl font-bold text-slate-900">
                      {formatValue(
                        indicator.target,
                        indicator.unit
                      )}
                    </p>
                  </div>

                  {/* Direction */}
                  <div className="rounded-lg bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-slate-500">
                      {getDirectionIcon(indicator.direction)}

                      <span className="text-xs">
                        Performance
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      {getDirectionLabel(indicator.direction)}
                    </p>
                  </div>
                </div>

                {/* Thresholds */}
                <div className="mt-5 pt-5 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500">
                    Performance thresholds
                  </p>

                  <div className="mt-3 flex flex-wrap gap-3 text-xs">
                    <span className="px-3 py-1.5 rounded-full bg-yellow-50 text-yellow-700">
                      Warning:{" "}
                      {formatValue(
                        indicator.warning_threshold,
                        indicator.unit
                      )}
                    </span>

                    <span className="px-3 py-1.5 rounded-full bg-red-50 text-red-700">
                      Critical:{" "}
                      {formatValue(
                        indicator.critical_threshold,
                        indicator.unit
                      )}
                    </span>
                  </div>
                </div>

                {/* View Details */}
                <div className="mt-6 pt-5 border-t border-slate-100">
                  <button
                    onClick={() =>
                      navigate(`/indicators/${indicator.id}`)
                    }
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
                  >
                    <Eye size={16} />
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Indicators;