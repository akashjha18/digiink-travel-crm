import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  IconButton,
  Chip,
  Tooltip,
} from "@mui/material";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import ContactPhoneRoundedIcon from "@mui/icons-material/ContactPhoneRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import RequestQuoteRoundedIcon from "@mui/icons-material/RequestQuoteRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import DirectionsCarRoundedIcon from "@mui/icons-material/DirectionsCarRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { apiClient } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import { SubscriptionBanner } from "../components/SubscriptionBanner";

const DRAWER_WIDTH = 270;

const NAV_GROUPS = [
  {
    title: "OVERVIEW",
    items: [
      { to: "/app/dashboard", label: "Dashboard", feature: null, icon: DashboardRoundedIcon },
      { to: "/app/reports", label: "Analytics & Reports", feature: "basic_reports", icon: BarChartRoundedIcon },
    ],
  },
  {
    title: "SALES & CRM",
    items: [
      { to: "/app/enquiries", label: "Leads", feature: "enquiry_crm", icon: ContactPhoneRoundedIcon },
      { to: "/app/pipeline", label: "Pipeline", feature: "enquiry_crm", icon: TimelineRoundedIcon },
      { to: "/app/customers", label: "Customers", feature: "enquiry_crm", icon: PeopleAltRoundedIcon },
      { to: "/app/quotations", label: "Quotations", feature: "quotation", icon: RequestQuoteRoundedIcon },
    ],
  },
  {
    title: "OPERATIONS & TRIPS",
    items: [
      { to: "/app/bookings", label: "Bookings", feature: "bookings", icon: EventAvailableRoundedIcon },
      { to: "/app/trips", label: "Trips Dispatch", feature: "bookings", icon: DirectionsCarRoundedIcon },
      { to: "/app/drivers", label: "Drivers", feature: "drivers", icon: BadgeRoundedIcon },
      { to: "/app/vehicles", label: "Fleet Vehicles", feature: "vehicles", icon: LocalShippingRoundedIcon },
    ],
  },
  {
    title: "FINANCE & BILLING",
    items: [
      { to: "/app/receivables", label: "Receivables", feature: "payments", icon: AccountBalanceWalletRoundedIcon },
      { to: "/app/invoices", label: "Invoices", feature: "payments", icon: ReceiptLongRoundedIcon },
    ],
  },
  {
    title: "WORKFLOWS & SCALE",
    items: [
      { to: "/app/automation", label: "Automations", feature: "workflow_automation", icon: BoltRoundedIcon },
      { to: "/app/whatsapp", label: "WhatsApp Suite", feature: "integrations", icon: WhatsAppIcon },
      { to: "/app/branches", label: "Branches", feature: "multi_branch", icon: AccountTreeRoundedIcon },
      { to: "/app/custom-fields", label: "Custom Fields", feature: "custom_modules", icon: TuneRoundedIcon },
      { to: "/app/staff", label: "Staff Members", feature: null, icon: GroupRoundedIcon },
      { to: "/app/roles", label: "Roles & Access", feature: null, icon: AdminPanelSettingsRoundedIcon },
    ],
  },
];

export function ClientLayout() {
  const { logout } = useAuth();
  const [client, setClient] = useState<any>(null);
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    apiClient.get("/client/profile").then(({ data }) => setClient(data.data)).catch((err) => {
      console.error("Failed to load /client/profile", err);
    });
    apiClient.get("/client/me").then(({ data }) => setMe(data.data)).catch((err) => {
      console.error("Failed to load /client/me", err);
    });
  }, []);

  const entitlements = client?.plan?.entitlements ?? {};
  const businessName: string = client?.businessName ?? "Digiink Travel CRM";
  const initial = businessName.trim().charAt(0).toUpperCase() || "D";

  return (
    <Box display="flex" minHeight="100vh" sx={{ bgcolor: "#f8fafc" }}>
      {/* Sidebar Navigation */}
      <Box
        component="nav"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          background: "linear-gradient(180deg, #090d16 0%, #0f172a 60%, #111827 100%)",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          borderRight: "1px solid rgba(255, 255, 255, 0.08)",
          zIndex: 1200,
        }}
      >
        {/* Brand Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.75,
            px: 3,
            py: 3,
            borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
          }}
        >
          <Avatar
            src={me?.avatarUrl ?? undefined}
            sx={{
              bgcolor: "#2563eb",
              color: "#fff",
              fontWeight: 800,
              width: 42,
              height: 42,
              borderRadius: 2.5,
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.35)",
            }}
          >
            {initial}
          </Avatar>
          <Box minWidth={0}>
            <Typography variant="subtitle1" fontWeight={800} noWrap sx={{ color: "#f8fafc", letterSpacing: "-0.01em" }}>
              {businessName}
            </Typography>
            <Box display="flex" alignItems="center" gap={1} mt={0.25}>
              <Chip
                label={client?.plan?.name || "Client"}
                size="small"
                sx={{
                  height: 18,
                  fontSize: "0.65rem",
                  fontWeight: 800,
                  bgcolor: "rgba(37, 99, 235, 0.2)",
                  color: "#60a5fa",
                  borderRadius: 1,
                  border: "1px solid rgba(37, 99, 235, 0.3)",
                }}
              />
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.7rem" }}>
                CRM Hub
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Grouped Nav Items */}
        <Box
          sx={{
            px: 2,
            py: 2,
            flexGrow: 1,
            overflowY: "auto",
            "&::-webkit-scrollbar": { width: 4 },
            "&::-webkit-scrollbar-thumb": {
              bgcolor: "rgba(255, 255, 255, 0.12)",
              borderRadius: 4,
            },
          }}
        >
          {NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter(
              (item) => !item.feature || entitlements[item.feature]
            );
            if (visibleItems.length === 0) return null;

            return (
              <Box key={group.title} sx={{ mb: 2.5 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "rgba(255, 255, 255, 0.35)",
                    letterSpacing: "0.08em",
                    px: 1.5,
                    mb: 1,
                    display: "block",
                    fontWeight: 800,
                    fontSize: "0.68rem",
                  }}
                >
                  {group.title}
                </Typography>

                <List disablePadding>
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <ListItemButton
                        key={item.to}
                        component={NavLink}
                        to={item.to}
                        sx={{
                          borderRadius: 2.25,
                          mb: 0.5,
                          py: 1,
                          px: 1.5,
                          color: "rgba(255, 255, 255, 0.65)",
                          transition: "all 0.18s ease-in-out",
                          position: "relative",
                          "&.active": {
                            bgcolor: "rgba(37, 99, 235, 0.16)",
                            color: "#ffffff",
                            fontWeight: 700,
                            "& .MuiListItemIcon-root": {
                              color: "#60a5fa",
                            },
                            "&::before": {
                              content: '""',
                              position: "absolute",
                              left: 0,
                              top: "18%",
                              bottom: "18%",
                              width: 3.5,
                              borderRadius: "0 4px 4px 0",
                              bgcolor: "#3b82f6",
                              boxShadow: "0 0 10px #3b82f6",
                            },
                          },
                          "&:hover": {
                            bgcolor: "rgba(255, 255, 255, 0.06)",
                            color: "#f8fafc",
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 34,
                            color: "inherit",
                            transition: "color 0.15s ease",
                          }}
                        >
                          <Icon sx={{ fontSize: 20 }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{
                            fontSize: "0.86rem",
                            fontWeight: "inherit",
                            letterSpacing: "-0.01em",
                          }}
                        />
                      </ListItemButton>
                    );
                  })}
                </List>
              </Box>
            );
          })}
        </Box>

        {/* Profile & Logout Footer */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2.5,
            py: 2,
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            bgcolor: "rgba(0, 0, 0, 0.2)",
          }}
        >
          <Box
            component={NavLink}
            to="/app/profile"
            display="flex"
            alignItems="center"
            gap={1.5}
            minWidth={0}
            sx={{
              textDecoration: "none",
              borderRadius: 2,
              px: 1,
              py: 0.5,
              ml: -1,
              flexGrow: 1,
              "&:hover": { bgcolor: "rgba(255, 255, 255, 0.06)" },
            }}
          >
            <Avatar
              src={me?.avatarUrl ?? undefined}
              sx={{
                width: 36,
                height: 36,
                bgcolor: "rgba(255, 255, 255, 0.08)",
                color: "#e2e8f0",
                fontSize: "0.85rem",
                fontWeight: 700,
                border: "1px solid rgba(255, 255, 255, 0.12)",
              }}
            >
              {(me?.name ?? "?").trim().charAt(0).toUpperCase() || initial}
            </Avatar>
            <Box minWidth={0}>
              <Typography variant="body2" fontWeight={700} noWrap sx={{ color: "#f8fafc" }}>
                {me?.name ?? "Account Owner"}
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.45)", display: "block" }} noWrap>
                {me?.role?.name ?? (me?.isClientAdmin ? "Administrator" : "—")}
              </Typography>
            </Box>
          </Box>

          <Tooltip title="Sign Out">
            <IconButton
              onClick={logout}
              size="small"
              sx={{
                color: "rgba(255, 255, 255, 0.65)",
                bgcolor: "rgba(255, 255, 255, 0.06)",
                borderRadius: 2,
                p: 0.9,
                "&:hover": {
                  bgcolor: "rgba(239, 68, 68, 0.15)",
                  color: "#f87171",
                },
              }}
            >
              <LogoutRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Main Content Viewport */}
      <Box
        component="main"
        flexGrow={1}
        sx={{
          ml: `${DRAWER_WIDTH}px`,
          width: `calc(100% - ${DRAWER_WIDTH}px)`,
          minHeight: "100vh",
          bgcolor: "#f8fafc",
        }}
      >
        {client && <SubscriptionBanner status={client.subscriptionStatus} expiry={client.subscriptionExpiry} />}
        <Outlet />
      </Box>
    </Box>
  );
}