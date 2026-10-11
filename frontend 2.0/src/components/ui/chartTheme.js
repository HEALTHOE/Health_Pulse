// Shared Recharts styling. Colours/typography only – data, domains and
// formatters stay in the pages that own them.
export const CHART = {
  grid: "#e6ebf3",
  axisLine: "#cbd4e1",
  tick: "#5a697e",
  line: "#1d5fb0",
  target: "#52627a",
  fontSize: 12,
};

export const xAxisStyle = {
  tick: { fontSize: CHART.fontSize, fill: CHART.tick },
  tickLine: false,
  axisLine: { stroke: CHART.axisLine },
  tickMargin: 10,
};

export const yAxisStyle = {
  tick: { fontSize: CHART.fontSize, fill: CHART.tick },
  tickLine: false,
  axisLine: false,
  tickMargin: 8,
  width: 52,
};

export const gridStyle = {
  stroke: CHART.grid,
  strokeDasharray: "3 4",
  vertical: false,
};

export const tooltipStyle = {
  contentStyle: {
    borderRadius: 8,
    border: "1px solid #e3e8f0",
    boxShadow: "0 8px 24px -8px rgba(15, 28, 46, 0.25)",
    padding: "8px 12px",
    fontSize: 12.5,
  },
  labelStyle: { color: "#5a697e", fontWeight: 500, marginBottom: 2 },
  itemStyle: { color: "#0f1c2e", padding: 0 },
  cursor: { stroke: "#cbd4e1", strokeDasharray: "4 4" },
};

export const lineStyle = {
  type: "monotone",
  stroke: CHART.line,
  strokeWidth: 2.5,
  dot: { r: 3.5, fill: "#ffffff", stroke: CHART.line, strokeWidth: 2 },
  activeDot: { r: 6, fill: CHART.line, stroke: "#ffffff", strokeWidth: 2 },
};

export const targetLineStyle = {
  stroke: CHART.target,
  strokeDasharray: "6 4",
  strokeWidth: 1.5,
};

export const targetLabel = (value, position = "insideTopRight") => ({
  value,
  position,
  fontSize: 11.5,
  fontWeight: 500,
  fill: CHART.target,
});
