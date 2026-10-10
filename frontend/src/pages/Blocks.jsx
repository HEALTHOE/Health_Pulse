import { useEffect, useState } from "react";
import { Building2, MapPin, ArrowRight, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const Blocks = () => {
  const navigate = useNavigate();

  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchBlocks = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/api/blocks");

      setBlocks(response.data || []);
    } catch (err) {
      setError(
        err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          "Unable to load blocks."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks();
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Blocks
        </h1>

        <p className="mt-2 text-slate-500">
          View and analyze health performance at block level.
        </p>

        <div className="mt-8 bg-white border border-slate-200 rounded-xl p-10 text-center">
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

        <p className="mt-2 text-slate-500">
          View and analyze health performance at block level.
        </p>

        <div className="mt-8 bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="font-medium text-red-700">{error}</p>

          <button
            onClick={fetchBlocks}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Blocks
        </h1>

        <p className="mt-2 text-slate-500">
          View and analyze health performance at block level.
        </p>
      </div>

      {/* Summary */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <MapPin className="text-blue-600" size={20} />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Total Blocks
              </p>

              <p className="text-3xl font-bold text-slate-900 mt-1">
                {blocks.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <Building2 className="text-green-600" size={20} />
            </div>

            <div>
              <p className="text-sm text-slate-500">
                District Coverage
              </p>

              <p className="text-3xl font-bold text-slate-900 mt-1">
                {new Set(blocks.map((block) => block.district_id)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Blocks */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Health Blocks
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Select a block to view detailed performance.
            </p>
          </div>
        </div>

        {blocks.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
            <p className="text-slate-500">
              No blocks are currently available.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {blocks.map((block) => (
              <div
                key={block.id}
                className="bg-white border border-slate-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-sm transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Building2
                        size={21}
                        className="text-blue-600"
                      />
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {block.name}
                      </h3>

                      <p className="text-xs text-slate-500 mt-1">
                        Block ID: {block.id}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <MapPin size={16} />

                    <span>
                      {block.district_name || "District"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/blocks/${block.id}`)}
                  className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
                >
                  View Block
                  <ArrowRight size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Blocks;