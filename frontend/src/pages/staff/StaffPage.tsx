import { useEffect, useState } from "react";
import {
  Box, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Paper, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
} from "@mui/material";
import { apiClient } from "../../api/client";

export function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", roleId: "" });
  const [createdCreds, setCreatedCreds] = useState<{ email: string; password: string } | null>(null);

  function load() {
    apiClient.get("/users/staff").then(({ data }) => setStaff(data.data));
    apiClient.get("/roles").then(({ data }) => setRoles(data.data));
  }
  useEffect(load, []);

  async function handleCreate() {
    const { data } = await apiClient.post("/users/staff", form);
    setCreatedCreds({ email: form.email, password: data.data.temporaryPassword });
    load();
  }

  async function toggleActive(u: any) {
    await apiClient.patch(`/users/staff/${u.id}`, { isActive: !u.isActive });
    load();
  }

  return (
    <Box p={4}>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h4">Staff</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>+ Add Staff</Button>
      </Box>

      <Paper>
        <Table>
          <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Email</TableCell><TableCell>Role</TableCell><TableCell>Status</TableCell><TableCell /></TableRow></TableHead>
          <TableBody>
            {staff.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.name}{u.isClientAdmin && <Chip size="small" label="Admin" sx={{ ml: 1 }} />}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.role?.name}</TableCell>
                <TableCell>{u.isActive ? "Active" : "Deactivated"}</TableCell>
                <TableCell>
                  {!u.isClientAdmin && (
                    <Button size="small" onClick={() => toggleActive(u)}>{u.isActive ? "Deactivate" : "Reactivate"}</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => { setOpen(false); setCreatedCreds(null); }} fullWidth maxWidth="sm">
        <DialogTitle>Add Staff Member</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          {createdCreds ? (
            <Box>
              <Typography>Staff member created: <b>{createdCreds.email}</b></Typography>
              <Typography>Temporary password: <b>{createdCreds.password}</b></Typography>
            </Box>
          ) : (
            <>
              <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <TextField label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <TextField select label="Role" value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })}>
                {roles.map((r) => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
              </TextField>
            </>
          )}
        </DialogContent>
        <DialogActions>
          {createdCreds ? (
            <Button onClick={() => { setOpen(false); setCreatedCreds(null); }}>Close</Button>
          ) : (
            <>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="contained" onClick={handleCreate} disabled={!form.name || !form.email || !form.roleId}>Create</Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
