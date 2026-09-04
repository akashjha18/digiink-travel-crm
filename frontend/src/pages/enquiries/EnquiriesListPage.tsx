import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Link, Chip, Select,
} from "@mui/material";
import { apiClient } from "../../api/client";

const STAGES = ["NEW", "CONTACTED", "QUOTED", "NEGOTIATION", "WON", "LOST"];

export function EnquiriesListPage() {
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    customerId: "", newCustomerName: "", newCustomerPhone: "",
    source: "", destination: "", assignTo: "NONE" as "NONE" | "MANUAL" | "ROUND_ROBIN", assignedToId: "",
  });
  const [useExisting, setUseExisting] = useState(true);

  function load() {
    apiClient.get("/enquiries", { params: statusFilter ? { status: statusFilter } : {} }).then(({ data }) => setEnquiries(data.data));
  }
  useEffect(load, [statusFilter]);
  useEffect(() => {
    apiClient.get("/customers").then(({ data }) => setCustomers(data.data));
    apiClient.get("/users").then(({ data }) => setStaff(data.data));
  }, []);

  async function handleCreate() {
    const payload: any = {
      source: form.source || undefined,
      destination: form.destination || undefined,
      assignTo: form.assignTo,
      assignedToId: form.assignTo === "MANUAL" ? form.assignedToId : undefined,
    };
    if (useExisting) {
      payload.customerId = form.customerId;
    } else {
      payload.newCustomer = { name: form.newCustomerName, phone: form.newCustomerPhone };
    }
    await apiClient.post("/enquiries", payload);
    setOpen(false);
    load();
  }

  return (
    <Box p={4}>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h4">Enquiries</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>+ New Enquiry</Button>
      </Box>

      <Select size="small" displayEmpty value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ mb: 2, minWidth: 180 }}>
        <MenuItem value="">All stages</MenuItem>
        {STAGES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
      </Select>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Customer</TableCell><TableCell>Destination</TableCell><TableCell>Source</TableCell>
              <TableCell>Assigned</TableCell><TableCell>Status</TableCell><TableCell>Created</TableCell><TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {enquiries.map((e) => (
              <TableRow key={e.id}>
                <TableCell>{e.customer?.name}</TableCell>
                <TableCell>{e.destination ?? "—"}</TableCell>
                <TableCell>{e.source ?? "—"}</TableCell>
                <TableCell>{e.assignedTo?.name ?? "Unassigned"}</TableCell>
                <TableCell><Chip size="small" label={e.status} /></TableCell>
                <TableCell>{new Date(e.createdAt).toLocaleDateString()}</TableCell>
                <TableCell><Link component={RouterLink} to={`/app/enquiries/${e.id}`}>View</Link></TableCell>
              </TableRow>
            ))}
            {enquiries.length === 0 && <TableRow><TableCell colSpan={7}>No enquiries yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New Enquiry</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <Box display="flex" gap={1}>
            <Button size="small" variant={useExisting ? "contained" : "outlined"} onClick={() => setUseExisting(true)}>Existing customer</Button>
            <Button size="small" variant={!useExisting ? "contained" : "outlined"} onClick={() => setUseExisting(false)}>New customer</Button>
          </Box>

          {useExisting ? (
            <TextField select label="Customer" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
              {customers.map((c) => <MenuItem key={c.id} value={c.id}>{c.name} — {c.phone}</MenuItem>)}
            </TextField>
          ) : (
            <>
              <TextField label="Customer Name" value={form.newCustomerName} onChange={(e) => setForm({ ...form, newCustomerName: e.target.value })} />
              <TextField label="Customer Phone" value={form.newCustomerPhone} onChange={(e) => setForm({ ...form, newCustomerPhone: e.target.value })} />
            </>
          )}

          <TextField label="Source" placeholder="e.g. Website, Referral, WhatsApp" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
          <TextField label="Destination" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />

          <TextField select label="Assignment" value={form.assignTo} onChange={(e) => setForm({ ...form, assignTo: e.target.value as any })}>
            <MenuItem value="NONE">Leave unassigned</MenuItem>
            <MenuItem value="MANUAL">Assign to a specific staff member</MenuItem>
            <MenuItem value="ROUND_ROBIN">Auto-assign (round robin)</MenuItem>
          </TextField>
          {form.assignTo === "MANUAL" && (
            <TextField select label="Staff Member" value={form.assignedToId} onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}>
              {staff.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </TextField>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}
            disabled={useExisting ? !form.customerId : !form.newCustomerName || !form.newCustomerPhone}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
