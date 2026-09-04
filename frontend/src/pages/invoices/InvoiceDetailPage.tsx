import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography, Paper, Button, Table, TableHead, TableRow, TableCell, TableBody, Divider } from "@mui/material";
import { apiClient } from "../../api/client";

// Same print-to-PDF stand-in used for quotations/vouchers — see the
// Phase 5 README note on why there's no generated PDF file yet.
export function InvoiceDetailPage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<any>(null);

  useEffect(() => { apiClient.get(`/invoices/${id}`).then(({ data }) => setInvoice(data.data)); }, [id]);

  if (!invoice) return <Box p={4}>Loading…</Box>;

  return (
    <Box p={4}>
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      <Box display="flex" justifyContent="space-between" mb={2} className="no-print">
        <Typography variant="h4">Invoice</Typography>
        <Button variant="outlined" onClick={() => window.print()}>Print</Button>
      </Box>

      <Paper sx={{ p: 4, maxWidth: 700 }}>
        <Typography variant="h5" gutterBottom>{invoice.companyProfile?.companyName ?? "Tax Invoice"}</Typography>
        {invoice.companyProfile?.gstNumber && <Typography variant="body2" color="text.secondary">GSTIN: {invoice.companyProfile.gstNumber}</Typography>}
        <Typography variant="body2" color="text.secondary" gutterBottom>Invoice date: {new Date(invoice.createdAt).toLocaleDateString()}</Typography>
        <Divider sx={{ my: 2 }} />

        <Typography><b>Billed to:</b> {invoice.customer?.name}</Typography>
        <Typography>{invoice.customer?.phone} {invoice.customer?.email ? `· ${invoice.customer.email}` : ""}</Typography>
        {invoice.hsnSac && <Typography>HSN/SAC: {invoice.hsnSac}</Typography>}
        <Divider sx={{ my: 2 }} />

        <Table size="small">
          <TableBody>
            <TableRow><TableCell>Subtotal</TableCell><TableCell align="right">₹{(invoice.subtotalInPaise / 100).toLocaleString()}</TableCell></TableRow>
            <TableRow><TableCell>GST</TableCell><TableCell align="right">₹{(invoice.gstInPaise / 100).toLocaleString()}</TableCell></TableRow>
            <TableRow><TableCell><b>Total</b></TableCell><TableCell align="right"><b>₹{(invoice.totalInPaise / 100).toLocaleString()}</b></TableCell></TableRow>
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
