import { useEffect, useState } from "react";
import {
  Box, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Link,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { apiClient } from "../../api/client";

export function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", notes: "" });

  function load() {
    apiClient.get("/customers", { params: { search } }).then(({ data }) => setCustomers(data.data));
  }
  useEffect(load, [search]);

  async function handleCreate() {
    await apiClient.post("/customers", form);
    setOpen(false);
    setForm({ name: "", phone: "", email: "", address: "", notes: "" });
    load();
  }

  return (
    <Box p={4}>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h4">Customers</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>+ New Customer</Button>
      </Box>

      <TextField
        placeholder="Search by name, phone, or email" size="small" fullWidth sx={{ mb: 2, maxWidth: 400 }}
        value={search} onChange={(e) => setSearch(e.target.value)}
      />

      <Paper>
        <Table>
          <TableHead>
            <TableRow><TableCell>Name</TableCell><TableCell>Phone</TableCell><TableCell>Email</TableCell><TableCell /></TableRow>
          </TableHead>
          <TableBody>
            {customers.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.phone}</TableCell>
                <TableCell>{c.email ?? "—"}</TableCell>
                <TableCell><Link component={RouterLink} to={`/app/customers/${c.id}`}>View</Link></TableCell>
              </TableRow>
            ))}
            {customers.length === 0 && <TableRow><TableCell colSpan={4}>No customers yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New Customer</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <TextField label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <TextField label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <TextField label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <TextField label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} multiline rows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!form.name || !form.phone}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
