import { useEffect, useState } from "react";
import {
  Box, Typography, Button, Paper, Table, TableHead, TableRow, TableCell,
  TableBody, Grid, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, Chip,
} from "@mui/material";
import { apiClient } from "../../api/client";

// Multi-Branch (SRS FR-12.1, Enterprise only): manage branches, assign
// staff to them, and see the rolled-up cross-branch dashboard.
export function BranchesPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [rollup, setRollup] = useState<any>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", address: "" });

  function load() {
    apiClient.get("/branches").then(({ data }) => setBranches(data.data));
    apiClient.get("/branches/rollup").then(({ data }) => setRollup(data.data));
    apiClient.get("/users").then(({ data }) => setStaff(data.data));
  }
  useEffect(load, []);

  async function handleCreate() {
    await apiClient.post("/branches", form);
    setOpen(false);
    setForm({ name: "", address: "" });
    load();
  }

  async function assignStaff(userId: string, branchId: string) {
    await apiClient.patch(`/branches/assign-user/${userId}`, { branchId: branchId || null });
    load();
  }

  return (
    <Box p={4}>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h4">Branches</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>+ New Branch</Button>
      </Box>

      <Typography variant="h6" gutterBottom>Rolled-Up Performance</Typography>
      <Grid container spacing={2} mb={3}>
        {rollup?.branches.map((b: any) => (
          <Grid item xs={12} sm={6} md={4} key={b.branchId}>
            <Paper sx={{ p: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle1">{b.branchName}</Typography>
                <Chip size="small" label={b.isActive ? "Active" : "Inactive"} color={b.isActive ? "success" : "default"} />
              </Box>
              <Typography variant="body2">Staff: {b.staffCount}</Typography>
              <Typography variant="body2">Enquiries: {b.enquiryCount} ({b.wonCount} won)</Typography>
              <Typography variant="body2">Bookings: {b.bookingCount}</Typography>
              <Typography variant="body2">Revenue: ₹{(b.revenueInPaise / 100).toLocaleString()}</Typography>
            </Paper>
          </Grid>
        ))}
        {rollup?.unassigned && (rollup.unassigned.enquiryCount > 0 || rollup.unassigned.bookingCount > 0) && (
          <Grid item xs={12} sm={6} md={4}>
            <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
              <Typography variant="subtitle1" gutterBottom>Not yet assigned to a branch</Typography>
              <Typography variant="body2">Enquiries: {rollup.unassigned.enquiryCount}</Typography>
              <Typography variant="body2">Bookings: {rollup.unassigned.bookingCount}</Typography>
              <Typography variant="body2">Revenue: ₹{(rollup.unassigned.revenueInPaise / 100).toLocaleString()}</Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      <Typography variant="h6" gutterBottom>Branches</Typography>
      <Paper sx={{ mb: 3 }}>
        <Table>
          <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Address</TableCell><TableCell>Staff</TableCell><TableCell>Enquiries</TableCell><TableCell>Bookings</TableCell></TableRow></TableHead>
          <TableBody>
            {branches.map((b) => (
              <TableRow key={b.id}>
                <TableCell>{b.name}</TableCell>
                <TableCell>{b.address ?? "—"}</TableCell>
                <TableCell>{b._count.users}</TableCell>
                <TableCell>{b._count.enquiries}</TableCell>
                <TableCell>{b._count.bookings}</TableCell>
              </TableRow>
            ))}
            {branches.length === 0 && <TableRow><TableCell colSpan={5}>No branches yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>

      <Typography variant="h6" gutterBottom>Assign Staff to Branches</Typography>
      <Paper>
        <Table>
          <TableHead><TableRow><TableCell>Staff</TableCell><TableCell>Branch</TableCell></TableRow></TableHead>
          <TableBody>
            {staff.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.name}</TableCell>
                <TableCell>
                  <Select size="small" displayEmpty value={s.branchId ?? ""} onChange={(e) => assignStaff(s.id, e.target.value)} sx={{ minWidth: 200 }}>
                    <MenuItem value="">Unassigned</MenuItem>
                    {branches.map((b) => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New Branch</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField label="Branch Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!form.name}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
