import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  Box, List, ListItemButton, ListItemIcon, ListItemText, Typography, Avatar, IconButton,
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

const DRAWER_WIDTH = 260;
const SIDEBAR_FROM = "#7a2e0e";
const SIDEBAR_TO = "#c9560f";

const ALL_NAV = [
  { to: "/app/dashboard", label: "Dashboard", feature: null, icon: DashboardRoundedIcon },
  { to: "/app/enquiries", label: "Enquiries", feature: "enquiry_crm", icon: ContactPhoneRoundedIcon },
  { to: "/app/pipeline", label: "Pipeline", feature: "enquiry_crm", icon: TimelineRoundedIcon },
  { to: "/app/customers", label: "Customers", feature: "enquiry_crm", icon: PeopleAltRoundedIcon },
  { to: "/app/quotations", label: "Quotations", feature: "quotation", icon: RequestQuoteRoundedIcon },
  { to: "/app/bookings", label: "Bookings", feature: "bookings", icon: EventAvailableRoundedIcon },
  { to: "/app/receivables", label: "Receivables", feature: "payments", icon: AccountBalanceWalletRoundedIcon },
  { to: "/app/invoices", label: "Invoices", feature: "payments", icon: ReceiptLongRoundedIcon },
  { to: "/app/reports", label: "Reports", feature: "basic_reports", icon: BarChartRoundedIcon },
  { to: "/app/automation", label: "Automation", feature: "workflow_automation", icon: BoltRoundedIcon },
  { to: "/app/branches", label: "Branches", feature: "multi_branch", icon: AccountTreeRoundedIcon },
  { to: "/app/whatsapp", label: "WhatsApp", feature: "integrations", icon: WhatsAppIcon },
  { to: "/app/custom-fields", label: "Custom Fields", feature: "custom_modules", icon: TuneRoundedIcon },
  { to: "/app/trips", label: "Trips", feature: "bookings", icon: DirectionsCarRoundedIcon },
  { to: "/app/drivers", label: "Drivers", feature: "drivers", icon: BadgeRoundedIcon },
  { to: "/app/vehicles", label: "Vehicles", feature: "vehicles", icon: LocalShippingRoundedIcon },
  { to: "/app/staff", label: "Staff", feature: null, icon: GroupRoundedIcon },
  { to: "/app/roles", label: "Roles", feature: null, icon: AdminPanelSettingsRoundedIcon },
];

export function ClientLayout() {
  const { logout } = useAuth();
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    apiClient.get("/client/profile").then(({ data }) => setClient(data.data));
  }, []);

  // Sidebar hides modules the plan doesn't include (SRS section 42) — the
  // real enforcement is the backend's requireEntitlement guard; this is
  // UX only, so a hidden link never substitutes for the API-level check.
  const entitlements = client?.plan?.entitlements ?? {};
  const nav = ALL_NAV.filter((item) => !item.feature || entitlements[item.feature]);

  const businessName: string = client?.businessName ?? "Digiink Travel CRM";
  const initial = businessName.trim().charAt(0).toUpperCase() || "D";

  return (
    <Box display="flex" minHeight="100vh" sx={{ bgcolor: "#f4f6f9" }}>
      {/* Sidebar */}
      <Box
        component="nav"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          background: `linear-gradient(180deg, ${SIDEBAR_FROM} 0%, ${SIDEBAR_TO} 100%)`,
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 3, py: 3 }}>
          <Avatar sx={{ bgcolor: "#fff", color: SIDEBAR_TO, fontWeight: 700, width: 44, height: 44 }}>
            {initial}
          </Avatar>
          <Box minWidth={0}>
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              {businessName}
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
              CRM Panel
            </Typography>
          </Box>
        </Box>

        <Typography
          variant="caption"
          sx={{ color: "rgba(255,255,255,0.55)", letterSpacing: 1, px: 3, mb: 1, fontWeight: 600 }}
        >
          MAIN MENU
        </Typography>

        <List sx={{ px: 2, flexGrow: 1, overflowY: "auto" }}>
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <ListItemButton
                key={item.to}
                component={NavLink}
                to={item.to}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  color: "rgba(255,255,255,0.85)",
                  "&.active": {
                    bgcolor: "rgba(255,255,255,0.16)",
                    color: "#fff",
                    fontWeight: 600,
                  },
                  "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14 }} />
              </ListItemButton>
            );
          })}
        </List>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            px: 2.5,
            py: 2,
            borderTop: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          <Box display="flex" alignItems="center" gap={1.5} minWidth={0}>
            <Avatar sx={{ width: 34, height: 34, bgcolor: "rgba(255,255,255,0.2)" }}>
              {initial}
            </Avatar>
            <Box minWidth={0}>
              <Typography variant="body2" fontWeight={600} noWrap>
                {client?.ownerName ?? "Account Owner"}
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.65)" }}>
                Administrator
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={logout} size="small" sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.12)" }}>
            <LogoutRoundedIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Main content */}
      <Box component="main" flexGrow={1} sx={{ ml: `${DRAWER_WIDTH}px`, width: `calc(100% - ${DRAWER_WIDTH}px)` }}>
        {client && <SubscriptionBanner status={client.subscriptionStatus} expiry={client.subscriptionExpiry} />}
        <Outlet />
      </Box>
    </Box>
  );
}
