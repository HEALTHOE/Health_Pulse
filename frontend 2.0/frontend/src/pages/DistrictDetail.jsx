import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarDays,
  MapPin,
} from "lucide-react";
import api from "../services/api";
import {
  BackLink,
  Card,
  EmptyState,
  ErrorState,
  IconTile,
  IndicatorCard,
  KpiCard,
  LoadingState,
  PageHeader,
  ScoreHero,
  SectionHeader,
  Table,
  TableShell,
  Td,
  Th,
  Tr,
  buttonClasses,
} from "../components/ui";

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

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <BackLink onClick={() => navigate("/districts")}>
            Back to Districts
          </BackLink>
        </div>

        <LoadingState label="Loading district information..." />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <BackLink onClick={() => navigate("/districts")}>
          Back to Districts
        </BackLink>

        <ErrorState
          className="mt-6"
          title="Unable to load district"
          message={error}
        />
      </div>
    );
  }

  const districtName = getDistrictName();
  const healthScore = getHealthScore();
  const healthStatus = getHealthStatus();
  const reportingPeriod = getReportingPeriod();
  const criticalAlerts = getCriticalAlerts();
  const indicators = getIndicators();

  const hasCriticalAlerts = Number(criticalAlerts) > 0;

  return (
    <div>
      <PageHeader
        back={
          <BackLink onClick={() => navigate("/districts")}>
            Back to Districts
          </BackLink>
        }
        icon={MapPin}
        title={districtName}
        description="District-level health performance and analysis."
      />

      {/* Health score + headline KPIs */}
      <div className="grid gap-5 lg:grid-cols-3">
        <ScoreHero
          className="lg:col-span-2"
          contextLabel="District health"
          score={healthScore !== null ? Number(healthScore).toFixed(2) : "—"}
          scoreValue={healthScore}
          status={healthStatus}
          statusFallbackTone="ok"
          caption="Overall district performance"
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
          <KpiCard
            label="Critical Alerts"
            value={criticalAlerts}
            hint="Issues requiring immediate attention"
            icon={AlertTriangle}
            tone={hasCriticalAlerts ? "crit" : "neutral"}
            valueClassName={hasCriticalAlerts ? "text-crit-700" : "text-ink"}
          />

          <KpiCard
            label="Reporting Period"
            value={reportingPeriod}
            hint="Latest available data"
            icon={CalendarDays}
            tone="info"
          />
        </div>
      </div>

      {/* Indicator Performance */}
      <section className="mt-10" aria-labelledby="district-indicators">
        <SectionHeader
          id="district-indicators"
          title="Indicator Performance"
          description={`Key health indicators for ${districtName}.`}
          action={
            <Link
              to="/indicators"
              className={buttonClasses({ variant: "ghost", size: "sm" })}
            >
              View all
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          }
        />

        {indicators.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {indicators.slice(0, 4).map((indicator) => {
              const value = indicator.value;
              const status = indicator.status;

              return (
                <IndicatorCard
                  key={indicator.id}
                  name={indicator.name}
                  display={
                    value !== null && value !== undefined
                      ? `${Number(value).toFixed(2)}%`
                      : "—"
                  }
                  value={value}
                  status={status}
                  statusFallbackTone="ok"
                />
              );
            })}
          </div>
        ) : (
          <Card className="mt-4 p-6">
            <p className="text-sm text-ink-3">
              Indicator performance is not available for this district.
            </p>
          </Card>
        )}
      </section>

      {/* Blocks */}
      <section className="mt-10" aria-labelledby="district-blocks">
        <SectionHeader
          id="district-blocks"
          title="Health Blocks"
          description={`Blocks within ${districtName}.`}
          action={
            <Link
              to="/blocks"
              className={buttonClasses({ variant: "ghost", size: "sm" })}
            >
              View all
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          }
        />

        {blocks.length > 0 ? (
          <TableShell className="mt-4">
            <Table minWidth="min-w-[28rem]">
              <thead>
                <tr>
                  <Th>Block</Th>
                  <Th>Block ID</Th>
                  <Th align="right">Action</Th>
                </tr>
              </thead>

              <tbody>
                {blocks.map((block) => {
                  const blockId = getBlockId(block);
                  const blockName = getBlockName(block);

                  return (
                    <Tr key={blockId}>
                      <Td>
                        <div className="flex items-center gap-3">
                          <IconTile icon={Building2} tone="info" size="sm" />

                          <Link
                            to={`/blocks/${blockId}`}
                            className="font-medium text-ink hover:text-brand-700 hover:underline"
                          >
                            {blockName}
                          </Link>
                        </div>
                      </Td>

                      <Td className="num text-ink-3">{blockId}</Td>

                      <Td align="right">
                        <Link
                          to={`/blocks/${blockId}`}
                          aria-label={`View block ${blockName}`}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-600"
                        >
                          View Block
                          <ArrowRight size={15} aria-hidden="true" />
                        </Link>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </TableShell>
        ) : (
          <EmptyState
            className="mt-4"
            icon={Building2}
            title="No blocks found"
            description="No blocks were found for this district."
          />
        )}
      </section>
    </div>
  );
};

export default DistrictDetail;
