import { useEffect, useState } from "react";
import { ArrowLeft, Building2, MapPin } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

const FacilityDetail = () => {
  const { facilityId } = useParams();
  const navigate = useNavigate();

  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFacility = async () => {
      try {
        const response = await api.get(
          `/api/facilities/${facilityId}`
        );

        setFacility(response.data);
      } catch (err) {
        setError(
          err.response?.data?.error?.message ||
            "Unable to load facility details."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchFacility();
  }, [facilityId]);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Facility Details
        </h1>

        <div className="mt-8 bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-500">
            Loading facility data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Facility Details
        </h1>

        <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-5">
          <p className="text-red-700 font-medium">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <button
        onClick={() =>
          navigate(`/blocks/${facility.block_id}`)
        }
        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mb-5"
      >
        <ArrowLeft size={16} />
        Back to Block
      </button>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {facility.name}
        </h1>

        <p className="mt-2 text-slate-500">
          Facility information and location details.
        </p>
      </div>

      {/* Facility Overview */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Building2
                size={22}
                className="text-blue-600"
              />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Facility
              </p>

              <p className="text-lg font-semibold text-slate-900">
                {facility.name}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <p className="text-xs text-slate-500">
                Facility Type
              </p>

              <p className="mt-1 text-sm font-medium text-slate-800">
                {facility.facility_type}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Facility ID
              </p>

              <p className="mt-1 text-sm font-medium text-slate-800">
                {facility.id}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <MapPin
                size={22}
                className="text-blue-600"
              />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Location
              </p>

              <p className="text-lg font-semibold text-slate-900">
                {facility.district_name}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <p className="text-xs text-slate-500">
                District
              </p>

              <p className="mt-1 text-sm font-medium text-slate-800">
                {facility.district_name}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Block
              </p>

              <p className="mt-1 text-sm font-medium text-slate-800">
                {facility.block_name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Notice */}
      <div className="mt-8 bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Facility Analytics
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Facility-level health analytics are not currently
          provided by the facility detail endpoint.
        </p>
      </div>
    </div>
  );
};

export default FacilityDetail;