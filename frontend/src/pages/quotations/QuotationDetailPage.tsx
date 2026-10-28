import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Avatar,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import HourglassEmptyRoundedIcon from "@mui/icons-material/HourglassEmptyRounded";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import RouteRoundedIcon from "@mui/icons-material/RouteRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { apiClient } from "../../api/client";

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; color: string; border: string }
> = {
  DRAFT: { label: "Draft", bg: "#f1f5f9", color: "#475569", border: "#e2e8f0" },
  SENT: { label: "Sent to Client", bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  ACCEPTED: { label: "Accepted", bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
  REJECTED: { label: "Declined", bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" },
  EXPIRED: { label: "Expired", bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
};

export function QuotationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState<any>(null);
  const [updating, setUpdating] = useState(false);
  const [converting, setConverting] = useState(false);

  function load() {
    apiClient.get(`/quotations/${id}`).then(({ data }) => setQuotation(data.data));
  }

  useEffect(load, [id]);

  async function updateStatus(status: string) {
    try {
      setUpdating(true);
      await apiClient.patch(`/quotations/${id}/status`, { status });
      load();
    } finally {
      setUpdating(false);
    }
  }

  async function convertToBooking() {
    try {
      setConverting(true);
      const { data } = await apiClient.post(`/quotations/${id}/convert-to-booking`, {});
      navigate(`/app/bookings/${data.data.id}`);
    } finally {
      setConverting(false);
    }
  }

  if (!quotation) {
    return (
      <Box
        sx={{
          minHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <CircularProgress size={32} sx={{ color: "#2563eb" }} />
        <Typography variant="body2" color="text.secondary">
          Loading proposal details...
        </Typography>
      </Box>
    );
  }

  const items: Array<{ description: string; amountInPaise: number }> =
    quotation.itineraryJson || [];

  const statusMeta = STATUS_CONFIG[quotation.status] ?? {
    label: quotation.status,
    bg: "#f1f5f9",
    color: "#475569",
    border: "#e2e8f0",
  };

  return (
    <Box sx={{ p: { xs: 2.5, md: 4.5 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      {/* Print Styles */}
      <style>{`
        @media print {
          body { background-color: #ffffff !important; }
          .no-print { display: none !important; }
          .print-container {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      {/* Top Header & Breadcrumb (No Print) */}
      <Box className="no-print" mb={3}>
        <Box display="flex" alignItems="center" gap={1.5} mb={2}>
          <Tooltip title="Back to Quotations">
            <IconButton
              onClick={() => navigate("/app/quotations")}
              size="small"
              sx={{
                bgcolor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 2,
                "&:hover": { bgcolor: "#f1f5f9" },
              }}
            >
              <ArrowBackRoundedIcon fontSize="small" sx={{ color: "#475569" }} />
            </IconButton>
          </Tooltip>
          <Typography variant="caption" color="text.secondary" fontWeight={700}>
            PROPOSALS / QUOTATION #{id?.slice(-6).toUpperCase()}
          </Typography>
        </Box>

        {/* Action Toolbar */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 3.5,
            border: "1px solid #e2e8f0",
            bgcolor: "#ffffff",
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "center" },
            gap: 2,
            boxShadow: "0 4px 16px rgba(16, 24, 40, 0.03)",
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar
              sx={{
                width: 44,
                height: 44,
                bgcolor: "#eff6ff",
                color: "#2563eb",
                borderRadius: 2.5,
              }}
            >
              <ReceiptLongRoundedIcon fontSize="small" />
            </Avatar>
            <Box>
              <Box display="flex" alignItems="center" gap={1.25}>
                <Typography variant="h6" fontWeight={900} sx={{ color: "#0f172a" }}>
                  Quotation Version {quotation.version}
                </Typography>
                <Chip
                  size="small"
                  label={statusMeta.label}
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.72rem",
                    bgcolor: statusMeta.bg,
                    color: statusMeta.color,
                    border: `1px solid ${statusMeta.border}`,
                    borderRadius: "6px",
                  }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                Created on {new Date(quotation.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </Typography>
            </Box>
          </Box>

          {/* Context Action Buttons */}
          <Box display="flex" alignItems="center" gap={1.25} flexWrap="wrap">
            {quotation.status === "DRAFT" && (
              <Button
                variant="contained"
                disabled={updating}
                startIcon={<SendRoundedIcon fontSize="small" />}
                onClick={() => updateStatus("SENT")}
                sx={{
                  bgcolor: "#2563eb",
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 700,
                  "&:hover": { bgcolor: "#1d4ed8" },
                }}
              >
                Mark Sent
              </Button>
            )}

            {quotation.status === "SENT" && (
              <>
                <Button
                  variant="contained"
                  disabled={updating}
                  startIcon={<CheckCircleRoundedIcon fontSize="small" />}
                  onClick={() => updateStatus("ACCEPTED")}
                  sx={{
                    bgcolor: "#16a34a",
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 700,
                    "&:hover": { bgcolor: "#15803d" },
                  }}
                >
                  Accept
                </Button>
                <Button
                  variant="outlined"
                  disabled={updating}
                  startIcon={<CancelRoundedIcon fontSize="small" />}
                  onClick={() => updateStatus("REJECTED")}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 700,
                    color: "#dc2626",
                    borderColor: "#fecaca",
                    "&:hover": { borderColor: "#dc2626", bgcolor: "#fef2f2" },
                  }}
                >
                  Decline
                </Button>
                <Button
                  variant="outlined"
                  disabled={updating}
                  startIcon={<HourglassEmptyRoundedIcon fontSize="small" />}
                  onClick={() => updateStatus("EXPIRED")}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 700,
                    color: "#d97706",
                    borderColor: "#fde68a",
                    "&:hover": { borderColor: "#d97706", bgcolor: "#fffbeb" },
                  }}
                >
                  Expire
                </Button>
              </>
            )}

            {quotation.status === "ACCEPTED" && !quotation.booking && (
              <Button
                variant="contained"
                disabled={converting}
                startIcon={
                  converting ? (
                    <CircularProgress size={16} sx={{ color: "#fff" }} />
                  ) : (
                    <EventAvailableRoundedIcon fontSize="small" />
                  )
                }
                onClick={convertToBooking}
                sx={{
                  bgcolor: "#2563eb",
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 700,
                  boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)",
                  "&:hover": { bgcolor: "#1d4ed8" },
                }}
              >
                {converting ? "Converting..." : "Convert to Booking"}
              </Button>
            )}

            {quotation.booking && (
              <Button
                variant="contained"
                startIcon={<EventAvailableRoundedIcon fontSize="small" />}
                onClick={() => navigate(`/app/bookings/${quotation.booking.id}`)}
                sx={{
                  bgcolor: "#16a34a",
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 700,
                  "&:hover": { bgcolor: "#15803d" },
                }}
              >
                View Confirmed Booking
              </Button>
            )}

            <Button
              variant="outlined"
              startIcon={<AddCircleOutlineRoundedIcon fontSize="small" />}
              onClick={() => navigate(`/app/quotations/${id}/new-version`)}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 700,
                color: "#334155",
                borderColor: "#e2e8f0",
                bgcolor: "#ffffff",
                "&:hover": { borderColor: "#cbd5e1", bgcolor: "#f8fafc" },
              }}
            >
              New Version
            </Button>

            <Button
              variant="outlined"
              startIcon={<PrintRoundedIcon fontSize="small" />}
              onClick={() => window.print()}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 700,
                color: "#334155",
                borderColor: "#e2e8f0",
                bgcolor: "#ffffff",
                "&:hover": { borderColor: "#cbd5e1", bgcolor: "#f8fafc" },
              }}
            >
              Print
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* Printable quotation document */}
      <Paper
        elevation={0}
        className="print-container"
        sx={{
          p: { xs: 2.5, sm: 4, md: 5 },
          maxWidth: 1040,
          mx: "auto",
          borderRadius: 2.5,
          border: "1px solid #e5edf5",
          bgcolor: "#ffffff",
          boxShadow: "0 4px 20px -5px rgba(15, 23, 42, 0.06)",
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" gap={2} mb={2.5} sx={{ minHeight: 112, position: "relative", overflow: "hidden" }}>
          <Box component="svg" viewBox="0 0 620 190" preserveAspectRatio="none" aria-hidden="true" sx={{ position: "absolute", right: 0, bottom: 0, width: { xs: "75%", sm: "64%" }, height: "100%", zIndex: 0, pointerEvents: "none" }}>
            <defs><linearGradient id="quotation-hill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e5f1ef" stopOpacity="0.45" /><stop offset="100%" stopColor="#cfe3df" stopOpacity="0.9" /></linearGradient></defs>
            <path d="M0 162 C58 150 86 130 128 133 C164 135 179 151 219 151 C258 151 276 132 310 133 C347 134 362 153 400 153 C450 153 473 129 518 132 C564 135 580 153 620 151 L620 190 L0 190Z" fill="#e5f1ef" />
            <path d="M0 170 C71 161 113 147 162 151 C205 154 225 167 271 164 C319 161 341 119 378 93 C414 119 438 149 472 158 C516 169 559 152 620 161 L620 190 L0 190Z" fill="url(#quotation-hill)" />
            <g fill="none" stroke="#b7d0cc" strokeWidth="4" strokeLinecap="round" opacity="0.72"><path d="M475 157 Q472 105 458 60" /><path d="M458 61 Q438 37 420 42 Q439 45 455 64 Q448 37 462 21 Q460 43 460 62 Q474 36 495 37 Q475 46 461 65 Q489 51 507 62 Q483 58 461 68" /><path d="M544 166 Q541 126 530 93" /><path d="M530 94 Q515 75 502 81 Q517 82 528 96 Q522 76 534 64 Q531 81 532 96 Q547 76 564 78 Q547 85 533 98 Q555 87 570 96 Q551 92 533 101" /></g>
            <g fill="none" stroke="#b8d0d2" strokeWidth="3.5" strokeLinecap="round" opacity="0.8"><path d="M188 55 Q198 45 207 56 Q214 64 222 62" /><path d="M225 76 Q234 66 243 77 Q249 84 258 82" /></g>
          </Box>
          <Box display="flex" alignItems="center" gap={2} minWidth={0} sx={{ position: "relative", zIndex: 1 }}>
            {quotation.companyProfile?.logoUrl ? <Box component="img" src={quotation.companyProfile.logoUrl} alt={`${quotation.companyProfile.companyName || "Company"} logo`} sx={{ width: { xs: 64, sm: 88 }, height: { xs: 64, sm: 88 }, objectFit: "contain", borderRadius: 2.5, border: "1px solid #e5edf5", p: 1, flexShrink: 0, bgcolor: "#fff" }} /> : <Avatar sx={{ width: { xs: 64, sm: 88 }, height: { xs: 64, sm: 88 }, bgcolor: quotation.companyProfile?.primaryColor || "#0284c7", fontSize: 28, fontWeight: 800, flexShrink: 0 }}>{(quotation.companyProfile?.companyName || "T").slice(0, 1).toUpperCase()}</Avatar>}
            <Box minWidth={0}>
              <Typography variant="h4" fontWeight={900} color="#0f1e3a" sx={{ lineHeight: 1.15, fontSize: { xs: "1.45rem", sm: "2rem" }, overflowWrap: "anywhere" }}>{quotation.companyProfile?.companyName || "Travel Agency"}</Typography>
              {quotation.companyProfile?.address && <Box display="flex" alignItems="center" gap={0.5} mt={0.4}><PlaceRoundedIcon sx={{ fontSize: 15, color: "#64748b" }} /><Typography variant="body2" color="text.secondary">{quotation.companyProfile.address}</Typography></Box>}
              <Box display="flex" flexWrap="wrap" columnGap={2} rowGap={0.35} mt={0.45}>
                {quotation.companyProfile?.phone && <Box display="flex" alignItems="center" gap={0.5}><PhoneRoundedIcon sx={{ fontSize: 15, color: "#64748b" }} /><Typography variant="body2" color="text.secondary">{quotation.companyProfile.phone}</Typography></Box>}
                {quotation.companyProfile?.email && <Box display="flex" alignItems="center" gap={0.5}><EmailRoundedIcon sx={{ fontSize: 15, color: "#64748b" }} /><Typography variant="body2" color="text.secondary">{quotation.companyProfile.email}</Typography></Box>}
              </Box>
              {quotation.companyProfile?.gstNumber && <Typography variant="body2" color="text.secondary" fontWeight={600} mt={0.4}>GSTIN: <strong style={{ color: "#0f172a" }}>{quotation.companyProfile.gstNumber}</strong></Typography>}
            </Box>
          </Box>
          <Chip label="QUOTATION" icon={<ReceiptLongRoundedIcon sx={{ color: "#07834f !important" }} />} sx={{ bgcolor: "#eaf8f1", color: "#07834f", fontWeight: 800, borderRadius: 1.5, position: "absolute", zIndex: 2, top: 2, right: 4, px: 1, height: 40 }} />
        </Box>

        <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "repeat(3, 1fr)" }} gap={1} px={2} py={1.5} mb={2} sx={{ bgcolor: "#f1f6fb", borderRadius: 2 }}>
          <Box display="flex" alignItems="center" gap={1.25} sx={{ borderRight: { sm: "1px solid #dce6f0" }, px: 1 }}><ReceiptLongRoundedIcon sx={{ color: "#64748b" }} /><Box><Typography variant="caption" color="text.secondary">Quotation No.</Typography><Typography variant="body2" fontWeight={800} color="#0f1e3a">QT-{id?.slice(-8).toUpperCase()} · V{quotation.version}</Typography></Box></Box>
          <Box display="flex" alignItems="center" gap={1.25} sx={{ borderRight: { sm: "1px solid #dce6f0" }, px: 1 }}><CalendarTodayRoundedIcon sx={{ color: "#64748b" }} /><Box><Typography variant="caption" color="text.secondary">Prepared Date</Typography><Typography variant="body2" fontWeight={800} color="#0f1e3a">{new Date(quotation.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</Typography></Box></Box>
          <Box display="flex" alignItems="center" gap={1.25} sx={{ px: 1 }}><RouteRoundedIcon sx={{ color: "#64748b" }} /><Box><Typography variant="caption" color="text.secondary">Destination</Typography><Typography variant="body2" fontWeight={800} color="#0f1e3a">{quotation.enquiry?.destination || "Travel proposal"}</Typography></Box></Box>
        </Box>

        <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }} gap={2} mb={2}>
          <Box p={{ xs: 2, sm: 2.25 }} sx={{ bgcolor: "#f3f8ff", borderRadius: 2, border: "1px solid #d5e5fa" }}>
            <Box display="flex" alignItems="center" gap={0.8} mb={1.2}><PersonRoundedIcon sx={{ color: "#526783", fontSize: 18 }} /><Typography variant="caption" fontWeight={800} color="#526783" textTransform="uppercase">Prepared for</Typography></Box>
            <Typography variant="subtitle1" fontWeight={800} color="#0f1e3a">{quotation.customer?.name || "Valued Customer"}</Typography>
            {quotation.customer?.phone && <Box display="flex" alignItems="center" gap={0.7} mt={0.55}><PhoneRoundedIcon sx={{ fontSize: 15, color: "#526783" }} /><Typography variant="body2" color="text.secondary">{quotation.customer.phone}</Typography></Box>}
            {quotation.customer?.email && <Box display="flex" alignItems="center" gap={0.7} mt={0.35}><EmailRoundedIcon sx={{ fontSize: 15, color: "#526783" }} /><Typography variant="body2" color="text.secondary">{quotation.customer.email}</Typography></Box>}
          </Box>
          <Box p={{ xs: 2, sm: 2.25 }} sx={{ bgcolor: "#f3faf7", borderRadius: 2, border: "1px solid #d4eee2" }}>
            <Box display="flex" alignItems="center" gap={0.8} mb={1.2}><RouteRoundedIcon sx={{ color: "#16835b", fontSize: 18 }} /><Typography variant="caption" fontWeight={800} color="#526783" textTransform="uppercase">Travel itinerary</Typography></Box>
            <Typography variant="subtitle1" fontWeight={800} color="#0f1e3a">{[quotation.enquiry?.pickupLocation || quotation.enquiry?.source, quotation.enquiry?.destination].filter(Boolean).join(" → ") || "Open Route"}</Typography>
            <Box display="flex" alignItems="center" gap={0.7} mt={0.55}><CalendarTodayRoundedIcon sx={{ fontSize: 15, color: "#526783" }} /><Typography variant="body2" color="text.secondary">Travel date: {quotation.enquiry?.travelDate ? new Date(quotation.enquiry.travelDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "To be confirmed"}</Typography></Box>
          </Box>
        </Box>

        <Table size="small" sx={{ mb: 2, "& th, & td": { px: { xs: 1.25, sm: 2 } } }}>
          <TableHead sx={{ bgcolor: "#f1f6fb" }}><TableRow><TableCell sx={{ color: "#788ba5", fontWeight: 800, fontSize: "0.68rem", letterSpacing: ".06em", py: 1 }}>DESCRIPTION</TableCell><TableCell align="right" sx={{ color: "#788ba5", fontWeight: 800, fontSize: "0.68rem", letterSpacing: ".06em", py: 1 }}>AMOUNT (INR)</TableCell></TableRow></TableHead>
          <TableBody>
            {items.map((item, i) => <TableRow key={i}><TableCell sx={{ py: 1.5, color: "#334155", fontWeight: 600 }}>{item.description}</TableCell><TableCell align="right" sx={{ py: 1.5, color: "#0f1e3a", fontWeight: 700 }}>₹{((item.amountInPaise || 0) / 100).toLocaleString("en-IN")}</TableCell></TableRow>)}
            {!!quotation.markupInPaise && <TableRow><TableCell sx={{ py: 1.15, color: "text.secondary" }}>Service Fee / Markup</TableCell><TableCell align="right" sx={{ py: 1.15, fontWeight: 600 }}>₹{(quotation.markupInPaise / 100).toLocaleString("en-IN")}</TableCell></TableRow>}
            {!!quotation.discountInPaise && <TableRow><TableCell sx={{ py: 1.15, color: "text.secondary" }}>Applied Discount</TableCell><TableCell align="right" sx={{ py: 1.15, color: "#dc2626", fontWeight: 600 }}>−₹{(quotation.discountInPaise / 100).toLocaleString("en-IN")}</TableCell></TableRow>}
            {!!quotation.taxInPaise && <TableRow><TableCell sx={{ py: 1.15, color: "text.secondary" }}>Goods & Services Tax (GST)</TableCell><TableCell align="right" sx={{ py: 1.15, fontWeight: 600 }}>₹{(quotation.taxInPaise / 100).toLocaleString("en-IN")}</TableCell></TableRow>}
            <TableRow sx={{ bgcolor: "#fff8e6", "& td": { py: 1.8, borderBottom: 0 } }}><TableCell sx={{ fontWeight: 900, color: "#5d4214", fontSize: "1rem" }}><Box display="flex" alignItems="center" gap={1}><AccountBalanceWalletRoundedIcon sx={{ color: "#b07a00" }} />Final Net Payable</Box></TableCell><TableCell align="right" sx={{ fontWeight: 900, color: "#a87300", fontSize: "1.35rem" }}>₹{((quotation.totalInPaise || 0) / 100).toLocaleString("en-IN")}</TableCell></TableRow>
          </TableBody>
        </Table>

        {quotation.termsAndConditions && <Box p={2} mb={1.5} sx={{ bgcolor: "#f8fafc", border: "1px solid #e8edf4", borderRadius: 2 }}><Typography variant="caption" fontWeight={800} color="#64748b" display="block" mb={0.75}>TERMS & CONDITIONS</Typography><Typography variant="body2" color="#475569" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{quotation.termsAndConditions}</Typography></Box>}
        <Box display="flex" alignItems="center" gap={1} pt={1.5} borderTop="1px solid #e5edf5"><InfoOutlinedIcon sx={{ color: "#64748b", fontSize: 18 }} /><Typography variant="caption" color="text.secondary">Thank you for considering us for your travel plans. Prices and availability are subject to confirmation.</Typography></Box>
      </Paper>
    </Box>
  );
}
