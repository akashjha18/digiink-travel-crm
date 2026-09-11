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
import MapRoundedIcon from "@mui/icons-material/MapRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import DirectionsCarRoundedIcon from "@mui/icons-material/DirectionsCarRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import FlightTakeoffRoundedIcon from "@mui/icons-material/FlightTakeoffRounded";
import FiberManualRecordRoundedIcon from "@mui/icons-material/FiberManualRecordRounded";
import { apiClient } from "../api/client";
import { useAuth } from "../hooks/useAuth";
import { SubscriptionBanner } from "../components/SubscriptionBanner";

const DRAWER_WIDTH = 276;

const NAV_GROUPS = [
  {
    title: "OVERVIEW",
    items: [
      { to: "/app/dashboard", label: "Dashboard", feature: null, permission: "dashboard", icon: DashboardRoundedIcon },
      { to: "/app/reports", label: "Analytics & Reports", feature: "basic_reports", permission: "reports", icon: BarChartRoundedIcon },
    ],
  },
  {
    title: "SALES & CRM",
    items: [
      { to: "/app/enquiries", label: "Leads", feature: "enquiry_crm", permission: "enquiries", icon: ContactPhoneRoundedIcon },
      { to: "/app/pipeline", label: "Pipeline", feature: "enquiry_crm", permission: "enquiries", icon: TimelineRoundedIcon },
      { to: "/app/customers", label: "Customers", feature: "enquiry_crm", permission: "customers", icon: PeopleAltRoundedIcon },
      { to: "/app/quotations", label: "Quotations", feature: "quotation", permission: "quotations", icon: RequestQuoteRoundedIcon },
      { to: "/app/itineraries", label: "Itineraries", feature: "quotation", permission: "quotations", icon: MapRoundedIcon },
    ],
  },
  {
    title: "OPERATIONS & FLEET",
    items: [
      { to: "/app/bookings", label: "Bookings", feature: "bookings", permission: "bookings", icon: EventAvailableRoundedIcon },
      { to: "/app/suppliers", label: "Suppliers & Costing", feature: null, permission: null, icon: StorefrontRoundedIcon },
      { to: "/app/trips", label: "Trips Dispatch", feature: "bookings", permission: "trips", icon: DirectionsCarRoundedIcon },
      { to: "/app/drivers", label: "Drivers", feature: "drivers", permission: "drivers", icon: BadgeRoundedIcon },
      { to: "/app/vehicles", label: "Fleet Vehicles", feature: "vehicles", permission: "vehicles", icon: LocalShippingRoundedIcon },
    ],
  },
  {
    title: "FINANCE & BILLING",
    items: [
      { to: "/app/receivables", label: "Receivables", feature: "payments", permission: "payments", icon: AccountBalanceWalletRoundedIcon },
      { to: "/app/invoices", label: "Invoices", feature: "payments", permission: "invoices", icon: ReceiptLongRoundedIcon },
    ],
  },
  {
    title: "WORKFLOWS & SCALE",
    items: [
      { to: "/app/automation", label: "Automations", feature: "workflow_automation", permission: "settings", icon: BoltRoundedIcon },
      { to: "/app/whatsapp", label: "WhatsApp Suite", feature: null, permission: null, icon: WhatsAppIcon },
      { to: "/app/branches", label: "Branches", feature: "multi_branch", permission: "settings", icon: AccountTreeRoundedIcon },
      { to: "/app/custom-fields", label: "Custom Fields", feature: "custom_modules", permission: "settings", icon: TuneRoundedIcon },
      { to: "/app/staff", label: "Staff Members", feature: null, permission: "staff", icon: GroupRoundedIcon },
      { to: "/app/roles", label: "Roles & Access", feature: null, permission: "staff", icon: AdminPanelSettingsRoundedIcon },
    ],
  },
];

export function ClientLayout() {
  const { logout } = useAuth();
  const [client, setClient] = useState<any>(null);
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    apiClient
      .get("/client/profile")
      .then(({ data }) => setClient(data.data))
      .catch((err) => {
        console.error("Failed to load /client/profile", err);
      });
    apiClient
      .get("/client/me")
      .then(({ data }) => setMe(data.data))
      .catch((err) => {
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
          background: "linear-gradient(180deg, #082f49 0%, #0c4a6e 42%, #0f172a 100%)",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          borderRight: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "4px 0 24px rgba(8, 47, 73, 0.15)",
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
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            background: "rgba(0, 0, 0, 0.12)",
          }}
        >
          <Avatar
            src={me?.companyProfile?.logoUrl || client?.companyProfile?.logoUrl || undefined}
            sx={{
              background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
              color: "#fff",
              fontWeight: 900,
              fontSize: "1.1rem",
              width: 44,
              height: 44,
              borderRadius: 2.75,
              boxShadow: "0 6px 16px rgba(2, 132, 199, 0.35)",
              border: "1.5px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            {!(me?.companyProfile?.logoUrl || client?.companyProfile?.logoUrl) && (
              <FlightTakeoffRoundedIcon sx={{ fontSize: 22 }} />
            )}
          </Avatar>
          <Box minWidth={0} flexGrow={1}>
            <Typography
              variant="subtitle1"
              fontWeight={900}
              noWrap
              sx={{ color: "#ffffff !important", letterSpacing: "-0.02em", fontSize: "0.98rem" }}
            >
              {businessName}
            </Typography>
            <Box display="flex" alignItems="center" gap={1} mt={0.35}>
              <Chip
                label={client?.plan?.name || "Pro Partner"}
                size="small"
                sx={{
                  height: 19,
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  bgcolor: "rgba(56, 189, 248, 0.2)",
                  color: "#38bdf8 !important",
                  borderRadius: "6px",
                  border: "1px solid rgba(56, 189, 248, 0.4)",
                }}
              />
              <Box display="flex" alignItems="center" gap={0.5}>
                <FiberManualRecordRoundedIcon sx={{ fontSize: 8, color: "#10b981" }} />
                <Typography variant="caption" sx={{ color: "#e2e8f0 !important", fontSize: "0.72rem", fontWeight: 700 }}>
                  Live Ops
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Grouped Nav Items */}
        <Box
          sx={{
            px: 2,
            py: 2.25,
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
            const permissions = me?.permissions as Record<string, { view?: boolean }> | undefined;
            const isAdmin = Boolean(me?.isClientAdmin);
            const visibleItems = group.items.filter(
              (item) => (!item.feature || entitlements[item.feature]) && (isAdmin || !item.permission || permissions?.[item.permission]?.view)
            );
            if (visibleItems.length === 0) return null;

            return (
              <Box key={group.title} sx={{ mb: 2.75 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "#93c5fd !important",
                    letterSpacing: "0.1em",
                    px: 1.5,
                    mb: 1.1,
                    display: "block",
                    fontWeight: 800,
                    fontSize: "0.72rem",
                    textTransform: "uppercase",
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
                          borderRadius: 2.5,
                          mb: 0.6,
                          py: 1,
                          px: 1.5,
                          color: "#e2e8f0 !important",
                          transition: "all 0.18s ease-in-out",
                          position: "relative",
                          "& .MuiListItemIcon-root": {
                            color: "#cbd5e1 !important",
                            minWidth: 34,
                            transition: "color 0.15s ease",
                          },
                          "& .MuiListItemText-primary": {
                            color: "#f1f5f9 !important",
                            fontSize: "0.88rem",
                            fontWeight: 600,
                            letterSpacing: "-0.01em",
                          },
                          "&:hover": {
                            bgcolor: "rgba(255, 255, 255, 0.1)",
                            color: "#ffffff !important",
                            transform: "translateX(2px)",
                            "& .MuiListItemIcon-root": {
                              color: "#38bdf8 !important",
                            },
                            "& .MuiListItemText-primary": {
                              color: "#ffffff !important",
                              fontWeight: 700,
                            },
                          },
                          "&.active": {
                            bgcolor: "rgba(2, 132, 199, 0.35)",
                            color: "#ffffff !important",
                            border: "1px solid rgba(56, 189, 248, 0.4)",
                            boxShadow: "0 2px 10px rgba(2, 132, 199, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.2)",
                            "& .MuiListItemIcon-root": {
                              color: "#38bdf8 !important",
                            },
                            "& .MuiListItemText-primary": {
                              color: "#ffffff !important",
                              fontWeight: 800,
                            },
                            "&::before": {
                              content: '""',
                              position: "absolute",
                              left: 0,
                              top: "14%",
                              bottom: "14%",
                              width: 3.5,
                              borderRadius: "0 4px 4px 0",
                              bgcolor: "#38bdf8",
                              boxShadow: "0 0 12px #38bdf8",
                            },
                          },
                        }}
                      >
                        <ListItemIcon>
                          <Icon sx={{ fontSize: 20 }} />
                        </ListItemIcon>
                        <ListItemText primary={item.label} />
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
            bgcolor: "rgba(0, 0, 0, 0.25)",
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
              py: 0.6,
              ml: -0.75,
              flexGrow: 1,
              transition: "background 0.15s ease",
              "&:hover": { bgcolor: "rgba(255, 255, 255, 0.08)" },
            }}
          >
            <Avatar
              src={me?.avatarUrl ?? undefined}
              sx={{
                width: 38,
                height: 38,
                bgcolor: "rgba(2, 132, 199, 0.25)",
                color: "#38bdf8",
                fontSize: "0.88rem",
                fontWeight: 800,
                border: "1.5px solid rgba(56, 189, 248, 0.4)",
              }}
            >
              {(me?.name ?? "?").trim().charAt(0).toUpperCase() || initial}
            </Avatar>
            <Box minWidth={0}>
              <Typography variant="body2" fontWeight={800} noWrap sx={{ color: "#ffffff !important", fontSize: "0.88rem" }}>
                {me?.name ?? "Account Owner"}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "#94a3b8 !important", display: "block", fontSize: "0.74rem", fontWeight: 600 }}
                noWrap
              >
                {me?.role?.name ?? (me?.isClientAdmin ? "Administrator" : "Team Member")}
              </Typography>
            </Box>
          </Box>

          <Tooltip title="Sign Out">
            <IconButton
              onClick={logout}
              size="small"
              sx={{
                color: "rgba(255, 255, 255, 0.7)",
                bgcolor: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: 2,
                p: 0.9,
                transition: "all 0.18s ease",
                "&:hover": {
                  bgcolor: "rgba(239, 68, 68, 0.2)",
                  borderColor: "rgba(239, 68, 68, 0.4)",
                  color: "#f87171",
                  transform: "scale(1.05)",
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