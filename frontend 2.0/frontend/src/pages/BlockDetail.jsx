import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  Baby,
  CalendarDays,
  Building2,
  HeartPulse,
  Syringe,
} from "lucide-react";
import api from "../services/api";
import {
  BackLink,
  ErrorState,
  IndicatorCard,
  KpiCard,
  LoadingState,
  PageHeader,
  ProgressBar,
  ScoreHero,
  SectionHeader,
  StatusBadge,
  Table,
  TableShell,
  Td,
  Th,
  Tr,
  toneForStatus,
} from "../components/ui";

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

  if (loading) {
    return (
      <div>
        <PageHeader title="Block Details" />

        <LoadingState label="Loading block data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Block Details" />

        <ErrorState title="Unable to load block" message={error} />
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
      <PageHeader
        back={
          <BackLink
            onClick={() => navigate(`/districts/${data.district.id}`)}
          >
            Back to District
          </BackLink>
        }
        icon={Building2}
        title={data.block.name}
        description={`${data.district.name} · Block-level health performance.`}
      />

      {/* Health score + headline KPIs */}
      <div className="grid gap-5 lg:grid-cols-3">
        <ScoreHero
          className="lg:col-span-2"
          contextLabel="Block health"
          score={data.health_score}
          status={data.health_status}
          caption="Overall block performance"
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
          <KpiCard
            label="Facilities"
            value={data.facilities.length}
            hint="Health facilities in this block"
            icon={Building2}
            tone="info"
          />

          <KpiCard
            label="Reporting Period"
            value={data.period}
            hint="Latest available data"
            icon={CalendarDays}
            tone="info"
          />
        </div>
      </div>

      {/* Indicators */}
      <section className="mt-10" aria-labelledby="block-indicators">
        <SectionHeader
          id="block-indicators"
          title="Indicator Performance"
          description={`Key health indicators for ${data.block.name}.`}
        />

        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {indicators.map((indicator) => (
            <IndicatorCard
              key={indicator.name}
              name={indicator.name}
              display={`${indicator.value}%`}
              value={indicator.value}
              status={indicator.status}
              icon={indicator.icon}
            />
          ))}
        </div>
      </section>

      {/* Facilities */}
      <section className="mt-10" aria-labelledby="block-facilities">
        <SectionHeader
          id="block-facilities"
          title="Health Facilities"
          description="Select a facility to see its indicator trends."
        />

        <TableShell className="mt-4">
          <Table minWidth="min-w-[34rem]">
            <thead>
              <tr>
                <Th>Facility</Th>
                <Th>Health Score</Th>
                <Th>Status</Th>
              </tr>
            </thead>

            <tbody>
              {data.facilities.map((facility) => (
                <Tr key={facility.facility_id}>
                  <Td>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/facilities/${facility.facility_id}`)
                      }
                      className="rounded text-left font-medium text-brand-700 hover:text-brand-600 hover:underline"
                    >
                      {facility.facility_name}
                    </button>
                  </Td>

                  <Td>
                    <div className="flex items-center gap-3">
                      <span className="num w-14 font-medium text-ink">
                        {facility.health_score}
                      </span>

                      <ProgressBar
                        className="hidden w-28 sm:block"
                        value={facility.health_score}
                        tone={toneForStatus(facility.status)}
                        label={`${facility.facility_name} health score`}
                      />
                    </div>
                  </Td>

                  <Td>
                    <StatusBadge status={facility.status} size="sm" />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableShell>
      </section>
    </div>
  );
};

export default BlockDetail;
