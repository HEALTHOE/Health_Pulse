import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Syringe,
  HeartPulse,
  Stethoscope,
  Baby,
} from "lucide-react";
import api from "../services/api";

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get("/api/dashboard/summary");
        setData(response.data);
      } catch (err) {
        setError(
          err.response?.data?.error?.message ||
            "Unable to load dashboard data."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
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

        <div className="mt-8 bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-500">Loading dashboard data...</p>
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

        <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-5">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  const indicatorData = [
    {
      name: "Immunization",
      value: data.indicators.immunization.value,
      status: data.indicators.immunization.status,
      icon: Syringe,
    },
    {
      name: "ANC Coverage",
      value: data.indicators.anc.value,
      status: data.indicators.anc.status,
      icon: HeartPulse,
    },
    {
      name: "TB Treatment Success",
      value: data.indicators.tb_success.value,
      status: data.indicators.tb_success.status,
      icon: Activity,
    },
    {
      name: "Institutional Delivery",
      value: data.indicators.institutional_delivery.value,
      status: data.indicators.institutional_delivery.status,
      icon: Baby,
    },
  ];

  const getStatusClass = (status) => {
    switch (status) {
      case "NORMAL":
        return "bg-green-100 text-green-700";
      case "WARNING":
        return "bg-yellow-100 text-yellow-700";
      case "CRITICAL":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Dashboard
          </h1>

          <p className="mt-2 text-slate-500">
            Overview of district health performance.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Calendar size={17} />
          <span>{data.period}</span>
        </div>
      </div>

      {/* District */}
      <div className="mt-6">
        <p className="text-sm text-slate-500">District</p>
        <p className="text-lg font-semibold text-slate-800">
          {data.district.name}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Health Score */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Health Score
            </p>

            <Activity size={20} className="text-blue-600" />
          </div>

          <p className="text-3xl font-bold mt-3 text-slate-900">
            {data.health_score}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            Overall district performance
          </p>
        </div>

        {/* Health Status */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Health Status
            </p>

            <CheckCircle size={20} className="text-green-600" />
          </div>

          <span
            className={`inline-block mt-3 px-3 py-1 rounded-full text-sm font-semibold ${getStatusClass(
              data.health_status
            )}`}
          >
            {data.health_status}
          </span>

          <p className="text-xs text-slate-500 mt-2">
            Current district status
          </p>
        </div>

        {/* Critical Alerts */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Critical Alerts
            </p>

            <AlertTriangle size={20} className="text-red-500" />
          </div>

          <p className="text-3xl font-bold mt-3 text-slate-900">
            {data.critical_alerts}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            Critical issues requiring attention
          </p>
        </div>

        {/* Reporting Period */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Reporting Period
            </p>

            <Calendar size={20} className="text-slate-600" />
          </div>

          <p className="text-2xl font-bold mt-3 text-slate-900">
            {data.period}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            Latest available data
          </p>
        </div>
      </div>

      {/* Indicator Performance */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">
          Key Indicator Performance
        </h2>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {indicatorData.map((indicator) => {
            const Icon = indicator.icon;

            return (
              <div
                key={indicator.name}
                className="bg-white rounded-xl border border-slate-200 p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <Icon size={19} className="text-blue-600" />
                    </div>

                    <p className="text-sm font-medium text-slate-700">
                      {indicator.name}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-end justify-between">
                  <p className="text-2xl font-bold text-slate-900">
                    {indicator.value}%
                  </p>

                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusClass(
                      indicator.status
                    )}`}
                  >
                    {indicator.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance Summary */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">
          Performance Summary
        </h2>

        <div className="mt-4 bg-white rounded-xl border border-slate-200 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-slate-500">
                Normal
              </p>

              <p className="text-2xl font-bold text-green-600 mt-1">
                {data.performance.normal}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Warning
              </p>

              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {data.performance.warning}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Critical
              </p>

              <p className="text-2xl font-bold text-red-600 mt-1">
                {data.performance.critical}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;