import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box, Typography, Paper, Grid, Chip, Link, TextField, InputAdornment,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { apiClient } from "../../api/client";

const STAGE_COLOR: Record<string, "info" | "warning" | "secondary" | "success" | "error" | "default"> = {
  NEW: "info", CONTACTED: "warning", QUOTED: "secondary", NEGOTIATION: "warning", WON: "success", LOST: "error",
};

const CARD_ACCENTS = [
  { icon: BarChartRoundedIcon, iconBg: "#fdecd2", iconColor: "#c9820f", bar: "#e6a729" },
  { icon: AutoAwesomeRoundedIcon, iconBg: "#e2ecff", iconColor: "#3b6fe0", bar: "#3b6fe0" },
  { icon: StarRoundedIcon, iconBg: "#efe4fb", iconColor: "#8a4fd6", bar: "#8a4fd6" },
  { icon: EmojiEventsRoundedIcon, iconBg: "#dcf5e6", iconColor: "#1f9d55", bar: "#1f9d55" },
  { icon: CloseRoundedIcon, iconBg: "#fbe1e1", iconColor: "#d84343", bar: "#d84343" },
];

export function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    apiClient.get("/client/dashboard").then(({ data }) => setMetrics(data.data)).catch(() => setMetrics(null));
    apiClient.get("/enquiries").then(({ data }) => setEnquiries((data.data ?? []).slice(0, 6))).catch(() => setEnquiries([]));
  }, []);

  const cards = [
    { label: "Total Enquiries", value: metrics?.totalEnquiries },
    { label: "New This Month", value: metrics?.newEnquiries },
    { label: "Active Bookings", value: metrics?.activeBookings },
    {
      label: "Total Booking Revenue",
      value: metrics?.totalBookingRevenueInPaise !== undefined
        ? `₹${(metrics.totalBookingRevenueInPaise / 100).toLocaleString()}` : undefined,
    },
    {
      label: "Outstanding Payments",
      value: metrics?.outstandingPaymentsInPaise !== undefined
        ? `₹${(metrics.outstandingPaymentsInPaise / 100).toLocaleString()}` : undefined,
    },
  ].filter((c) => c.value !== undefined);

  const filteredEnquiries = enquiries.filter((e) => {
    if (!search) return true;
    const haystack = `${e.customer?.name ?? ""} ${e.customer?.phone ?? ""} ${e.source ?? ""} ${e.destination ?? ""}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  return (
    <Box sx={{ p: { xs: 3, md: 4 } }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4" fontWeight={700}>
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {new Date().toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}
        </Typography>
      </Box>

      <Grid container spacing={3} mb={4}>
        {cards.map((card, i) => {
          const accent = CARD_ACCENTS[i % CARD_ACCENTS.length];
          const Icon = accent.icon;
          return (
            <Grid item xs={6} sm={4} md={12 / Math.max(cards.length, 1)} key={card.label}>
              <Paper
                elevation={0}
                sx={{ p: 3, borderRadius: 3, border: "1px solid #eef0f3", boxShadow: "0 2px 8px rgba(16,24,40,0.04)" }}
              >
                <Box
                  sx={{
                    width: 40, height: 40, borderRadius: 2, bgcolor: accent.iconBg,
                    display: "flex", alignItems: "center", justifyContent: "center", mb: 2,
                  }}
                >
                  <Icon sx={{ color: accent.iconColor }} fontSize="small" />
                </Box>
                <Typography variant="h5" fontWeight={700}>
                  {card.value}
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  {card.label}
                </Typography>
                <Box sx={{ height: 3, width: 40, bgcolor: accent.bar, borderRadius: 2 }} />
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper
            elevation={0}
            sx={{ p: 3, borderRadius: 3, border: "1px solid #eef0f3", boxShadow: "0 2px 8px rgba(16,24,40,0.04)" }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
              <Box display="flex" alignItems="baseline" gap={1}>
                <Typography variant="h6" fontWeight={700}>
                  Recent Enquiries
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  last {filteredEnquiries.length}
                </Typography>
              </Box>
              <TextField
                size="small"
                placeholder="Search name, phone or route..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: 260 }}
              />
            </Box>

            {filteredEnquiries.length === 0 ? (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={5}>
                No enquiries yet.{" "}
                <Link component={RouterLink} to="/app/enquiries">
                  Add your first one.
                </Link>
              </Typography>
            ) : (
              <Box>
                <Box
                  display="grid"
                  gridTemplateColumns="2fr 2fr 1fr 1fr"
                  sx={{ color: "text.secondary", fontSize: 12, fontWeight: 600, letterSpacing: 0.5, pb: 1, borderBottom: "1px solid #f2f3f5" }}
                >
                  <Typography variant="caption" fontWeight={700}>CUSTOMER</Typography>
                  <Typography variant="caption" fontWeight={700}>ROUTE</Typography>
                  <Typography variant="caption" fontWeight={700}>STATUS</Typography>
                  <Typography variant="caption" fontWeight={700}>DATE</Typography>
                </Box>
                {filteredEnquiries.map((e) => (
                  <Box
                    key={e.id}
                    display="grid"
                    gridTemplateColumns="2fr 2fr 1fr 1fr"
                    alignItems="center"
                    sx={{ py: 1.5, borderBottom: "1px solid #f7f7f8" }}
                  >
                    <Typography variant="body2" fontWeight={600}>
                      {e.customer?.name ?? "—"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {[e.source, e.destination].filter(Boolean).join(" → ") || "—"}
                    </Typography>
                    <Box>
                      <Chip size="small" label={e.status ?? "—"} color={STAGE_COLOR[e.status] ?? "default"} />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {e.createdAt ? new Date(e.createdAt).toLocaleDateString(undefined, { day: "2-digit", month: "short" }) : "—"}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{ p: 3, borderRadius: 3, border: "1px solid #eef0f3", boxShadow: "0 2px 8px rgba(16,24,40,0.04)" }}
          >
            <Typography variant="h6" fontWeight={700} mb={2}>
              Recent Activity
            </Typography>
            {(!metrics?.recentActivities || metrics.recentActivities.length === 0) ? (
              <Typography variant="body2" color="text.secondary">
                No activity yet.
              </Typography>
            ) : (
              <Box display="flex" flexDirection="column" gap={1.5}>
                {metrics.recentActivities.map((a: any) => (
                  <Box key={a.id} sx={{ pb: 1.5, borderBottom: "1px solid #f7f7f8", "&:last-of-type": { borderBottom: "none" } }}>
                    <Typography variant="body2" fontWeight={600} sx={{ textTransform: "capitalize" }}>
                      {a.activityType.replace(/_/g, " ").toLowerCase()}
                    </Typography>
                    {a.description && (
                      <Typography variant="body2" color="text.secondary">
                        {a.description}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {a.loggedBy?.name ?? "System"} · {new Date(a.createdAt).toLocaleString()}
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
