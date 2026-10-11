import { useEffect, useState } from "react";
import { MapPin, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconTile,
  LoadingState,
  PageHeader,
} from "../components/ui";

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
        <PageHeader
          title="Districts"
          description="District-level health performance and analysis."
        />

        <LoadingState label="Loading districts..." />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader
          title="Districts"
          description="District-level health performance and analysis."
        />

        <ErrorState title="Unable to load districts" message={error} />
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <PageHeader
        title="Health Districts"
        description="Select a district to view detailed health performance."
        meta={
          districts.length > 0 && (
            <span className="rounded-full border border-line bg-surface px-3 py-1 text-sm text-ink-2 shadow-card">
              <span className="num font-semibold text-ink">{districts.length}</span>{" "}
              {districts.length === 1 ? "district" : "districts"}
            </span>
          )
        }
      />

      {/* District Cards */}
      {districts.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No districts available"
          description="No district records were returned by the backend."
        />
      ) : (
        <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {districts.map((district) => {
            const districtId = getDistrictId(district);
            const districtName = getDistrictName(district);

            return (
              <li key={districtId}>
                <Card
                  as="article"
                  className="flex h-full flex-col p-5 transition duration-150 hover:border-brand-500 hover:shadow-raised"
                >
                  {/* District Information */}
                  <div className="flex items-start gap-3.5">
                    <IconTile icon={MapPin} tone="info" size="lg" />

                    <div className="min-w-0">
                      <h2 className="text-base font-semibold text-ink">
                        {districtName}
                      </h2>

                      <p className="mt-0.5 text-sm text-ink-3">
                        Health District
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
                    <p className="text-xs text-ink-3">
                      District ID{" "}
                      <span className="num font-medium text-ink-2">
                        {districtId}
                      </span>
                    </p>

                    {/* View Button */}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleViewDistrict(district)}
                      aria-label={`View district ${districtName}`}
                    >
                      View District
                      <ArrowRight size={15} aria-hidden="true" />
                    </Button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Districts;
