import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Link } from "@mui/material";
import { apiClient } from "../../api/client";

export function InvoicesListPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  useEffect(() => { apiClient.get("/invoices").then(({ data }) => setInvoices(data.data)); }, []);

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>Invoices</Typography>
      <Typography color="text.secondary" mb={2}>Generate an invoice from a booking's detail page.</Typography>
      <Paper>
        <Table>
          <TableHead><TableRow><TableCell>Customer</TableCell><TableCell>Subtotal</TableCell><TableCell>GST</TableCell><TableCell>Total</TableCell><TableCell>Date</TableCell><TableCell /></TableRow></TableHead>
          <TableBody>
            {invoices.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell>{inv.customer?.name}</TableCell>
                <TableCell>₹{(inv.subtotalInPaise / 100).toLocaleString()}</TableCell>
                <TableCell>₹{(inv.gstInPaise / 100).toLocaleString()}</TableCell>
                <TableCell>₹{(inv.totalInPaise / 100).toLocaleString()}</TableCell>
                <TableCell>{new Date(inv.createdAt).toLocaleDateString()}</TableCell>
                <TableCell><Link component={RouterLink} to={`/app/invoices/${inv.id}`}>View</Link></TableCell>
              </TableRow>
            ))}
            {invoices.length === 0 && <TableRow><TableCell colSpan={6}>No invoices yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
