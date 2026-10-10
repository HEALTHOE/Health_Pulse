import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Map,
  Building2,
  ArrowRight,
} from "lucide-react";
import api from "../services/api";

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
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Dashboard
        </h1>

        <p className="mt-2 text-slate-500">
          Overview of district health performance.
        </p>

        <div className="mt-8 bg-white border border-slate-200 rounded-xl p-8">
          <p className="text-sm text-slate-500">
            Loading dashboard data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Dashboard
        </h1>

        <p className="mt-2 text-slate-500">
          Overview of district health performance.
        </p>

        <div className="mt-8 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-5">
          <AlertTriangle
            size={20}
            className="text-red-500 shrink-0"
          />

          <div>
            <p className="font-medium text-red-800">
              Unable to load dashboard
            </p>

            <p className="mt-1 text-sm text-red-700">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const statusClass = {
    NORMAL: "bg-green-100 text-green-700",
    WARNING: "bg-yellow-100 text-yellow-700",
    CRITICAL: "bg-red-100 text-red-700",
  };

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

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Dashboard
          </h1>

          <p className="mt-2 text-slate-500">
            Overview of district health performance.
          </p>
        </div>

        <div className="text-sm text-slate-500">
          Reporting period:{" "}
          <span className="font-medium text-slate-700">
            {summary.period}
          </span>
        </div>
      </div>

      {/* District Banner */}
      <div className="mt-6 bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">
            Selected District
          </p>

          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            {summary.district.name}
          </h2>
        </div>

        <button
          onClick={() =>
            navigate(`/districts/${summary.district.id}`)
          }
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
        >
          View District
          <ArrowRight size={16} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Health Score
            </p>

            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <Activity
                size={19}
                className="text-blue-600"
              />
            </div>
          </div>

          <p className="mt-3 text-3xl font-bold text-slate-900">
            {summary.health_score}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Overall district performance
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Health Status
            </p>

            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle
                size={19}
                className="text-green-600"
              />
            </div>
          </div>

          <div className="mt-4">
            <span
              className={`inline-flex px-3 py-1.5 rounded-full text-sm font-medium ${
                statusClass[summary.health_status] ||
                "bg-slate-100 text-slate-700"
              }`}
            >
              {summary.health_status}
            </span>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Current district status
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Critical Alerts
            </p>

            <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertTriangle
                size={19}
                className="text-red-500"
              />
            </div>
          </div>

          <p className="mt-3 text-3xl font-bold text-slate-900">
            {summary.critical_alerts}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Issues requiring immediate attention
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Reporting Period
            </p>

            <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center">
              <Map
                size={19}
                className="text-slate-600"
              />
            </div>
          </div>

          <p className="mt-3 text-3xl font-bold text-slate-900">
            {summary.period}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Latest available data
          </p>
        </div>
      </div>

      {/* Indicator Performance */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Indicator Performance
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Key health indicators for {summary.district.name}.
            </p>
          </div>

          <button
            onClick={() => navigate("/indicators")}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View all
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {indicators.map((indicator) => (
            <div
              key={indicator.name}
              className="bg-white border border-slate-200 rounded-xl p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-slate-700">
                  {indicator.name}
                </p>

                <span
                  className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${
                    statusClass[indicator.status] ||
                    "bg-slate-100 text-slate-700"
                  }`}
                >
                  {indicator.status}
                </span>
              </div>

              <p className="mt-5 text-2xl font-bold text-slate-900">
                {indicator.value}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Summary */}
      <div className="mt-8 bg-white border border-slate-200 rounded-xl p-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Performance Summary
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Distribution of indicator performance.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg bg-green-50 border border-green-100 p-5">
            <p className="text-sm text-green-700">
              Normal
            </p>

            <p className="mt-2 text-2xl font-bold text-green-700">
              {summary.performance.normal}
            </p>

            <p className="mt-1 text-xs text-green-600">
              Indicators performing normally
            </p>
          </div>

          <div className="rounded-lg bg-yellow-50 border border-yellow-100 p-5">
            <p className="text-sm text-yellow-700">
              Warning
            </p>

            <p className="mt-2 text-2xl font-bold text-yellow-700">
              {summary.performance.warning}
            </p>

            <p className="mt-1 text-xs text-yellow-600">
              Indicators below target
            </p>
          </div>

          <div className="rounded-lg bg-red-50 border border-red-100 p-5">
            <p className="text-sm text-red-700">
              Critical
            </p>

            <p className="mt-2 text-2xl font-bold text-red-700">
              {summary.performance.critical}
            </p>

            <p className="mt-1 text-xs text-red-600">
              Indicators requiring immediate attention
            </p>
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
        <button
          onClick={() => navigate("/districts")}
          className="bg-white border border-slate-200 rounded-xl p-6 text-left hover:border-blue-300 hover:shadow-sm transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Map
                size={20}
                className="text-blue-600"
              />
            </div>

            <div>
              <h3 className="font-semibold text-slate-900">
                Explore Districts
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Compare district and block-level performance.
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate("/alerts")}
          className="bg-white border border-slate-200 rounded-xl p-6 text-left hover:border-blue-300 hover:shadow-sm transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertTriangle
                size={20}
                className="text-red-500"
              />
            </div>

            <div>
              <h3 className="font-semibold text-slate-900">
                Review Alerts
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Review indicators that need attention.
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default Dashboard;