import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  Paper, Chip, Link, Select, MenuItem,
} from "@mui/material";
import { apiClient } from "../../api/client";

const STATUS_COLOR: Record<string, "default" | "info" | "success" | "error" | "warning"> = {
  DRAFT: "default", SENT: "info", ACCEPTED: "success", REJECTED: "error", EXPIRED: "warning",
};

export function QuotationsListPage() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    apiClient.get("/quotations", { params: statusFilter ? { status: statusFilter } : {} }).then(({ data }) => setQuotations(data.data));
  }, [statusFilter]);

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>Quotations</Typography>
      <Typography color="text.secondary" mb={2}>
        Quotations are created from an enquiry's detail page. Once accepted, convert one to a booking from its detail page.
      </Typography>

      <Select size="small" displayEmpty value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ mb: 2, minWidth: 180 }}>
        <MenuItem value="">All statuses</MenuItem>
        {["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
      </Select>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Customer</TableCell><TableCell>Destination</TableCell><TableCell>Version</TableCell>
              <TableCell>Total</TableCell><TableCell>Status</TableCell><TableCell>Booked?</TableCell><TableCell>Created</TableCell><TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {quotations.map((q) => (
              <TableRow key={q.id}>
                <TableCell>{q.customer?.name}</TableCell>
                <TableCell>{q.enquiry?.destination ?? "—"}</TableCell>
                <TableCell>v{q.version}</TableCell>
                <TableCell>₹{(q.totalInPaise / 100).toLocaleString()}</TableCell>
                <TableCell><Chip size="small" label={q.status} color={STATUS_COLOR[q.status]} /></TableCell>
                <TableCell>{q.booking ? "Yes" : "No"}</TableCell>
                <TableCell>{new Date(q.createdAt).toLocaleDateString()}</TableCell>
                <TableCell><Link component={RouterLink} to={`/app/quotations/${q.id}`}>View</Link></TableCell>
              </TableRow>
            ))}
            {quotations.length === 0 && <TableRow><TableCell colSpan={8}>No quotations yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
