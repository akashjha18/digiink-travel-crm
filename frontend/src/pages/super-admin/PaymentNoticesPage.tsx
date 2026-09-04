import { useEffect, useState } from "react";
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Button, Link } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { apiClient } from "../../api/client";

export function PaymentNoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);

  function load() {
    apiClient.get("/super-admin/payment-notices").then(({ data }) => setNotices(data.data));
  }
  useEffect(load, []);

  async function dismiss(id: string) {
    await apiClient.post(`/super-admin/payment-notices/${id}/dismiss`);
    load();
  }

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>Payment Notices</Typography>
      <Typography color="text.secondary" mb={2}>
        Raised when a client clicks "I have made the payment." Verify manually before confirming on the client's detail page — this list does not auto-reactivate anything.
      </Typography>
      <Paper>
        <Table>
          <TableHead><TableRow><TableCell>Client</TableCell><TableCell>Raised</TableCell><TableCell /></TableRow></TableHead>
          <TableBody>
            {notices.map((n) => (
              <TableRow key={n.id}>
                <TableCell>
                  <Link component={RouterLink} to={`/super-admin/clients/${n.clientId}`}>{n.client.businessName}</Link>
                  <br /><Typography variant="caption" color="text.secondary">{n.client.email}</Typography>
                </TableCell>
                <TableCell>{new Date(n.createdAt).toLocaleString()}</TableCell>
                <TableCell><Button size="small" onClick={() => dismiss(n.id)}>Dismiss</Button></TableCell>
              </TableRow>
            ))}
            {notices.length === 0 && <TableRow><TableCell colSpan={3}>No pending notices.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
