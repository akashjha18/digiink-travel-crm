import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Grid, Paper, Typography, Link, Chip } from "@mui/material";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import HourglassBottomRoundedIcon from "@mui/icons-material/HourglassBottomRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import { apiClient } from "../../api/client";

interface Summary {
  total: number; active: number; expiringSoon: number; grace: number;
  locked: number; deleted: number; pendingPayments: number;
}

interface ClientRow {
  id: string; clientCode: string; businessName: string; email: string;
  subscriptionStatus: string; subscriptionExpiry: string; plan: { name: string };
}

const STATUS_COLOR: Record<string, "success" | "warning" | "error" | "default"> = {
  ACTIVE: "success", EXPIRING_SOON: "warning", GRACE: "warning", LOCKED: "error", DELETED: "default",
};

const CARDS: Array<{ label: string; key: keyof Summary; icon: typeof DescriptionRoundedIcon }> = [
  { label: "Total Clients", key: "total", icon: PeopleAltRoundedIcon },
  { label: "Active", key: "active", icon: CheckCircleRoundedIcon },
  { label: "Expiring Soon", key: "expiringSoon", icon: HourglassBottomRoundedIcon },
  { label: "Grace Period", key: "grace", icon: DescriptionRoundedIcon },
  { label: "Locked", key: "locked", icon: LockRoundedIcon },
  { label: "Deleted", key: "deleted", icon: DeleteRoundedIcon },
  { label: "Pending Payments", key: "pendingPayments", icon: PaymentsRoundedIcon },
];

export function SuperAdminDashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recentClients, setRecentClients] = useState<ClientRow[]>([]);
  const [adminName] = useState<string>(() => localStorage.getItem("role") === "SUPER_ADMIN" ? "Super Admin" : "Admin");

  useEffect(() => {
    apiClient.get("/super-admin/dashboard").then(({ data }) => setSummary(data.data));
    apiClient.get("/super-admin/clients").then(({ data }) => setRecentClients((data.data ?? []).slice(0, 5)));
  }, []);

  return (
    <Box sx={{ p: { xs: 3, md: 5 } }}>
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Typography variant="body2" color="text.secondary">
          Signed in as {adminName}
        </Typography>
      </Box>

      <Typography variant="h4" fontWeight={700} gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        Welcome back! Here is your platform overview.
      </Typography>

      <Grid container spacing={3} mb={4}>
        {CARDS.map(({ label, key, icon: Icon }) => (
          <Grid item xs={6} sm={4} md={3} lg={12 / 7} key={key}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: "1px solid #eef0f3",
                boxShadow: "0 2px 8px rgba(16,24,40,0.04)",
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: "#eaf1ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 2,
                }}
              >
                <Icon sx={{ color: "#2f6fed" }} fontSize="small" />
              </Box>
              <Typography variant="h5" fontWeight={700}>
                {summary ? summary[key] : "—"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {label}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper
        elevation={0}
        sx={{ p: 3, borderRadius: 3, border: "1px solid #eef0f3", boxShadow: "0 2px 8px rgba(16,24,40,0.04)" }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight={700}>
            Recent Clients
          </Typography>
          <Link component={RouterLink} to="/super-admin/clients" underline="hover" fontWeight={600}>
            View All →
          </Link>
        </Box>

        {recentClients.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={5}>
            No clients yet.{" "}
            <Link component={RouterLink} to="/super-admin/clients">
              Add your first one.
            </Link>
          </Typography>
        ) : (
          <Box display="flex" flexDirection="column" gap={1.5}>
            {recentClients.map((c) => (
              <Box
                key={c.id}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                sx={{ py: 1.5, borderBottom: "1px solid #f2f3f5", "&:last-of-type": { borderBottom: "none" } }}
              >
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {c.businessName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {c.email} · {c.plan?.name}
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={c.subscriptionStatus.replace("_", " ")}
                  color={STATUS_COLOR[c.subscriptionStatus] ?? "default"}
                />
              </Box>
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
}
