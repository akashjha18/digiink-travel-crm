import { useEffect, useState } from "react";
import {
  Box, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Chip, Alert,
} from "@mui/material";
import { apiClient } from "../../api/client";

function expiryChip(date: string | null) {
  if (!date) return <Chip size="small" label="Not set" />;
  const days = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
  if (days < 0) return <Chip size="small" label={`Expired ${new Date(date).toLocaleDateString()}`} color="error" />;
  if (days <= 30) return <Chip size="small" label={`Expires in ${days}d`} color="warning" />;
  return <Chip size="small" label={new Date(date).toLocaleDateString()} />;
}

export function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    vehicleType: "", registrationNumber: "", capacity: 4,
    rcExpiry: "", insuranceExpiry: "", permitExpiry: "", assignedDriverId: "",
  });

  function load() {
    apiClient.get("/vehicles").then(({ data }) => setVehicles(data.data));
    apiClient.get("/vehicles/alerts/expiring").then(({ data }) => setAlerts(data.data)).catch(() => {});
    apiClient.get("/drivers").then(({ data }) => setDrivers(data.data)).catch(() => {});
  }
  useEffect(load, []);

  async function handleCreate() {
    await apiClient.post("/vehicles", { ...form, capacity: Number(form.capacity) });
    setOpen(false);
    load();
  }

  return (
    <Box p={4}>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h4">Vehicles</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>+ Add Vehicle</Button>
      </Box>

      {alerts.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {alerts.length} vehicle{alerts.length > 1 ? "s have" : " has"} a document expiring within 30 days or already expired.
        </Alert>
      )}

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Registration</TableCell><TableCell>Type</TableCell><TableCell>Capacity</TableCell>
              <TableCell>RC</TableCell><TableCell>Insurance</TableCell><TableCell>Permit</TableCell><TableCell>Assigned Driver</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vehicles.map((v) => (
              <TableRow key={v.id}>
                <TableCell>{v.registrationNumber}</TableCell>
                <TableCell>{v.vehicleType}</TableCell>
                <TableCell>{v.capacity}</TableCell>
                <TableCell>{expiryChip(v.rcExpiry)}</TableCell>
                <TableCell>{expiryChip(v.insuranceExpiry)}</TableCell>
                <TableCell>{expiryChip(v.permitExpiry)}</TableCell>
                <TableCell>{v.assignedDriver?.name ?? "Unassigned"}</TableCell>
              </TableRow>
            ))}
            {vehicles.length === 0 && <TableRow><TableCell colSpan={7}>No vehicles yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add Vehicle</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField label="Vehicle Type" placeholder="e.g. Sedan, SUV, Tempo Traveller" value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })} />
          <TextField label="Registration Number" value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} />
          <TextField label="Capacity" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) as any })} />
          <TextField label="RC Expiry" type="date" InputLabelProps={{ shrink: true }} value={form.rcExpiry} onChange={(e) => setForm({ ...form, rcExpiry: e.target.value })} />
          <TextField label="Insurance Expiry" type="date" InputLabelProps={{ shrink: true }} value={form.insuranceExpiry} onChange={(e) => setForm({ ...form, insuranceExpiry: e.target.value })} />
          <TextField label="Permit Expiry" type="date" InputLabelProps={{ shrink: true }} value={form.permitExpiry} onChange={(e) => setForm({ ...form, permitExpiry: e.target.value })} />
          <TextField select label="Assigned Driver (optional)" value={form.assignedDriverId} onChange={(e) => setForm({ ...form, assignedDriverId: e.target.value })}>
            <MenuItem value="">None</MenuItem>
            {drivers.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!form.vehicleType || !form.registrationNumber}>Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
