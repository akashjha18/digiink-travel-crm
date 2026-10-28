import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Paper, Button, Table, TableRow, TableCell, TableBody,
  Divider, Avatar, IconButton, Tooltip, Chip
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import BookmarkBorderRoundedIcon from "@mui/icons-material/BookmarkBorderRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import { apiClient } from "../../api/client";

export function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<any>(null);

  useEffect(() => {
    apiClient.get(`/invoices/${id}`).then(({ data }) => setInvoice(data.data));
  }, [id]);

  if (!invoice) {
    return (
      <Box sx={{ p: 4, minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography variant="body1" color="text.secondary" fontWeight={600}>
          Loading invoice details...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2.5, md: 4 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      <style>{`@media print { @page { size: A4; margin: 12mm; } body { background: #fff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } .no-print { display: none !important; } .invoice-sheet { box-shadow: none !important; border: 1px solid #e5edf5 !important; border-radius: 4px !important; max-width: none !important; padding: 7mm !important; } }`}</style>

      {/* Top Meta Bar */}
      <Box display="flex" alignItems="center" gap={1.5} mb={2.5} className="no-print">
        <Tooltip title="Back to Invoices">
          <IconButton
            onClick={() => navigate("/app/invoices")}
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
          TAX INVOICE / #{id?.slice(-6).toUpperCase()}
        </Typography>
      </Box>

      {/* Page Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3.5}
        className="no-print"
      >
        <Box display="flex" alignItems="center" gap={1.75}>
          <Avatar
            sx={{
              width: 46,
              height: 46,
              background: "linear-gradient(135deg, #0284c7 0%, #0c4a6e 100%)",
              boxShadow: "0 4px 14px rgba(2, 132, 199, 0.35)",
            }}
          >
            <ReceiptLongRoundedIcon sx={{ color: "#fff", fontSize: 24 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight={900} sx={{ color: "#0f172a", letterSpacing: "-0.03em" }}>
              Tax Invoice
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Generated GST-compliant bill for booking #{invoice.bookingId?.slice(-6).toUpperCase()}
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={<PrintRoundedIcon />}
          onClick={() => window.print()}
          sx={{
            background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
            boxShadow: "0 4px 14px rgba(2, 132, 199, 0.35)",
            fontWeight: 700,
            borderRadius: 2.5,
            textTransform: "none",
            px: 3,
            py: 1,
          }}
        >
          Print Invoice
        </Button>
      </Box>

      {/* Invoice Sheet */}
      <Paper
        className="invoice-sheet"
        elevation={0}
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
        <Box display="flex" justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} gap={2} mb={2.5} sx={{ minHeight: 112, position: "relative", overflow: "hidden" }}>
          <Box
            component="svg"
            viewBox="0 0 620 190"
            preserveAspectRatio="none"
            aria-hidden="true"
            sx={{ position: "absolute", right: 0, bottom: 0, width: { xs: "75%", sm: "64%" }, height: "100%", zIndex: 0, pointerEvents: "none" }}
          >
            <defs>
              <linearGradient id="invoice-hill-back" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e5f1ef" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#d7e9e5" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="invoice-hill-front" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#dcebe8" stopOpacity="0.72" />
                <stop offset="100%" stopColor="#cfe3df" stopOpacity="0.92" />
              </linearGradient>
            </defs>
            <path d="M0 162 C58 150 86 130 128 133 C164 135 179 151 219 151 C258 151 276 132 310 133 C347 134 362 153 400 153 C450 153 473 129 518 132 C564 135 580 153 620 151 L620 190 L0 190Z" fill="url(#invoice-hill-back)" />
            <path d="M0 170 C71 161 113 147 162 151 C205 154 225 167 271 164 C319 161 341 119 378 93 C414 119 438 149 472 158 C516 169 559 152 620 161 L620 190 L0 190Z" fill="url(#invoice-hill-front)" />
            <path d="M0 178 C69 169 112 159 167 164 C220 169 241 179 291 176 C344 173 370 153 416 157 C461 161 495 178 538 174 C570 171 596 164 620 168 L620 190 L0 190Z" fill="#d3e7e3" fillOpacity="0.72" />
            <g fill="none" stroke="#b7d0cc" strokeWidth="4" strokeLinecap="round" opacity="0.72">
              <path d="M475 157 Q472 105 458 60" />
              <path d="M458 61 Q438 37 420 42 Q439 45 455 64 Q448 37 462 21 Q460 43 460 62 Q474 36 495 37 Q475 46 461 65 Q489 51 507 62 Q483 58 461 68" />
              <path d="M544 166 Q541 126 530 93" />
              <path d="M530 94 Q515 75 502 81 Q517 82 528 96 Q522 76 534 64 Q531 81 532 96 Q547 76 564 78 Q547 85 533 98 Q555 87 570 96 Q551 92 533 101" />
            </g>
            <g fill="none" stroke="#b8d0d2" strokeWidth="3.5" strokeLinecap="round" opacity="0.8">
              <path d="M188 55 Q198 45 207 56 Q214 64 222 62" />
              <path d="M225 76 Q234 66 243 77 Q249 84 258 82" />
            </g>
          </Box>
          <Box display="flex" alignItems="center" gap={2} minWidth={0}>
            {invoice.companyProfile?.logoUrl ? (
              <Box
                component="img"
                src={invoice.companyProfile.logoUrl}
                alt={`${invoice.companyProfile.companyName || "Company"} logo`}
                sx={{ width: { xs: 64, sm: 88 }, height: { xs: 64, sm: 88 }, objectFit: "contain", borderRadius: 2.5, border: "1px solid #e5edf5", p: 1, flexShrink: 0, position: "relative", bgcolor: "#fff" }}
              />
            ) : (
              <Avatar sx={{ width: { xs: 64, sm: 88 }, height: { xs: 64, sm: 88 }, bgcolor: invoice.companyProfile?.primaryColor || "#0284c7", fontSize: 28, fontWeight: 800, flexShrink: 0, position: "relative" }}>
                {(invoice.companyProfile?.companyName || "T").slice(0, 1).toUpperCase()}
              </Avatar>
            )}
            <Box minWidth={0} sx={{ position: "relative", zIndex: 1 }}>
              <Typography variant="h4" fontWeight={900} color="#0f1e3a" sx={{ lineHeight: 1.15, fontSize: { xs: "1.45rem", sm: "2rem" }, overflowWrap: "anywhere" }}>
                {invoice.companyProfile?.companyName ?? "Travel Agency"}
              </Typography>
              {invoice.companyProfile?.address && <Box display="flex" alignItems="center" gap={0.5} mt={0.35}><PlaceRoundedIcon sx={{ fontSize: 16, color: "#64748b" }} /><Typography variant="body2" color="text.secondary">{invoice.companyProfile.address}</Typography></Box>}
              <Box display="flex" flexWrap="wrap" columnGap={2} rowGap={0.35} mt={0.5}>
                {invoice.companyProfile?.phone && <Box display="flex" alignItems="center" gap={0.55}><PhoneRoundedIcon sx={{ fontSize: 15, color: "#64748b" }} /><Typography variant="body2" color="text.secondary">{invoice.companyProfile.phone}</Typography></Box>}
                {invoice.companyProfile?.email && <Box display="flex" alignItems="center" gap={0.55}><EmailRoundedIcon sx={{ fontSize: 15, color: "#64748b" }} /><Typography variant="body2" color="text.secondary">{invoice.companyProfile.email}</Typography></Box>}
              </Box>
              {invoice.companyProfile?.gstNumber && (
                <Typography variant="body2" color="text.secondary" fontWeight={600} mt={0.5}>
                  GSTIN: <strong style={{ color: "#0f172a" }}>{invoice.companyProfile.gstNumber}</strong>
                </Typography>
              )}
            </Box>
          </Box>
          <Chip
            label="TAX INVOICE"
            icon={<ReceiptLongRoundedIcon sx={{ color: "#07834f !important" }} />}
            sx={{
              bgcolor: "#eaf8f1",
              color: "#07834f",
              fontWeight: 800,
              fontSize: { xs: "0.72rem", sm: "0.9rem" },
              borderRadius: 1.5,
              flexShrink: 0,
              position: "absolute",
              zIndex: 2,
              top: 2,
              right: 4,
              px: { xs: 0.5, sm: 1.5 },
              height: { xs: 34, sm: 42 },
            }}
          />
        </Box>

        <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "repeat(3, 1fr)" }} gap={1} px={2} py={1.5} mb={2} sx={{ bgcolor: "#f1f6fb", borderRadius: 2 }}>
          <Box display="flex" alignItems="center" gap={1.25} sx={{ borderRight: { sm: "1px solid #dce6f0" }, px: 1 }}><ReceiptLongRoundedIcon sx={{ color: "#64748b" }} /><Box><Typography variant="caption" color="text.secondary">Invoice No.</Typography><Typography variant="body2" fontWeight={800} color="#0f1e3a">INV-{invoice.id?.slice(-8).toUpperCase()}</Typography></Box></Box>
          <Box display="flex" alignItems="center" gap={1.25} sx={{ borderRight: { sm: "1px solid #dce6f0" }, px: 1 }}><CalendarMonthRoundedIcon sx={{ color: "#64748b" }} /><Box><Typography variant="caption" color="text.secondary">Invoice Date</Typography><Typography variant="body2" fontWeight={800} color="#0f1e3a">{new Date(invoice.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</Typography></Box></Box>
          <Box display="flex" alignItems="center" gap={1.25} sx={{ px: 1 }}><BookmarkBorderRoundedIcon sx={{ color: "#64748b" }} /><Box><Typography variant="caption" color="text.secondary">Booking #</Typography><Typography variant="body2" fontWeight={800} color="#0f1e3a">#{invoice.bookingId?.slice(-6).toUpperCase()}</Typography></Box></Box>
        </Box>

        {/* Customer & Billing Details */}
        <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }} gap={2} mb={2}>
          <Box p={{ xs: 2, sm: 2.25 }} sx={{ bgcolor: "#f3f8ff", borderRadius: 2, border: "1px solid #d5e5fa" }}>
            <Box display="flex" alignItems="center" gap={0.8} mb={1.2}><PersonRoundedIcon sx={{ color: "#526783", fontSize: 18 }} /><Typography variant="caption" fontWeight={800} color="#526783" textTransform="uppercase">Billed to customer</Typography></Box>
            <Typography variant="subtitle1" fontWeight={800} color="#0f1e3a">
              {invoice.customer?.name}
            </Typography>
            <Box display="flex" alignItems="center" gap={0.7} mt={0.65}><PhoneRoundedIcon sx={{ fontSize: 15, color: "#526783" }} /><Typography variant="body2" color="text.secondary">Phone: {invoice.customer?.phone || "—"}</Typography></Box>
            {invoice.customer?.email && <Box display="flex" alignItems="center" gap={0.7} mt={0.35}><EmailRoundedIcon sx={{ fontSize: 15, color: "#526783" }} /><Typography variant="body2" color="text.secondary">Email: {invoice.customer.email}</Typography></Box>}
          </Box>

          <Box p={{ xs: 2, sm: 2.25 }} sx={{ bgcolor: "#f3faf7", borderRadius: 2, border: "1px solid #d4eee2" }}>
            <Box display="flex" alignItems="center" gap={0.8} mb={1.2}><ReceiptLongRoundedIcon sx={{ color: "#16835b", fontSize: 18 }} /><Typography variant="caption" fontWeight={800} color="#526783" textTransform="uppercase">Billing & tax metadata</Typography></Box>
            <Typography variant="body2" color="#0f172a" fontWeight={600}>
              HSN/SAC: <strong>{invoice.hsnSac || "9985 (Tour Operator Services)"}</strong>
            </Typography>
            <Divider sx={{ my: 1.15, borderColor: "#dcece4" }} />
            <Box display="flex" alignItems="center" gap={0.7}><PlaceRoundedIcon sx={{ fontSize: 16, color: "#526783" }} /><Typography variant="body2" color="text.secondary">Place of Supply: {invoice.customer?.address || "As per customer location"}</Typography></Box>
          </Box>
        </Box>

        {/* Financial Breakdown Table */}
        <Table size="small" sx={{ mb: 2, "& th, & td": { px: { xs: 1.25, sm: 2 } } }}>
          <TableBody>
            <TableRow sx={{ bgcolor: "#f1f6fb", "& th": { py: 1, borderBottom: 0 } }}>
              <TableCell component="th" sx={{ color: "#788ba5", fontWeight: 800, fontSize: "0.68rem", letterSpacing: ".06em" }}>DESCRIPTION</TableCell>
              <TableCell component="th" align="right" sx={{ color: "#788ba5", fontWeight: 800, fontSize: "0.68rem", letterSpacing: ".06em" }}>AMOUNT (INR)</TableCell>
            </TableRow>
            <TableRow sx={{ "& td": { py: 1.5, borderBottom: "1px solid #f1f5f9" } }}>
              <TableCell sx={{ color: "#475569", fontWeight: 600 }}>Tour & Travel Package Subtotal</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: "#0f172a" }}>
                ₹{((invoice.subtotalInPaise || 0) / 100).toLocaleString("en-IN")}
              </TableCell>
            </TableRow>
            <TableRow sx={{ "& td": { py: 1.5, borderBottom: "1px solid #f1f5f9" } }}>
              <TableCell sx={{ color: "#475569", fontWeight: 600 }}>Applicable GST</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: "#0f172a" }}>
                ₹{((invoice.gstInPaise || 0) / 100).toLocaleString("en-IN")}
              </TableCell>
            </TableRow>
            <TableRow sx={{ bgcolor: "#fff8e6", "& td": { py: 1.8, borderBottom: 0 } }}>
              <TableCell sx={{ fontWeight: 900, color: "#5d4214", fontSize: "1rem" }}>
                <Box display="flex" alignItems="center" gap={1}><AccountBalanceWalletRoundedIcon sx={{ color: "#b07a00" }} />
                Grand Total Payable
                </Box>
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 900, color: "#a87300", fontSize: "1.35rem" }}>
                ₹{((invoice.totalInPaise || 0) / 100).toLocaleString("en-IN")}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <Box display="flex" alignItems="center" gap={1} pt={1.5} borderTop="1px solid #e5edf5">
          <InfoOutlinedIcon sx={{ color: "#64748b", fontSize: 18 }} />
          <Typography variant="caption" color="text.secondary">
            Thank you for choosing our travel services. This is a computer-generated invoice and requires no physical signature.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
