import { useEffect, useState } from "react";
import { Building2, MapPin, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  Button,
  EmptyState,
  ErrorState,
  IconTile,
  LoadingState,
  PageHeader,
  SectionHeader,
  StatStrip,
  Table,
  TableShell,
  Td,
  Th,
  Tr,
} from "../components/ui";

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
        <PageHeader
          title="Blocks"
          description="View and analyze health performance at block level."
        />

        <LoadingState label="Loading blocks..." />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader
          title="Blocks"
          description="View and analyze health performance at block level."
        />

        <ErrorState
          title="Unable to load blocks"
          message={error}
          onRetry={fetchBlocks}
        />
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <PageHeader
        title="Blocks"
        description="View and analyze health performance at block level."
      />

      {/* Summary */}
      <StatStrip
        columns="lg:grid-cols-2"
        items={[
          {
            label: "Total Blocks",
            value: blocks.length,
            icon: Building2,
            tone: "info",
          },
          {
            label: "District Coverage",
            value: new Set(blocks.map((block) => block.district_id)).size,
            icon: MapPin,
            tone: "info",
          },
        ]}
      />

      {/* Blocks */}
      <section className="mt-10" aria-labelledby="blocks-list">
        <SectionHeader
          id="blocks-list"
          title="Health Blocks"
          description="Select a block to view detailed performance."
        />

        {blocks.length === 0 ? (
          <EmptyState
            className="mt-4"
            icon={Building2}
            title="No blocks available"
            description="No blocks are currently available."
          />
        ) : (
          <TableShell className="mt-4">
            <Table minWidth="min-w-[36rem]">
              <thead>
                <tr>
                  <Th>Block</Th>
                  <Th>Block ID</Th>
                  <Th>District</Th>
                  <Th align="right">Action</Th>
                </tr>
              </thead>

              <tbody>
                {blocks.map((block) => (
                  <Tr key={block.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <IconTile icon={Building2} tone="info" size="sm" />

                        <span className="font-medium text-ink">
                          {block.name}
                        </span>
                      </div>
                    </Td>

                    <Td className="num text-ink-3">{block.id}</Td>

                    <Td>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin
                          size={14}
                          aria-hidden="true"
                          className="text-ink-4"
                        />
                        {block.district_name || "District"}
                      </span>
                    </Td>

                    <Td align="right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/blocks/${block.id}`)}
                        aria-label={`View block ${block.name}`}
                      >
                        View Block
                        <ArrowRight size={15} aria-hidden="true" />
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableShell>
        )}
      </section>
    </div>
  );
};

export default Blocks;
