import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Box, Typography, Paper, Chip, Button, Grid, Table, TableHead, TableRow,
  TableCell, TableBody, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
} from "@mui/material";
import { apiClient } from "../../api/client";

export function ClientDetailPage() {
  const { id } = useParams();
  const [client, setClient] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [payDialog, setPayDialog] = useState(false);
  const [payForm, setPayForm] = useState({
    amountInPaise: 0, date: new Date().toISOString().slice(0, 10), mode: "UPI",
    reference: "", note: "", newSubscriptionExpiry: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
  });
  const [resetResult, setResetResult] = useState<{ userId: string; password: string } | null>(null);

  function load() {
    apiClient.get(`/super-admin/clients/${id}`).then(({ data }) => setClient(data.data));
    apiClient.get(`/super-admin/clients/${id}/usage`).then(({ data }) => setUsage(data.data)).catch(() => {});
    apiClient.get(`/super-admin/clients/${id}/users`).then(({ data }) => setUsers(data.data)).catch(() => {});
  }
  useEffect(load, [id]);

  async function confirmPayment() {
    await apiClient.post(`/super-admin/clients/${id}/confirm-payment`, payForm);
    setPayDialog(false);
    load();
  }

  async function action(path: string, body: Record<string, unknown> = {}) {
    await apiClient.post(`/super-admin/clients/${id}/${path}`, body);
    load();
  }

  async function forceReset(userId: string) {
    const { data } = await apiClient.post(`/super-admin/clients/${id}/users/${userId}/force-password-reset`);
    setResetResult({ userId, password: data.data.temporaryPassword });
  }

  if (!client) return <Box p={4}>Loading…</Box>;

  return (
    <Box p={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h4">{client.businessName}</Typography>
          <Typography color="text.secondary">{client.clientCode} · {client.email} · {client.plan?.name}</Typography>
        </Box>
        <Chip label={client.subscriptionStatus} color={client.subscriptionStatus === "ACTIVE" ? "success" : "warning"} />
      </Box>

      <Box display="flex" gap={1} mb={3} flexWrap="wrap">
        <Button variant="outlined" onClick={() => action("activate")}>Activate</Button>
        <Button variant="outlined" color="error" onClick={() => action("deactivate")}>Deactivate / Lock</Button>
        <Button variant="outlined" onClick={() => action("extend-grace", { days: 3 })}>Extend Grace +3 days</Button>
        <Button variant="contained" onClick={() => setPayDialog(true)}>Confirm Payment</Button>
        <Button variant="outlined" color="error"
          onClick={() => { if (confirm("This marks the client as DELETED. Their rows are retained (see ARCHITECTURE.md). Continue?")) action("delete"); }}>
          Delete Client
        </Button>
      </Box>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Usage</Typography>
            {usage ? (
              <>
                <Typography>Users: {usage.users.used} / {usage.users.limit ?? "Unlimited"}</Typography>
                <Typography>Enquiries this month: {usage.enquiriesThisMonth.used} / {usage.enquiriesThisMonth.limit ?? "Unlimited"}</Typography>
              </>
            ) : <Typography color="text.secondary">Not available</Typography>}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Subscription</Typography>
            <Typography>Start: {new Date(client.subscriptionStart).toLocaleDateString()}</Typography>
            <Typography>Expiry: {new Date(client.subscriptionExpiry).toLocaleDateString()}</Typography>
            {client.graceEndsAt && <Typography>Grace ends: {new Date(client.graceEndsAt).toLocaleDateString()}</Typography>}
          </Paper>
        </Grid>
      </Grid>

      <Typography variant="h6" gutterBottom>Staff</Typography>
      <Paper sx={{ mb: 3 }}>
        <Table>
          <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Email</TableCell><TableCell>Role</TableCell><TableCell>Status</TableCell><TableCell /></TableRow></TableHead>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.name}{u.isClientAdmin && <Chip size="small" label="Admin" sx={{ ml: 1 }} />}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.role?.name}</TableCell>
                <TableCell>{u.isActive ? "Active" : "Deactivated"}</TableCell>
                <TableCell>
                  <Button size="small" onClick={() => forceReset(u.id)}>Force Password Reset</Button>
                  {resetResult?.userId === u.id && (
                    <Typography variant="caption" display="block" color="success.main">New temp password: {resetResult.password}</Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && <TableRow><TableCell colSpan={5}>No staff yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>

      <Typography variant="h6" gutterBottom>Payment History</Typography>
      <Paper sx={{ mb: 3 }}>
        <Table>
          <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Amount</TableCell><TableCell>Mode</TableCell><TableCell>Reference</TableCell></TableRow></TableHead>
          <TableBody>
            {client.paymentLogs?.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell>{new Date(p.date).toLocaleDateString()}</TableCell>
                <TableCell>₹{(p.amountInPaise / 100).toLocaleString()}</TableCell>
                <TableCell>{p.mode}</TableCell>
                <TableCell>{p.reference ?? "—"}</TableCell>
              </TableRow>
            ))}
            {(!client.paymentLogs || client.paymentLogs.length === 0) && <TableRow><TableCell colSpan={4}>No payments recorded yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={payDialog} onClose={() => setPayDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Confirm Manual Payment</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField label="Amount (₹)" type="number" onChange={(e) => setPayForm({ ...payForm, amountInPaise: Number(e.target.value) * 100 })} />
          <TextField label="Date" type="date" value={payForm.date} onChange={(e) => setPayForm({ ...payForm, date: e.target.value })} InputLabelProps={{ shrink: true }} />
          <TextField select label="Mode" value={payForm.mode} onChange={(e) => setPayForm({ ...payForm, mode: e.target.value })}>
            {["CASH", "UPI", "BANK_TRANSFER", "CHEQUE"].map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
          </TextField>
          <TextField label="Reference" value={payForm.reference} onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })} />
          <TextField label="Note" value={payForm.note} onChange={(e) => setPayForm({ ...payForm, note: e.target.value })} />
          <TextField label="New Subscription Expiry" type="date" value={payForm.newSubscriptionExpiry} onChange={(e) => setPayForm({ ...payForm, newSubscriptionExpiry: e.target.value })} InputLabelProps={{ shrink: true }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={confirmPayment}>Confirm & Reactivate</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
