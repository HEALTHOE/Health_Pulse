import { useEffect, useState } from "react";
import { MapPin, Search, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const Districts = () => {
  const [districts, setDistricts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const response = await api.get("/api/districts");
        setDistricts(response.data);
      } catch (err) {
        setError(
          err.response?.data?.error?.message ||
            "Unable to load districts."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDistricts();
  }, []);

  const filteredDistricts = districts.filter((district) =>
    `${district.name} ${district.code}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Districts
        </h1>

        <p className="mt-2 text-slate-500">
          Explore district-level health performance.
        </p>

        <div className="mt-8 bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-500">Loading districts...</p>
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

        <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-5">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Districts
        </h1>

        <p className="mt-2 text-slate-500">
          Explore district-level health performance.
        </p>
      </div>

      {/* Search */}
      <div className="mt-6 relative max-w-md">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type="text"
          placeholder="Search districts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* District count */}
      <div className="mt-6">
        <p className="text-sm text-slate-500">
          {filteredDistricts.length}{" "}
          {filteredDistricts.length === 1
            ? "district"
            : "districts"}
        </p>
      </div>

      {/* District Cards */}
      {filteredDistricts.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDistricts.map((district) => (
            <div
              key={district.id}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:border-blue-300 hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between">
                <div className="p-2.5 bg-blue-50 rounded-lg">
                  <MapPin
                    size={20}
                    className="text-blue-600"
                  />
                </div>

                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">
                  {district.code}
                </span>
              </div>

              <h2 className="mt-5 text-lg font-semibold text-slate-900">
                {district.name}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                District ID: {district.id}
              </p>

              <button
                onClick={() =>
                  navigate(`/districts/${district.id}`)
                }
                className="mt-6 flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                View Details
                <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 bg-white rounded-xl border border-slate-200 p-10 text-center">
          <p className="text-slate-500">
            No districts found.
          </p>
        </div>
      )}
    </div>
  );
};

export default Districts;