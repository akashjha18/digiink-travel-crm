import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  Paper, Chip, Link, Select, MenuItem,
} from "@mui/material";
import { apiClient } from "../../api/client";

const STATUS_COLOR: Record<string, "info" | "warning" | "success" | "error"> = {
  CONFIRMED: "info", IN_PROGRESS: "warning", COMPLETED: "success", CANCELLED: "error",
};

export function BookingsListPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    apiClient.get("/bookings", { params: statusFilter ? { status: statusFilter } : {} }).then(({ data }) => setBookings(data.data));
  }, [statusFilter]);

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>Bookings</Typography>
      <Typography color="text.secondary" mb={2}>
        Bookings are created by converting an accepted quotation — see a quotation's detail page.
      </Typography>

      <Select size="small" displayEmpty value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ mb: 2, minWidth: 180 }}>
        <MenuItem value="">All statuses</MenuItem>
        {["CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((s) => <MenuItem key={s} value={s}>{s.replace("_", " ")}</MenuItem>)}
      </Select>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Customer</TableCell><TableCell>Amount</TableCell><TableCell>Travel Dates</TableCell>
              <TableCell>Status</TableCell><TableCell>Driver / Vehicle</TableCell><TableCell>Created</TableCell><TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {bookings.map((b) => (
              <TableRow key={b.id}>
                <TableCell>{b.customer?.name}</TableCell>
                <TableCell>₹{(b.amountInPaise / 100).toLocaleString()}</TableCell>
                <TableCell>{b.travelStart ? new Date(b.travelStart).toLocaleDateString() : "—"}</TableCell>
                <TableCell><Chip size="small" label={b.status.replace("_", " ")} color={STATUS_COLOR[b.status]} /></TableCell>
                <TableCell>{b.driver?.name ?? "Unassigned"} {b.vehicle ? `/ ${b.vehicle.registrationNumber}` : ""}</TableCell>
                <TableCell>{new Date(b.createdAt).toLocaleDateString()}</TableCell>
                <TableCell><Link component={RouterLink} to={`/app/bookings/${b.id}`}>View</Link></TableCell>
              </TableRow>
            ))}
            {bookings.length === 0 && <TableRow><TableCell colSpan={7}>No bookings yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
