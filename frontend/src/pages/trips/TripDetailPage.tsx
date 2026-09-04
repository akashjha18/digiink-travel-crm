import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box, Typography, Paper, Chip, Select, MenuItem, TextField, Button, Grid, Alert,
} from "@mui/material";
import { apiClient } from "../../api/client";

const STATUS_COLOR: Record<string, "info" | "warning" | "success" | "error"> = {
  SCHEDULED: "info", IN_PROGRESS: "warning", COMPLETED: "success", CANCELLED: "error",
};

export function TripDetailPage() {
  const { id } = useParams();
  const [trip, setTrip] = useState<any>(null);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [notes, setNotes] = useState({ pickup: "", drop: "", itineraryNotes: "" });
  const [assignError, setAssignError] = useState<string | null>(null);

  function load() {
    apiClient.get(`/trips/${id}`).then(({ data }) => {
      setTrip(data.data);
      setNotes({ pickup: data.data.pickup ?? "", drop: data.data.drop ?? "", itineraryNotes: data.data.itineraryNotes ?? "" });
    });
  }
  useEffect(load, [id]);
  useEffect(() => {
    apiClient.get("/drivers").then(({ data }) => setDrivers(data.data)).catch(() => {});
    apiClient.get("/vehicles").then(({ data }) => setVehicles(data.data)).catch(() => {});
  }, []);

  async function updateStatus(status: string) {
    await apiClient.patch(`/trips/${id}/status`, { status });
    load();
  }

  async function assign(field: "driverId" | "vehicleId", value: string) {
    setAssignError(null);
    try {
      await apiClient.patch(`/trips/${id}/assign`, { [field]: value || null });
      load();
    } catch (err: any) {
      setAssignError(err.response?.data?.message ?? "Could not update assignment");
    }
  }

  async function saveNotes() {
    await apiClient.patch(`/trips/${id}`, notes);
    load();
  }

  if (!trip) return <Box p={4}>Loading…</Box>;

  return (
    <Box p={4}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Box>
          <Typography variant="h4">Trip</Typography>
          <Typography color="text.secondary">{trip.booking?.customer?.name}</Typography>
        </Box>
        <Chip label={trip.status.replace("_", " ")} color={STATUS_COLOR[trip.status]} />
      </Box>

      <Select size="small" value={trip.status} onChange={(e) => updateStatus(e.target.value)} sx={{ mb: 3 }}>
        {["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((s) => <MenuItem key={s} value={s}>{s.replace("_", " ")}</MenuItem>)}
      </Select>

      {assignError && <Alert severity="error" sx={{ mb: 2 }}>{assignError}</Alert>}

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Driver</Typography>
            <Select fullWidth size="small" displayEmpty value={trip.driverId ?? ""} onChange={(e) => assign("driverId", e.target.value)}>
              <MenuItem value="">Unassigned</MenuItem>
              {drivers.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
            </Select>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Vehicle</Typography>
            <Select fullWidth size="small" displayEmpty value={trip.vehicleId ?? ""} onChange={(e) => assign("vehicleId", e.target.value)}>
              <MenuItem value="">Unassigned</MenuItem>
              {vehicles.map((v) => <MenuItem key={v.id} value={v.id}>{v.registrationNumber} ({v.vehicleType})</MenuItem>)}
            </Select>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Trip Details</Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}><TextField fullWidth label="Pickup" value={notes.pickup} onChange={(e) => setNotes({ ...notes, pickup: e.target.value })} /></Grid>
          <Grid item xs={6}><TextField fullWidth label="Drop" value={notes.drop} onChange={(e) => setNotes({ ...notes, drop: e.target.value })} /></Grid>
          <Grid item xs={12}><TextField fullWidth multiline rows={3} label="Itinerary Notes" value={notes.itineraryNotes} onChange={(e) => setNotes({ ...notes, itineraryNotes: e.target.value })} /></Grid>
        </Grid>
        <Button sx={{ mt: 2 }} variant="contained" onClick={saveNotes}>Save</Button>
      </Paper>
    </Box>
  );
}
