import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Activity,
  AlertTriangle,
  CheckCircle,
  MapPin,
  Building2,
  Loader2,
} from "lucide-react";
import api from "../services/api";

const DistrictDetail = () => {
  const { districtId } = useParams();
  const navigate = useNavigate();

  const [district, setDistrict] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [blocks, setBlocks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDistrictData = async () => {
      try {
        setLoading(true);
        setError("");

        const [districtResponse, dashboardResponse, blocksResponse] =
          await Promise.all([
            api.get(`/api/districts/${districtId}`),
            api.get(`/api/dashboard/district/${districtId}`),
            api.get("/api/blocks"),
          ]);

        setDistrict(districtResponse.data);
        setDashboard(dashboardResponse.data);

        const blockData = blocksResponse.data;

        const allBlocks = Array.isArray(blockData)
          ? blockData
          : blockData?.data || blockData?.blocks || [];

        const districtBlocks = allBlocks.filter((block) => {
          const blockDistrictId =
            block?.district_id ??
            block?.districtId ??
            block?.district?.id;

          return String(blockDistrictId) === String(districtId);
        });

        setBlocks(districtBlocks);
      } catch (err) {
        console.error("Failed to load district:", err);

        const message =
          err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          "Failed to load district information.";

        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchDistrictData();
  }, [districtId]);

  const getDistrictName = () => {
    return (
      district?.name ||
      district?.district_name ||
      district?.district ||
      dashboard?.district_name ||
      dashboard?.district?.name ||
      `District ${districtId}`
    );
  };

  const getValue = (...values) => {
    for (const value of values) {
      if (value !== undefined && value !== null) {
        return value;
      }
    }

    return null;
  };

  const getHealthScore = () => {
    return getValue(
      dashboard?.health_score,
      dashboard?.healthScore,
      dashboard?.score,
      dashboard?.overall_score
    );
  };

  const getHealthStatus = () => {
    return (
      dashboard?.health_status ||
      dashboard?.healthStatus ||
      dashboard?.status ||
      "NORMAL"
    );
  };

  const getReportingPeriod = () => {
    return (
      dashboard?.reporting_period ||
      dashboard?.reportingPeriod ||
      dashboard?.latest_period ||
      dashboard?.period ||
      "—"
    );
  };

  const getCriticalAlerts = () => {
    return getValue(
      dashboard?.critical_alerts,
      dashboard?.criticalAlerts,
      dashboard?.alerts?.critical,
      0
    );
  };

  /*
   * Backend returns:
   *
   * indicators: {
   *   immunization: {
   *     value: 88.86,
   *     status: "WARNING"
   *   },
   *   anc: {
   *     value: 89.37,
   *     status: "WARNING"
   *   },
   *   tb_success: {
   *     value: 85.71,
   *     status: "WARNING"
   *   },
   *   institutional_delivery: {
   *     value: 89.66,
   *     status: "WARNING"
   *   }
   * }
   *
   * Convert that object into an array for rendering.
   */
  const getIndicators = () => {
    const indicatorData =
      dashboard?.indicators ||
      dashboard?.indicator_performance ||
      dashboard?.indicatorPerformance ||
      {};

    if (!indicatorData || Array.isArray(indicatorData)) {
      return Array.isArray(indicatorData) ? indicatorData : [];
    }

    const indicatorNames = {
      immunization: "Full Immunization Coverage",
      anc: "ANC Coverage",
      tb_success: "TB Treatment Success Rate",
      institutional_delivery: "Institutional Delivery Rate",
    };

    return Object.entries(indicatorData).map(([key, data]) => ({
      id: key,
      name: indicatorNames[key] || key,
      value: data?.value ?? null,
      status: data?.status || "NO_DATA",
    }));
  };

  const getBlockId = (block) => {
    return block?.id ?? block?.block_id;
  };

  const getBlockName = (block) => {
    return (
      block?.name ||
      block?.block_name ||
      block?.block ||
      `Block ${getBlockId(block)}`
    );
  };

  const statusClass = (status) => {
    const normalized = String(status || "").toUpperCase();

    if (normalized === "CRITICAL") {
      return "bg-red-100 text-red-700";
    }

    if (normalized === "WARNING") {
      return "bg-yellow-100 text-yellow-700";
    }

    if (normalized === "NO_DATA") {
      return "bg-slate-100 text-slate-600";
    }

    return "bg-green-100 text-green-700";
  };

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <button
            onClick={() => navigate("/districts")}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft size={16} />
            Back to Districts
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-12 flex items-center justify-center">
          <div className="flex items-center gap-3 text-slate-500">
            <Loader2 size={20} className="animate-spin" />
            Loading district information...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <button
          onClick={() => navigate("/districts")}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft size={16} />
          Back to Districts
        </button>

        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="font-medium text-red-800">
            Unable to load district
          </p>

          <p className="mt-1 text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  const districtName = getDistrictName();
  const healthScore = getHealthScore();
  const healthStatus = getHealthStatus();
  const reportingPeriod = getReportingPeriod();
  const criticalAlerts = getCriticalAlerts();
  const indicators = getIndicators();

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => navigate("/districts")}
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
      >
        <ArrowLeft size={16} />
        Back to Districts
      </button>

      {/* Header */}
      <div className="mt-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center">
            <MapPin size={21} className="text-blue-600" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {districtName}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              District-level health performance and analysis.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Health Score */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Health Score</p>

            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <Activity size={18} className="text-blue-600" />
            </div>
          </div>

          <p className="mt-4 text-2xl font-bold text-slate-900">
            {healthScore !== null ? Number(healthScore).toFixed(2) : "—"}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Overall district performance
          </p>
        </div>

        {/* Health Status */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Health Status</p>

            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle size={18} className="text-green-600" />
            </div>
          </div>

          <div className="mt-4">
            <span
              className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${statusClass(
                healthStatus
              )}`}
            >
              {healthStatus}
            </span>
          </div>

          <p className="mt-2 text-xs text-slate-500">
            Current district status
          </p>
        </div>

        {/* Critical Alerts */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Critical Alerts</p>

            <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertTriangle size={18} className="text-red-500" />
            </div>
          </div>

          <p className="mt-4 text-2xl font-bold text-slate-900">
            {criticalAlerts}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Issues requiring immediate attention
          </p>
        </div>

        {/* Reporting Period */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Reporting Period</p>

            <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center">
              <Activity size={18} className="text-slate-600" />
            </div>
          </div>

          <p className="mt-4 text-2xl font-bold text-slate-900">
            {reportingPeriod}
          </p>

          <p className="mt-1 text-xs text-slate-500">
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
              Key health indicators for {districtName}.
            </p>
          </div>

          <Link
            to="/indicators"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View all
          </Link>
        </div>

        {indicators.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {indicators.slice(0, 4).map((indicator) => {
              const value = indicator.value;
              const status = indicator.status;

              return (
                <div
                  key={indicator.id}
                  className="bg-white border border-slate-200 rounded-xl p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-slate-700">
                      {indicator.name}
                    </p>

                    <span
                      className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-medium ${statusClass(
                        status
                      )}`}
                    >
                      {status}
                    </span>
                  </div>

                  <p className="mt-5 text-2xl font-bold text-slate-900">
                    {value !== null && value !== undefined
                      ? `${Number(value).toFixed(2)}%`
                      : "—"}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 bg-white border border-slate-200 rounded-xl p-6">
            <p className="text-sm text-slate-500">
              Indicator performance is not available for this district.
            </p>
          </div>
        )}
      </div>

      {/* Blocks */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Health Blocks
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Blocks within {districtName}.
            </p>
          </div>

          <Link
            to="/blocks"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View all
          </Link>
        </div>

        {blocks.length > 0 ? (
          <div className="mt-4 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="grid grid-cols-3 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500">
              <span>Block</span>
              <span>Block ID</span>
              <span className="text-right">Action</span>
            </div>

            {blocks.map((block) => {
              const blockId = getBlockId(block);
              const blockName = getBlockName(block);

              return (
                <div
                  key={blockId}
                  className="grid grid-cols-3 items-center px-5 py-4 border-b border-slate-100 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Building2
                        size={17}
                        className="text-blue-600"
                      />
                    </div>

                    <span className="text-sm font-medium text-blue-600">
                      {blockName}
                    </span>
                  </div>

                  <span className="text-sm text-slate-500">
                    {blockId}
                  </span>

                  <div className="flex justify-end">
                    <Link
                      to={`/blocks/${blockId}`}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                    >
                      View Block
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 bg-white border border-slate-200 rounded-xl p-6">
            <p className="text-sm text-slate-500">
              No blocks were found for this district.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DistrictDetail;