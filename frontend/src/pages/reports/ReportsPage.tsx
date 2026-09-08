import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Avatar,
  LinearProgress,
  Divider,
} from "@mui/material";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import LeaderboardRoundedIcon from "@mui/icons-material/LeaderboardRounded";
import DonutSmallRoundedIcon from "@mui/icons-material/DonutSmallRounded";
import MapRoundedIcon from "@mui/icons-material/MapRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import DirectionsCarRoundedIcon from "@mui/icons-material/DirectionsCarRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import AutoGraphRoundedIcon from "@mui/icons-material/AutoGraphRounded";
import { apiClient } from "../../api/client";

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => JSON.stringify(row[h] ?? "")).join(","));
  }
  return lines.join("\n");
}

function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  const blob = new Blob([toCsv(rows)], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const REPORTS = [
  { key: "sales-by-agent", label: "Sales by Agent", advanced: false, icon: LeaderboardRoundedIcon },
  { key: "bookings-by-status", label: "Bookings by Status", advanced: false, icon: DonutSmallRoundedIcon },
  { key: "revenue-by-destination", label: "Revenue by Destination", advanced: true, icon: MapRoundedIcon },
  { key: "driver-utilization", label: "Driver Utilization", advanced: true, icon: BadgeRoundedIcon },
  { key: "vehicle-utilization", label: "Vehicle Utilization", advanced: true, icon: DirectionsCarRoundedIcon },
  { key: "agent-performance-trends", label: "Performance Trends", advanced: true, icon: AutoGraphRoundedIcon },
];

export function ReportsPage() {
  const [tab, setTab] = useState(0);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [advancedEntitled, setAdvancedEntitled] = useState(true);

  const report = REPORTS[tab];

  function csvRows(): Record<string, unknown>[] {
    if (report.key === "agent-performance-trends") {
      return rows.flatMap((agent) =>
        agent.months.map((m: any) => ({
          agent: agent.agentName,
          month: m.month,
          wonEnquiries: m.wonEnquiries,
          revenueInPaise: m.revenueInPaise,
        }))
      );
    }
    return rows;
  }

  function load() {
    apiClient
      .get(`/reports/${report.key}`, { params: { from: from || undefined, to: to || undefined } })
      .then(({ data }) => {
        setRows(data.data ?? []);
        setAdvancedEntitled(true);
      })
      .catch((err) => {
        if (err.response?.data?.code === "FEATURE_NOT_ENTITLED") setAdvancedEntitled(false);
        setRows([]);
      });
  }

  useEffect(load, [tab, from, to]);

  return (
    <Box sx={{ p: { xs: 2.5, md: 4.5 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      {/* Top Header */}
      <Box
        display="flex"
        flexDirection={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        gap={2}
        mb={3.5}
      >
        <Box>
          <Typography variant="h4" fontWeight={900} sx={{ color: "#0f172a", letterSpacing: "-0.03em" }}>
            Operational Reports
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Cross-sectional performance audits, team pipeline throughput, and utilization metrics.
          </Typography>
        </Box>

        {/* Date Filter & Export Tools */}
        <Box display="flex" flexWrap="wrap" alignItems="center" gap={1.5} width={{ xs: "100%", sm: "auto" }}>
          <TextField
            size="small"
            label="From"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{
              width: 140,
              "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#ffffff" },
            }}
          />
          <TextField
            size="small"
            label="To"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{
              width: 140,
              "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#ffffff" },
            }}
          />
          <Button
            variant="outlined"
            startIcon={<FileDownloadRoundedIcon fontSize="small" />}
            onClick={() => downloadCsv(`${report.key}.csv`, csvRows())}
            disabled={rows.length === 0}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2,
              borderColor: "#e2e8f0",
              color: "#334155",
              bgcolor: "#ffffff",
              "&:hover": { borderColor: "#cbd5e1", bgcolor: "#f8fafc" },
            }}
          >
            Export CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrintRoundedIcon fontSize="small" />}
            onClick={() => window.print()}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2,
              borderColor: "#e2e8f0",
              color: "#334155",
              bgcolor: "#ffffff",
              "&:hover": { borderColor: "#cbd5e1", bgcolor: "#f8fafc" },
            }}
          >
            Print
          </Button>
        </Box>
      </Box>

      {/* Tabs Row */}
      <Box sx={{ mb: 3, borderBottom: "1px solid #e2e8f0" }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            "& .MuiTabs-indicator": { height: 3, borderRadius: "3px 3px 0 0", bgcolor: "#2563eb" },
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.85rem",
              color: "#64748b",
              minHeight: 48,
              px: 2,
              "&.Mui-selected": { color: "#2563eb" },
            },
          }}
        >
          {REPORTS.map((r) => {
            const TabIcon = r.icon;
            return (
              <Tab
                key={r.key}
                icon={<TabIcon style={{ fontSize: 18 }} />}
                iconPosition="start"
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <span>{r.label}</span>
                    {r.advanced && (
                      <Chip
                        label="BUSINESS+"
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: "0.62rem",
                          fontWeight: 800,
                          bgcolor: "#eff6ff",
                          color: "#2563eb",
                          borderRadius: "4px",
                        }}
                      />
                    )}
                  </Box>
                }
              />
            );
          })}
        </Tabs>
      </Box>

      {/* Main Content Area */}
      {!advancedEntitled ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            borderRadius: 3.5,
            border: "1px solid #e2e8f0",
            bgcolor: "#ffffff",
            textAlign: "center",
          }}
        >
          <Box display="flex" flexDirection="column" alignItems="center" gap={1.5} maxWidth={440} mx="auto">
            <Avatar sx={{ width: 56, height: 56, bgcolor: "#fffbeb", color: "#d97706", mb: 1 }}>
              <LockRoundedIcon fontSize="medium" />
            </Avatar>
            <Typography variant="h6" fontWeight={800} color="#0f172a">
              Tier Lock: Advanced Analytics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This report requires elevated operational access included with Business and Enterprise subscriptions.
              Reach out to your platform administrator to unlock cross-destination & utilization telemetry.
            </Typography>
          </Box>
        </Paper>
      ) : (
        <ReportContent reportKey={report.key} rows={rows} />
      )}
    </Box>
  );
}

function ReportContent({ reportKey, rows }: { reportKey: string; rows: any[] }) {
  if (rows.length === 0) {
    return (
      <Paper elevation={0} sx={{ p: 6, textAlign: "center", borderRadius: 3, border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}>
        <Typography variant="body1" fontWeight={700} color="#0f172a">
          No records captured for this window
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Adjust your date range filters to evaluate historical audit logs.
        </Typography>
      </Paper>
    );
  }

  // 1. Sales By Agent
  if (reportKey === "sales-by-agent") {
    const totalRev = rows.reduce((acc, r) => acc + (r.revenueInPaise || 0), 0);
    const totalWon = rows.reduce((acc, r) => acc + (r.wonEnquiries || 0), 0);

    return (
      <Box display="flex" flexDirection="column" gap={3}>
        {/* KPI Mini Row */}
        <Box display="flex" gap={2} flexWrap="wrap">
          <StatSummaryCard title="Aggregate Sales Revenue" value={`₹${(totalRev / 100).toLocaleString("en-IN")}`} />
          <StatSummaryCard title="Total Deals Won" value={totalWon.toString()} />
        </Box>

        <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0", overflow: "hidden", bgcolor: "#ffffff" }}>
          <Table>
            <TableHead sx={{ bgcolor: "#fafcff" }}>
              <TableRow sx={{ borderBottom: "1px solid #eef2f6" }}>
                <TableCell sx={{ fontWeight: 800, color: "#64748b", py: 2, px: 3 }}>AGENT NAME</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#64748b", py: 2 }}>WON ENQUIRIES</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: "#64748b", py: 2, px: 3 }}>REVENUE PRODUCED</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i} hover sx={{ "&:last-child td": { border: 0 } }}>
                  <TableCell sx={{ py: 2, px: 3 }}>
                    <Typography variant="body2" fontWeight={700} color="#0f172a">
                      {r.agentName}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Chip size="small" label={`${r.wonEnquiries} Deals`} sx={{ fontWeight: 700, bgcolor: "#ecfdf5", color: "#047857" }} />
                  </TableCell>
                  <TableCell align="right" sx={{ py: 2, px: 3 }}>
                    <Typography variant="body2" fontWeight={800} color="#0f172a">
                      ₹{((r.revenueInPaise || 0) / 100).toLocaleString("en-IN")}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Box>
    );
  }

  // 2. Bookings By Status
  if (reportKey === "bookings-by-status") {
    return (
      <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0", overflow: "hidden", bgcolor: "#ffffff" }}>
        <Table>
          <TableHead sx={{ bgcolor: "#fafcff" }}>
            <TableRow sx={{ borderBottom: "1px solid #eef2f6" }}>
              <TableCell sx={{ fontWeight: 800, color: "#64748b", py: 2, px: 3 }}>BOOKING STATUS</TableCell>
              <TableCell sx={{ fontWeight: 800, color: "#64748b", py: 2 }}>VOLUME COUNT</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: "#64748b", py: 2, px: 3 }}>TOTAL AMOUNT</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i} hover sx={{ "&:last-child td": { border: 0 } }}>
                <TableCell sx={{ py: 2, px: 3 }}>
                  <Chip
                    size="small"
                    label={r.status.replace(/_/g, " ")}
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.72rem",
                      bgcolor: "#f1f5f9",
                      color: "#334155",
                      borderRadius: 1.5,
                    }}
                  />
                </TableCell>
                <TableCell sx={{ py: 2 }}>
                  <Typography variant="body2" fontWeight={700} color="#0f172a">
                    {r.count} Bookings
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ py: 2, px: 3 }}>
                  <Typography variant="body2" fontWeight={800} color="#0f172a">
                    ₹{((r.totalAmountInPaise || 0) / 100).toLocaleString("en-IN")}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    );
  }

  // 3. Revenue By Destination
  if (reportKey === "revenue-by-destination") {
    const chartData = rows.slice(0, 8).map((r) => ({
      destination: r.destination,
      revenue: (r.revenueInPaise || 0) / 100,
    }));

    return (
      <Box display="flex" flexDirection="column" gap={3}>
        {/* Visual Bar Chart for Top Destinations */}
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}>
          <Typography variant="subtitle1" fontWeight={800} color="#0f172a" mb={0.5}>
            Top Destination Revenues
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" mb={2}>
            Geographic route earnings distribution
          </Typography>
          <Box sx={{ width: "100%", height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="destination" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(val: any) => `₹${val.toLocaleString("en-IN")}`}
                  contentStyle={{ backgroundColor: "#0f172a", color: "#fff", borderRadius: 8, border: "none", fontSize: 12 }}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0", overflow: "hidden", bgcolor: "#ffffff" }}>
          <Table>
            <TableHead sx={{ bgcolor: "#fafcff" }}>
              <TableRow sx={{ borderBottom: "1px solid #eef2f6" }}>
                <TableCell sx={{ fontWeight: 800, color: "#64748b", py: 2, px: 3 }}>DESTINATION</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: "#64748b", py: 2, px: 3 }}>GENERATED REVENUE</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i} hover sx={{ "&:last-child td": { border: 0 } }}>
                  <TableCell sx={{ py: 2, px: 3 }}>
                    <Typography variant="body2" fontWeight={700} color="#0f172a">
                      {r.destination}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 2, px: 3 }}>
                    <Typography variant="body2" fontWeight={800} color="#0f172a">
                      ₹{((r.revenueInPaise || 0) / 100).toLocaleString("en-IN")}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Box>
    );
  }

  // 4. Driver Utilization
  if (reportKey === "driver-utilization") {
    return (
      <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0", overflow: "hidden", bgcolor: "#ffffff" }}>
        <Table>
          <TableHead sx={{ bgcolor: "#fafcff" }}>
            <TableRow sx={{ borderBottom: "1px solid #eef2f6" }}>
              <TableCell sx={{ fontWeight: 800, color: "#64748b", py: 2, px: 3 }}>DRIVER PROFILE</TableCell>
              <TableCell sx={{ fontWeight: 800, color: "#64748b", py: 2 }}>ASSIGNED TRIPS</TableCell>
              <TableCell sx={{ fontWeight: 800, color: "#64748b", py: 2, px: 3, minWidth: 200 }}>UTILIZATION RATE</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i} hover sx={{ "&:last-child td": { border: 0 } }}>
                <TableCell sx={{ py: 2, px: 3 }}>
                  <Typography variant="body2" fontWeight={700} color="#0f172a">
                    {r.driverName}
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 2 }}>
                  <Typography variant="body2" fontWeight={600} color="#475569">
                    {r.tripCount} Trips
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 2, px: 3 }}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Box flexGrow={1}>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(r.utilizationPercent || 0, 100)}
                        sx={{
                          height: 7,
                          borderRadius: 4,
                          bgcolor: "#f1f5f9",
                          "& .MuiLinearProgress-bar": {
                            bgcolor: r.utilizationPercent > 80 ? "#16a34a" : r.utilizationPercent > 40 ? "#2563eb" : "#f59e0b",
                            borderRadius: 4,
                          },
                        }}
                      />
                    </Box>
                    <Typography variant="caption" fontWeight={800} color="#0f172a" sx={{ minWidth: 38 }}>
                      {r.utilizationPercent}%
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    );
  }

  // 5. Vehicle Utilization
  if (reportKey === "vehicle-utilization") {
    return (
      <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0", overflow: "hidden", bgcolor: "#ffffff" }}>
        <Table>
          <TableHead sx={{ bgcolor: "#fafcff" }}>
            <TableRow sx={{ borderBottom: "1px solid #eef2f6" }}>
              <TableCell sx={{ fontWeight: 800, color: "#64748b", py: 2, px: 3 }}>VEHICLE REGISTRATION</TableCell>
              <TableCell sx={{ fontWeight: 800, color: "#64748b", py: 2 }}>TOTAL TRIPS</TableCell>
              <TableCell sx={{ fontWeight: 800, color: "#64748b", py: 2, px: 3, minWidth: 200 }}>UTILIZATION RATE</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i} hover sx={{ "&:last-child td": { border: 0 } }}>
                <TableCell sx={{ py: 2, px: 3 }}>
                  <Typography variant="body2" fontWeight={800} fontFamily="monospace" color="#0f172a">
                    {r.registrationNumber}
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 2 }}>
                  <Typography variant="body2" fontWeight={600} color="#475569">
                    {r.tripCount} Trips
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 2, px: 3 }}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Box flexGrow={1}>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(r.utilizationPercent || 0, 100)}
                        sx={{
                          height: 7,
                          borderRadius: 4,
                          bgcolor: "#f1f5f9",
                          "& .MuiLinearProgress-bar": {
                            bgcolor: r.utilizationPercent > 80 ? "#16a34a" : r.utilizationPercent > 40 ? "#2563eb" : "#f59e0b",
                            borderRadius: 4,
                          },
                        }}
                      />
                    </Box>
                    <Typography variant="caption" fontWeight={800} color="#0f172a" sx={{ minWidth: 38 }}>
                      {r.utilizationPercent}%
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    );
  }

  // 6. Agent Performance Trends
  if (reportKey === "agent-performance-trends") {
    return (
      <Box display="flex" flexDirection="column" gap={2.5}>
        {rows.map((agent) => (
          <Paper key={agent.agentId} elevation={0} sx={{ borderRadius: 3, border: "1px solid #e2e8f0", overflow: "hidden", bgcolor: "#ffffff" }}>
            <Box sx={{ px: 3, py: 2, bgcolor: "#fafcff", borderBottom: "1px solid #eef2f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="subtitle1" fontWeight={800} color="#0f172a">
                {agent.agentName}
              </Typography>
              <Chip label="Monthly Timeline" size="small" sx={{ fontWeight: 700, fontSize: "0.68rem", bgcolor: "#f1f5f9" }} />
            </Box>

            <Table size="small">
              <TableHead sx={{ bgcolor: "#ffffff" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, color: "#64748b", py: 1.5, px: 3 }}>MONTH</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#64748b", py: 1.5 }}>WON ENQUIRIES</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: "#64748b", py: 1.5, px: 3 }}>REVENUE GENERATED</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {agent.months.map((m: any) => (
                  <TableRow key={m.month} hover sx={{ "&:last-child td": { border: 0 } }}>
                    <TableCell sx={{ py: 1.5, px: 3 }}>
                      <Typography variant="body2" fontWeight={600} color="#334155">
                        {m.month}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Typography variant="body2" fontWeight={700} color="#059669">
                        {m.wonEnquiries} Leads
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.5, px: 3 }}>
                      <Typography variant="body2" fontWeight={800} color="#0f172a">
                        ₹{((m.revenueInPaise || 0) / 100).toLocaleString("en-IN")}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        ))}
      </Box>
    );
  }

  return null;
}

function StatSummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <Paper
      elevation={0}
      sx={{
        px: 3,
        py: 2,
        borderRadius: 2.5,
        border: "1px solid #e2e8f0",
        bgcolor: "#ffffff",
        minWidth: 200,
      }}
    >
      <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase">
        {title}
      </Typography>
      <Typography variant="h6" fontWeight={900} color="#0f172a">
        {value}
      </Typography>
    </Paper>
  );
}