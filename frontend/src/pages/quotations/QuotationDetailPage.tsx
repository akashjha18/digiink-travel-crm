import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box, Typography, Paper, Chip, Button, Table, TableHead, TableRow,
  TableCell, TableBody, Divider,
} from "@mui/material";
import { apiClient } from "../../api/client";

const STATUS_COLOR: Record<string, "default" | "info" | "success" | "error" | "warning"> = {
  DRAFT: "default", SENT: "info", ACCEPTED: "success", REJECTED: "error", EXPIRED: "warning",
};

// No S3/PDF-generation wiring yet (that lands with document storage in a
// later phase) — "Print" uses the browser's native print-to-PDF, styled
// with a print stylesheet below, as a pragmatic stand-in for a branded
// PDF export.
export function QuotationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState<any>(null);

  function load() {
    apiClient.get(`/quotations/${id}`).then(({ data }) => setQuotation(data.data));
  }
  useEffect(load, [id]);

  async function updateStatus(status: string) {
    await apiClient.patch(`/quotations/${id}/status`, { status });
    load();
  }

  async function convertToBooking() {
    const { data } = await apiClient.post(`/quotations/${id}/convert-to-booking`, {});
    navigate(`/app/bookings/${data.data.id}`);
  }

  if (!quotation) return <Box p={4}>Loading…</Box>;

  const items: Array<{ description: string; amountInPaise: number }> = quotation.itineraryJson;

  return (
    <Box p={4}>
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2} className="no-print">
        <Box>
          <Typography variant="h4">Quotation v{quotation.version}</Typography>
          <Typography color="text.secondary">{quotation.customer?.name} · {quotation.enquiry?.destination ?? "—"}</Typography>
        </Box>
        <Chip label={quotation.status} color={STATUS_COLOR[quotation.status]} />
      </Box>

      <Box display="flex" gap={1} mb={3} flexWrap="wrap" className="no-print">
        {quotation.status === "DRAFT" && <Button variant="contained" onClick={() => updateStatus("SENT")}>Mark as Sent</Button>}
        {quotation.status === "SENT" && <>
          <Button variant="contained" color="success" onClick={() => updateStatus("ACCEPTED")}>Mark Accepted</Button>
          <Button variant="outlined" color="error" onClick={() => updateStatus("REJECTED")}>Mark Rejected</Button>
          <Button variant="outlined" onClick={() => updateStatus("EXPIRED")}>Mark Expired</Button>
        </>}
        {quotation.status === "ACCEPTED" && !quotation.booking && (
          <Button variant="contained" onClick={convertToBooking}>Convert to Booking</Button>
        )}
        {quotation.booking && <Button onClick={() => navigate(`/app/bookings/${quotation.booking.id}`)}>View Booking</Button>}
        <Button variant="outlined" onClick={() => navigate(`/app/quotations/${id}/new-version`)}>New Version</Button>
        <Button variant="outlined" onClick={() => window.print()}>Print</Button>
      </Box>

      <Paper sx={{ p: 4, maxWidth: 700 }}>
        <Typography variant="h5" gutterBottom>Quotation</Typography>
        <Typography color="text.secondary" gutterBottom>Version {quotation.version} · {new Date(quotation.createdAt).toLocaleDateString()}</Typography>
        <Typography mt={2}><b>Customer:</b> {quotation.customer?.name} ({quotation.customer?.phone})</Typography>
        <Divider sx={{ my: 2 }} />

        <Table size="small">
          <TableHead><TableRow><TableCell>Item</TableCell><TableCell align="right">Amount</TableCell></TableRow></TableHead>
          <TableBody>
            {items.map((item, i) => (
              <TableRow key={i}><TableCell>{item.description}</TableCell><TableCell align="right">₹{(item.amountInPaise / 100).toLocaleString()}</TableCell></TableRow>
            ))}
            <TableRow><TableCell>Markup</TableCell><TableCell align="right">₹{(quotation.markupInPaise / 100).toLocaleString()}</TableCell></TableRow>
            <TableRow><TableCell>Discount</TableCell><TableCell align="right">-₹{(quotation.discountInPaise / 100).toLocaleString()}</TableCell></TableRow>
            <TableRow><TableCell>Tax</TableCell><TableCell align="right">₹{(quotation.taxInPaise / 100).toLocaleString()}</TableCell></TableRow>
            <TableRow><TableCell><b>Total</b></TableCell><TableCell align="right"><b>₹{(quotation.totalInPaise / 100).toLocaleString()}</b></TableCell></TableRow>
          </TableBody>
        </Table>

        {quotation.termsAndConditions && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2">Terms & Conditions</Typography>
            <Typography variant="body2" color="text.secondary" whiteSpace="pre-wrap">{quotation.termsAndConditions}</Typography>
          </>
        )}
      </Paper>
    </Box>
  );
}
