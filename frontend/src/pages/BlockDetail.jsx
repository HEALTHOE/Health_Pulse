import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  Baby,
  Calendar,
  CheckCircle,
  HeartPulse,
  Syringe,
} from "lucide-react";
import api from "../services/api";

const BlockDetail = () => {
  const { blockId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBlockData = async () => {
      try {
        const response = await api.get(
          `/api/dashboard/block/${blockId}`
        );

        setData(response.data);
      } catch (err) {
        setError(
          err.response?.data?.error?.message ||
            "Unable to load block data."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBlockData();
  }, [blockId]);

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

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Block Details
        </h1>

        <div className="mt-8 bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-500">
            Loading block data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Block Details
        </h1>

        <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-5">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  const indicators = [
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

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <button
            onClick={() =>
              navigate(
                `/districts/${data.district.id}`
              )
            }
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft size={16} />
            Back to District
          </button>

          <h1 className="text-2xl font-bold text-slate-900">
            {data.block.name}
          </h1>

          <p className="mt-2 text-slate-500">
            {data.district.name} · Block-level health performance.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Calendar size={17} />
          <span>{data.period}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-sm text-slate-500">
            Health Score
          </p>

          <p className="text-3xl font-bold mt-3 text-slate-900">
            {data.health_score}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            Overall block performance
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-sm text-slate-500">
            Health Status
          </p>

          <span
            className={`inline-block mt-3 px-3 py-1 rounded-full text-sm font-semibold ${getStatusClass(
              data.health_status
            )}`}
          >
            {data.health_status}
          </span>

          <p className="text-xs text-slate-500 mt-2">
            Current block status
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-sm text-slate-500">
            Facilities
          </p>

          <p className="text-3xl font-bold mt-3 text-slate-900">
            {data.facilities.length}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            Health facilities in this block
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-sm text-slate-500">
            Reporting Period
          </p>

          <p className="text-2xl font-bold mt-3 text-slate-900">
            {data.period}
          </p>

          <p className="text-xs text-slate-500 mt-1">
            Latest available data
          </p>
        </div>
      </div>

      {/* Indicators */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">
          Indicator Performance
        </h2>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {indicators.map((indicator) => {
            const Icon = indicator.icon;

            return (
              <div
                key={indicator.name}
                className="bg-white rounded-xl border border-slate-200 p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Icon
                      size={19}
                      className="text-blue-600"
                    />
                  </div>

                  <p className="text-sm font-medium text-slate-700">
                    {indicator.name}
                  </p>
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

      {/* Facilities */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">
          Health Facilities
        </h2>

        <div className="mt-4 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-4 font-semibold text-slate-600">
                    Facility
                  </th>

                  <th className="text-left px-6 py-4 font-semibold text-slate-600">
                    Health Score
                  </th>

                  <th className="text-left px-6 py-4 font-semibold text-slate-600">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {data.facilities.map((facility) => (
                  <tr
                    key={facility.facility_id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-6 py-4">
  <button
    onClick={() =>
      navigate(`/facilities/${facility.facility_id}`)
    }
    className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
  >
    {facility.facility_name}
  </button>
</td>

                    <td className="px-6 py-4 text-slate-700">
                      {facility.health_score}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusClass(
                          facility.status
                        )}`}
                      >
                        {facility.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockDetail;