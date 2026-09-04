import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Link,
} from "@mui/material";
import { apiClient } from "../../api/client";

interface ClientRow {
  id: string; clientCode: string; businessName: string; email: string;
  subscriptionStatus: string; subscriptionExpiry: string; plan: { name: string };
}

const STATUS_COLOR: Record<string, "success" | "warning" | "error" | "default"> = {
  ACTIVE: "success", EXPIRING_SOON: "warning", GRACE: "warning", LOCKED: "error", DELETED: "default",
};

export function ClientsListPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [plans, setPlans] = useState<Array<{ id: string; name: string }>>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    businessName: "", ownerName: "", email: "", phone: "", planId: "",
    subscriptionStart: new Date().toISOString().slice(0, 10),
    subscriptionExpiry: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
  });
  const [createdCreds, setCreatedCreds] = useState<{ clientCode: string; temporaryPassword: string } | null>(null);

  function load() {
    apiClient.get("/super-admin/clients").then(({ data }) => setClients(data.data));
    apiClient.get("/super-admin/plans").then(({ data }) => setPlans(data.data));
  }
  useEffect(load, []);

  async function handleCreate() {
    const { data } = await apiClient.post("/super-admin/clients", form);
    setCreatedCreds({ clientCode: data.data.client.clientCode, temporaryPassword: data.data.temporaryPassword });
    load();
  }

  return (
    <Box p={4}>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h4">Clients</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>+ New Client</Button>
      </Box>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Client Code</TableCell><TableCell>Business</TableCell>
              <TableCell>Plan</TableCell><TableCell>Status</TableCell>
              <TableCell>Expiry</TableCell><TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {clients.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.clientCode}</TableCell>
                <TableCell>{c.businessName}<br /><Typography variant="caption" color="text.secondary">{c.email}</Typography></TableCell>
                <TableCell>{c.plan?.name}</TableCell>
                <TableCell><Chip size="small" label={c.subscriptionStatus} color={STATUS_COLOR[c.subscriptionStatus]} /></TableCell>
                <TableCell>{new Date(c.subscriptionExpiry).toLocaleDateString()}</TableCell>
                <TableCell><Link component={RouterLink} to={`/super-admin/clients/${c.id}`}>View</Link></TableCell>
              </TableRow>
            ))}
            {clients.length === 0 && <TableRow><TableCell colSpan={6}>No clients yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => { setOpen(false); setCreatedCreds(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>Create Client</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          {createdCreds ? (
            <Box>
              <Typography>Client provisioned: <b>{createdCreds.clientCode}</b></Typography>
              <Typography>Temporary password: <b>{createdCreds.temporaryPassword}</b></Typography>
              <Typography variant="caption" color="text.secondary">Share these with the client (a welcome email will also be sent once SMTP is configured).</Typography>
            </Box>
          ) : (
            <>
              <TextField label="Business Name" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
              <TextField label="Owner Name" value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} />
              <TextField label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <TextField label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <TextField select label="Plan" value={form.planId} onChange={(e) => setForm({ ...form, planId: e.target.value })}>
                {plans.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
              </TextField>
              <TextField label="Subscription Start" type="date" value={form.subscriptionStart} onChange={(e) => setForm({ ...form, subscriptionStart: e.target.value })} InputLabelProps={{ shrink: true }} />
              <TextField label="Subscription Expiry" type="date" value={form.subscriptionExpiry} onChange={(e) => setForm({ ...form, subscriptionExpiry: e.target.value })} InputLabelProps={{ shrink: true }} />
            </>
          )}
        </DialogContent>
        <DialogActions>
          {createdCreds ? (
            <Button onClick={() => { setOpen(false); setCreatedCreds(null); }}>Close</Button>
          ) : (
            <>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="contained" onClick={handleCreate}>Create Client</Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
