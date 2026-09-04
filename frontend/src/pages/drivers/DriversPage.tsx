import { useEffect, useState } from "react";
import {
  Box, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip, Switch,
} from "@mui/material";
import { apiClient } from "../../api/client";

export function DriversPage() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", licenseNumber: "", contact: "" });

  function load() {
    apiClient.get("/drivers").then(({ data }) => setDrivers(data.data));
  }
  useEffect(load, []);

  async function handleCreate() {
    await apiClient.post("/drivers", form);
    setOpen(false);
    setForm({ name: "", licenseNumber: "", contact: "" });
    load();
  }

  async function toggleAvailable(driver: any) {
    await apiClient.patch(`/drivers/${driver.id}`, { isAvailable: !driver.isAvailable });
    load();
  }

  return (
    <Box p={4}>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h4">Drivers</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>+ Add Driver</Button>
      </Box>

      <Paper>
        <Table>
          <TableHead><TableRow><TableCell>Name</TableCell><TableCell>License No.</TableCell><TableCell>Contact</TableCell><TableCell>Vehicles</TableCell><TableCell>Available</TableCell></TableRow></TableHead>
          <TableBody>
            {drivers.map((d) => (
              <TableRow key={d.id}>
                <TableCell>{d.name}</TableCell>
                <TableCell>{d.licenseNumber}</TableCell>
                <TableCell>{d.contact}</TableCell>
                <TableCell>{d.vehicles?.map((v: any) => v.registrationNumber).join(", ") || "—"}</TableCell>
                <TableCell>
                  <Switch checked={d.isAvailable} onChange={() => toggleAvailable(d)} />
                  <Chip size="small" label={d.isAvailable ? "Available" : "Unavailable"} color={d.isAvailable ? "success" : "default"} />
                </TableCell>
              </TableRow>
            ))}
            {drivers.length === 0 && <TableRow><TableCell colSpan={5}>No drivers yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add Driver</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField label="License Number" value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} />
          <TextField label="Contact" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!form.name || !form.licenseNumber || !form.contact}>Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
