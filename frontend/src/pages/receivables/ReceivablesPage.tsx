import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box, Typography, Paper, Grid, Table, TableHead, TableRow, TableCell,
  TableBody, Chip, Link, Select, MenuItem,
} from "@mui/material";
import { apiClient } from "../../api/client";

const STATUS_COLOR: Record<string, "success" | "warning" | "error"> = { PAID: "success", PARTIALLY_PAID: "warning", UNPAID: "error" };

// Receivables dashboard (SRS section 24).
export function ReceivablesPage() {
  const [summary, setSummary] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("");

  function load() {
    apiClient.get("/receivables/dashboard").then(({ data }) => setSummary(data.data));
    apiClient.get("/receivables", { params: statusFilter ? { paymentStatus: statusFilter } : {} }).then(({ data }) => setRows(data.data));
  }
  useEffect(load, [statusFilter]);

  const cards = summary ? [
    ["Total Receivable", summary.totalReceivable],
    ["Due Today", summary.dueToday],
    ["Overdue", summary.overdue],
    ["Due This Week", summary.dueThisWeek],
    ["Paid", summary.paid],
  ] : [];

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>Receivables</Typography>

      <Grid container spacing={2} mb={3}>
        {cards.map(([label, amount]) => (
          <Grid item xs={6} sm={4} md={2.4} key={label as string}>
            <Paper sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="h6">₹{((amount as number) / 100).toLocaleString()}</Typography>
              <Typography variant="body2" color="text.secondary">{label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Select size="small" displayEmpty value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ mb: 2, minWidth: 180 }}>
        <MenuItem value="">All statuses</MenuItem>
        {["UNPAID", "PARTIALLY_PAID", "PAID"].map((s) => <MenuItem key={s} value={s}>{s.replace("_", " ")}</MenuItem>)}
      </Select>

      <Paper>
        <Table>
          <TableHead>
            <TableRow><TableCell>Customer</TableCell><TableCell>Total</TableCell><TableCell>Paid</TableCell><TableCell>Pending</TableCell><TableCell>Due Date</TableCell><TableCell>Status</TableCell><TableCell /></TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.bookingId}>
                <TableCell>{r.customer.name}</TableCell>
                <TableCell>₹{(r.totalInPaise / 100).toLocaleString()}</TableCell>
                <TableCell>₹{(r.paidInPaise / 100).toLocaleString()}</TableCell>
                <TableCell>₹{(r.pendingInPaise / 100).toLocaleString()}</TableCell>
                <TableCell>{r.dueDate ? new Date(r.dueDate).toLocaleDateString() : "—"}</TableCell>
                <TableCell><Chip size="small" label={r.status.replace("_", " ")} color={STATUS_COLOR[r.status]} /></TableCell>
                <TableCell><Link component={RouterLink} to={`/app/bookings/${r.bookingId}`}>View</Link></TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={7}>Nothing to show.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
