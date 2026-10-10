import { useEffect, useState } from "react";
import { ArrowRight, MapPin, Search } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";

const Blocks = () => {
  const [blocks, setBlocks] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const districtId = searchParams.get("district_id");

  useEffect(() => {
    const fetchBlocks = async () => {
      try {
        const response = await api.get("/api/blocks");

        let data = response.data;

        if (districtId) {
          data = data.filter(
            (block) =>
              String(block.district_id) === String(districtId)
          );
        }

        setBlocks(data);
      } catch (err) {
        setError(
          err.response?.data?.error?.message ||
            "Unable to load blocks."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBlocks();
  }, [districtId]);

  const filteredBlocks = blocks.filter((block) =>
    `${block.name} ${block.code}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Blocks
        </h1>

        <div className="mt-8 bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-500">Loading blocks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Blocks
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
          Blocks
        </h1>

        <p className="mt-2 text-slate-500">
          Explore block-level health performance.
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
          placeholder="Search blocks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <p className="mt-6 text-sm text-slate-500">
        {filteredBlocks.length}{" "}
        {filteredBlocks.length === 1 ? "block" : "blocks"}
      </p>

      {/* Blocks */}
      {filteredBlocks.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlocks.map((block) => (
            <div
              key={block.id}
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
                  {block.code}
                </span>
              </div>

              <h2 className="mt-5 text-lg font-semibold text-slate-900">
                {block.name}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {block.district_name}
              </p>

              <button
                onClick={() =>
                  navigate(`/blocks/${block.id}`)
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
            No blocks found.
          </p>
        </div>
      )}
    </div>
  );
};

export default Blocks;