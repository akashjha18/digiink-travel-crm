import { useEffect, useState, useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Link,
  TextField,
  InputAdornment,
  Avatar,
  Divider,
  Button,
  IconButton,
  Tooltip as MuiTooltip,
} from "@mui/material";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import DirectionsCarRoundedIcon from "@mui/icons-material/DirectionsCarRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import RouteRoundedIcon from "@mui/icons-material/RouteRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import { apiClient } from "../../api/client";

const STAGE_CONFIG: Record<
  string,
  { label: string; bg: string; color: string; dot: string }
> = {
  NEW: { label: "New Lead", bg: "#eff6ff", color: "#1d4ed8", dot: "#3b82f6" },
  CONTACTED: { label: "Contacted", bg: "#fefce8", color: "#854d0e", dot: "#eab308" },
  QUOTED: { label: "Quoted", bg: "#f5f3ff", color: "#6d28d9", dot: "#8b5cf6" },
  NEGOTIATION: { label: "Negotiation", bg: "#fff7ed", color: "#9a3412", dot: "#f97316" },
  WON: { label: "Won", bg: "#f0fdf4", color: "#15803d", dot: "#22c55e" },
  LOST: { label: "Lost", bg: "#fef2f2", color: "#b91c1c", dot: "#ef4444" },
};

const STAT_THEMES = [
  {
    key: "totalEnquiries",
    title: "Total Inquiries",
    icon: TrendingUpRoundedIcon,
    color: "#2563eb",
    bg: "#eff6ff",
  },
  {
    key: "newEnquiries",
    title: "New This Month",
    icon: AutoAwesomeRoundedIcon,
    color: "#0891b2",
    bg: "#ecfeff",
  },
  {
    key: "activeBookings",
    title: "Active Bookings",
    icon: DirectionsCarRoundedIcon,
    color: "#16a34a",
    bg: "#f0fdf4",
  },
  {
    key: "totalBookingRevenueInPaise",
    title: "Booking Revenue",
    icon: AccountBalanceWalletRoundedIcon,
    color: "#4f46e5",
    bg: "#eef2ff",
    isCurrency: true,
  },
  {
    key: "outstandingPaymentsInPaise",
    title: "Pending Receivables",
    icon: PendingActionsRoundedIcon,
    color: "#d97706",
    bg: "#fffbeb",
    isCurrency: true,
  },
];

export function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  function loadData() {
    setLoading(true);
    Promise.all([
      apiClient.get("/client/dashboard").catch(() => ({ data: { data: null } })),
      apiClient.get("/enquiries").catch(() => ({ data: { data: [] } })),
    ])
      .then(([mRes, eRes]) => {
        setMetrics(mRes.data?.data ?? null);
        setEnquiries((eRes.data?.data ?? []).slice(0, 6));
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  const cards = useMemo(() => {
    return STAT_THEMES.map((theme) => {
      const rawVal = metrics?.[theme.key];
      let display = rawVal;
      if (rawVal === undefined || rawVal === null) {
        display = "0";
      } else if (theme.isCurrency) {
        display = `₹${(Number(rawVal) / 100).toLocaleString("en-IN")}`;
      }
      return {
        ...theme,
        value: display,
      };
    });
  }, [metrics]);

  const pipelineChartData = useMemo(() => {
    const stages = ["NEW", "CONTACTED", "QUOTED", "NEGOTIATION", "WON", "LOST"];
    const counts: Record<string, number> = {};
    stages.forEach((s) => (counts[s] = 0));

    enquiries.forEach((e) => {
      const st = (e.status ?? "NEW").toUpperCase();
      if (counts[st] !== undefined) counts[st] += 1;
      else counts.NEW += 1;
    });

    return stages.map((st) => ({
      stage: STAGE_CONFIG[st]?.label ?? st,
      count: counts[st],
      fill: STAGE_CONFIG[st]?.dot ?? "#3b82f6",
    }));
  }, [enquiries]);

  const revenueDonutData = useMemo(() => {
    const rev = (metrics?.totalBookingRevenueInPaise ?? 0) / 100;
    const out = (metrics?.outstandingPaymentsInPaise ?? 0) / 100;

    if (rev === 0 && out === 0) {
      return [{ name: "No Revenue Data", value: 1, color: "#e2e8f0" }];
    }

    return [
      { name: "Collected Revenue", value: Math.max(rev - out, 0), color: "#4f46e5" },
      { name: "Outstanding Due", value: out, color: "#f59e0b" },
    ].filter((item) => item.value > 0);
  }, [metrics]);

  const filteredEnquiries = useMemo(() => {
    if (!search.trim()) return enquiries;
    return enquiries.filter((e) => {
      const haystack = `${e.customer?.name ?? ""} ${e.customer?.phone ?? ""} ${e.source ?? ""} ${e.destination ?? ""}`.toLowerCase();
      return haystack.includes(search.toLowerCase());
    });
  }, [enquiries, search]);

  return (
    <Box sx={{ p: { xs: 2.5, md: 4.5 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      {/* Top Header */}
      <Box
        display="flex"
        flexDirection={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        gap={2}
        mb={4}
      >
        <Box>
          <Typography variant="h4" fontWeight={900} sx={{ color: "#0f172a", letterSpacing: "-0.03em" }}>
            Client Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Live operational intelligence, booking conversion health & cash flows.
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={1.5}>
          <Chip
            icon={<CalendarTodayRoundedIcon style={{ fontSize: 15, color: "#64748b" }} />}
            label={new Date().toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
            sx={{
              bgcolor: "#ffffff",
              border: "1px solid #e2e8f0",
              fontWeight: 700,
              fontSize: "0.8rem",
              color: "#475569",
              py: 0.5,
              borderRadius: 2,
            }}
          />

          <MuiTooltip title="Reload Dashboard">
            <span>
              <IconButton
                onClick={loadData}
                disabled={loading}
                sx={{
                  bgcolor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 2,
                  "&:hover": { bgcolor: "#f1f5f9" },
                }}
              >
                <RefreshRoundedIcon fontSize="small" sx={{ color: "#475569" }} />
              </IconButton>
            </span>
          </MuiTooltip>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2.5} mb={4}>
        {cards.map((card) => {
          const IconComponent = card.icon;
          return (
            <Grid item xs={12} sm={6} md={12 / 5} key={card.title}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.75,
                  borderRadius: 3.5,
                  border: "1px solid #e2e8f0",
                  bgcolor: "#ffffff",
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.25s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 12px 28px -6px rgba(15, 23, 42, 0.08)",
                  },
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Avatar
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: 2.5,
                      bgcolor: card.bg,
                      color: card.color,
                    }}
                  >
                    <IconComponent fontSize="small" />
                  </Avatar>
                  <TrendingUpRoundedIcon sx={{ color: "#cbd5e1", fontSize: 20 }} />
                </Box>

                <Typography variant="h5" fontWeight={900} sx={{ color: "#0f172a", mb: 0.5, letterSpacing: "-0.02em" }}>
                  {card.value}
                </Typography>
                <Typography variant="caption" fontWeight={700} color="#64748b" textTransform="uppercase" letterSpacing="0.04em">
                  {card.title}
                </Typography>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* Analytics Graphs Row */}
      <Grid container spacing={3} mb={4}>
        {/* Enquiry Funnel / Stage Distribution */}
        <Grid item xs={12} md={7} lg={8}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3.5,
              border: "1px solid #e2e8f0",
              bgcolor: "#ffffff",
              height: "100%",
            }}
          >
            <Box mb={2}>
              <Typography variant="h6" fontWeight={800} sx={{ color: "#0f172a" }}>
                Inquiry Conversion Pipeline
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Distribution of recent leads across conversion milestones
              </Typography>
            </Box>

            <Box sx={{ width: "100%", height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="stage" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      color: "#fff",
                      borderRadius: 8,
                      border: "none",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Revenue Health Breakdown */}
        <Grid item xs={12} md={5} lg={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3.5,
              border: "1px solid #e2e8f0",
              bgcolor: "#ffffff",
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box mb={1}>
              <Typography variant="h6" fontWeight={800} sx={{ color: "#0f172a" }}>
                Financial Realization
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Realized collections vs pending balance
              </Typography>
            </Box>

            <Box sx={{ width: "100%", height: 260, flexGrow: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueDonutData}
                    innerRadius={58}
                    outerRadius={82}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {revenueDonutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) =>
                      typeof val === "number" ? `₹${val.toLocaleString("en-IN")}` : val
                    }
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      color: "#fff",
                      borderRadius: 8,
                      border: "none",
                      fontSize: 12,
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Main Content Row: Enquiries Table & Activity Stream */}
      <Grid container spacing={3}>
        {/* Recent Enquiries List */}
        <Grid item xs={12} lg={8}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3.5,
              border: "1px solid #e2e8f0",
              bgcolor: "#ffffff",
            }}
          >
            <Box
              display="flex"
              flexDirection={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              gap={2}
              mb={3}
            >
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: "#0f172a" }}>
                  Recent Inquiries
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Showing latest active pipeline customer entries
                </Typography>
              </Box>

              <Box display="flex" alignItems="center" gap={1.5} width={{ xs: "100%", sm: "auto" }}>
                <TextField
                  size="small"
                  placeholder="Filter name, route, phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRoundedIcon fontSize="small" sx={{ color: "#94a3b8" }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    width: { xs: "100%", sm: 240 },
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      bgcolor: "#f8fafc",
                    },
                  }}
                />
                <Button
                  component={RouterLink}
                  to="/app/enquiries"
                  size="small"
                  endIcon={<ArrowForwardRoundedIcon fontSize="small" />}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    color: "#2563eb",
                    whiteSpace: "nowrap",
                  }}
                >
                  View All
                </Button>
              </Box>
            </Box>

            <Divider sx={{ borderColor: "#f1f5f9", mb: 1.5 }} />

            {filteredEnquiries.length === 0 ? (
              <Box py={6} textAlign="center">
                <Typography variant="body2" color="text.secondary">
                  {search ? "No inquiries matched your criteria." : "No inquiries logged yet."}{" "}
                  {!search && (
                    <Link component={RouterLink} to="/app/enquiries" sx={{ color: "#2563eb", fontWeight: 700 }}>
                      Create first inquiry
                    </Link>
                  )}
                </Typography>
              </Box>
            ) : (
              <Box display="flex" flexDirection="column">
                {filteredEnquiries.map((e) => {
                  const stage = STAGE_CONFIG[e.status?.toUpperCase()] ?? STAGE_CONFIG.NEW;
                  return (
                    <Box
                      key={e.id}
                      display="flex"
                      flexDirection={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      gap={1.5}
                      sx={{
                        py: 1.75,
                        px: 1,
                        borderRadius: 2,
                        borderBottom: "1px solid #f8fafc",
                        transition: "background-color 0.15s ease",
                        "&:hover": { bgcolor: "#f8fafc" },
                        "&:last-of-type": { borderBottom: "none" },
                      }}
                    >
                      {/* Customer Info */}
                      <Box display="flex" alignItems="center" gap={1.75}>
                        <Avatar
                          sx={{
                            width: 38,
                            height: 38,
                            bgcolor: "#eff6ff",
                            color: "#2563eb",
                            fontSize: "0.85rem",
                            fontWeight: 700,
                          }}
                        >
                          <PersonRoundedIcon fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={800} sx={{ color: "#1e293b" }}>
                            {e.customer?.name ?? "Anonymous Customer"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {e.customer?.phone ?? "No contact"}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Route Path */}
                      <Box display="flex" alignItems="center" gap={1}>
                        <RouteRoundedIcon sx={{ fontSize: 16, color: "#94a3b8" }} />
                        <Typography variant="body2" fontWeight={600} color="#475569">
                          {[e.source, e.destination].filter(Boolean).join(" → ") || "Local / Open Route"}
                        </Typography>
                      </Box>

                      {/* Stage & Date Badge */}
                      <Box display="flex" alignItems="center" gap={2}>
                        <Chip
                          size="small"
                          label={stage.label}
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.72rem",
                            borderRadius: "6px",
                            bgcolor: stage.bg,
                            color: stage.color,
                          }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60, textAlign: "right" }}>
                          {e.createdAt
                            ? new Date(e.createdAt).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                              })
                            : "—"}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Recent Audit / Operational Activity */}
        <Grid item xs={12} lg={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3.5,
              border: "1px solid #e2e8f0",
              bgcolor: "#ffffff",
              height: "100%",
            }}
          >
            <Box display="flex" alignItems="center" gap={1.25} mb={2.5}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: "#f1f5f9", color: "#475569" }}>
                <HistoryRoundedIcon fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: "#0f172a" }}>
                  System Activities
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Recent operational timeline events
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ borderColor: "#f1f5f9", mb: 2 }} />

            {!metrics?.recentActivities || metrics.recentActivities.length === 0 ? (
              <Box py={5} textAlign="center">
                <Typography variant="body2" color="text.secondary">
                  No logged activities recorded yet.
                </Typography>
              </Box>
            ) : (
              <Box display="flex" flexDirection="column" gap={2}>
                {metrics.recentActivities.map((a: any) => (
                  <Box
                    key={a.id}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: "#f8fafc",
                      border: "1px solid #f1f5f9",
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <Typography
                        variant="caption"
                        fontWeight={800}
                        sx={{ textTransform: "uppercase", color: "#2563eb", letterSpacing: "0.04em" }}
                      >
                        {a.activityType?.replace(/_/g, " ") || "EVENT"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
                        {new Date(a.createdAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Typography>
                    </Box>

                    {a.description && (
                      <Typography variant="body2" fontWeight={600} color="#1e293b" mb={0.5}>
                        {a.description}
                      </Typography>
                    )}

                    <Typography variant="caption" color="text.secondary">
                      By <strong>{a.loggedBy?.name ?? "Automated Trigger"}</strong> •{" "}
                      {new Date(a.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}