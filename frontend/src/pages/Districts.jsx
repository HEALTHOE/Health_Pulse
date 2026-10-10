import { useEffect, useState } from "react";
import { MapPin, ArrowRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const Districts = () => {
  const navigate = useNavigate();

  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/api/districts");

        const data = response.data;

        // Support the backend returning either an array
        // or an object containing the district list.
        const districtList = Array.isArray(data)
          ? data
          : data?.data || data?.districts || [];

        setDistricts(districtList);
      } catch (err) {
        console.error("Failed to fetch districts:", err);

        const message =
          err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Failed to load districts.";

        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchDistricts();
  }, []);

  const getDistrictId = (district) => {
    return district.id ?? district.district_id;
  };

  const getDistrictName = (district) => {
    return (
      district.name ||
      district.district_name ||
      district.district ||
      `District ${getDistrictId(district)}`
    );
  };

  const handleViewDistrict = (district) => {
    const districtId = getDistrictId(district);

    if (districtId !== undefined && districtId !== null) {
      navigate(`/districts/${districtId}`);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Districts
        </h1>

        <p className="mt-2 text-slate-500">
          District-level health performance and analysis.
        </p>

        <div className="mt-8 bg-white border border-slate-200 rounded-xl p-10 flex items-center justify-center">
          <div className="flex items-center gap-3 text-slate-500">
            <Loader2 size={20} className="animate-spin" />
            Loading districts...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Districts
        </h1>

        <p className="mt-2 text-slate-500">
          District-level health performance and analysis.
        </p>

        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-medium text-red-800">
            Unable to load districts
          </p>

          <p className="mt-1 text-sm text-red-700">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Health Districts
        </h1>

        <p className="mt-2 text-slate-500">
          Select a district to view detailed health performance.
        </p>
      </div>

      {/* District Cards */}
      {districts.length === 0 ? (
        <div className="mt-8 bg-white border border-slate-200 rounded-xl p-10 text-center">
          <MapPin
            size={36}
            className="mx-auto text-slate-400"
          />

          <p className="mt-4 text-sm font-medium text-slate-700">
            No districts available
          </p>

          <p className="mt-1 text-sm text-slate-500">
            No district records were returned by the backend.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {districts.map((district) => {
            const districtId = getDistrictId(district);
            const districtName = getDistrictName(district);

            return (
              <div
                key={districtId}
                className="bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition"
              >
                {/* District Information */}
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <MapPin
                      size={21}
                      className="text-blue-600"
                    />
                  </div>

                  <div>
                    <h2 className="text-base font-semibold text-slate-900">
                      {districtName}
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      District ID: {districtId}
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="my-5 border-t border-slate-100" />

                {/* Location */}
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <MapPin size={15} />
                  <span>Health District</span>
                </div>

                {/* View Button */}
                <button
                  onClick={() => handleViewDistrict(district)}
                  className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
                >
                  View District
                  <ArrowRight size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Districts;