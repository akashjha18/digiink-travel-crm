import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  Paper, Chip, Link, Select, MenuItem,
} from "@mui/material";
import { apiClient } from "../../api/client";

const STATUS_COLOR: Record<string, "info" | "warning" | "success" | "error"> = {
  SCHEDULED: "info", IN_PROGRESS: "warning", COMPLETED: "success", CANCELLED: "error",
};

export function TripsListPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    apiClient.get("/trips", { params: statusFilter ? { status: statusFilter } : {} }).then(({ data }) => setTrips(data.data));
  }, [statusFilter]);

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>Trips</Typography>

      <Select size="small" displayEmpty value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ mb: 2, minWidth: 180 }}>
        <MenuItem value="">All statuses</MenuItem>
        {["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((s) => <MenuItem key={s} value={s}>{s.replace("_", " ")}</MenuItem>)}
      </Select>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Customer</TableCell><TableCell>Pickup → Drop</TableCell><TableCell>Dates</TableCell>
              <TableCell>Driver</TableCell><TableCell>Vehicle</TableCell><TableCell>Status</TableCell><TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {trips.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.booking?.customer?.name}</TableCell>
                <TableCell>{t.pickup ?? "—"} → {t.drop ?? "—"}</TableCell>
                <TableCell>{t.startDate ? new Date(t.startDate).toLocaleDateString() : "TBD"}</TableCell>
                <TableCell>{t.driver?.name ?? "Unassigned"}</TableCell>
                <TableCell>{t.vehicle?.registrationNumber ?? "Unassigned"}</TableCell>
                <TableCell><Chip size="small" label={t.status.replace("_", " ")} color={STATUS_COLOR[t.status]} /></TableCell>
                <TableCell><Link component={RouterLink} to={`/app/trips/${t.id}`}>View</Link></TableCell>
              </TableRow>
            ))}
            {trips.length === 0 && <TableRow><TableCell colSpan={7}>No trips yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
