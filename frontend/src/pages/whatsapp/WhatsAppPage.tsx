import { useEffect, useState } from "react";
import {
  Box, Typography, Paper, TextField, Button, Switch, FormControlLabel,
  Table, TableHead, TableRow, TableCell, TableBody, Chip, Alert,
} from "@mui/material";
import { apiClient } from "../../api/client";

// WhatsApp Business API integration (SRS FR-12.2, Enterprise only).
// Honest state: there is no live Meta connection here — see the banner
// below and backend/src/whatsapp/whatsapp.service.ts for exactly why.
// This page lets you save the config Meta will eventually need, and
// shows the message log the backend maintains regardless.
export function WhatsAppPage() {
  const [config, setConfig] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [form, setForm] = useState({ phoneNumberId: "", businessAccountId: "", accessToken: "", webhookVerifyToken: "", isActive: false });
  const [sendForm, setSendForm] = useState({ toNumber: "", body: "" });
  const [sendResult, setSendResult] = useState<string | null>(null);

  function load() {
    apiClient.get("/whatsapp/config").then(({ data }) => {
      if (data.data) {
        setConfig(data.data);
        setForm({
          phoneNumberId: data.data.phoneNumberId ?? "", businessAccountId: data.data.businessAccountId ?? "",
          accessToken: "", webhookVerifyToken: data.data.webhookVerifyToken ?? "", isActive: data.data.isActive,
        });
      }
    });
    apiClient.get("/whatsapp/messages").then(({ data }) => setMessages(data.data));
  }
  useEffect(load, []);

  async function saveConfig() {
    await apiClient.post("/whatsapp/config", form);
    load();
  }

  async function sendTest() {
    setSendResult(null);
    const { data } = await apiClient.post("/whatsapp/send", sendForm);
    setSendResult(data.message);
    load();
  }

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>WhatsApp Business Integration</Typography>

      <Alert severity="warning" sx={{ mb: 3 }}>
        This is not yet connected to a real WhatsApp Business account. Sending a message here logs it and simulates
        delivery — nothing is actually sent to a phone. Connecting requires a Meta Business Account, an approved
        WhatsApp Business app, a verified phone number, and a permanent access token, all of which have to be
        obtained directly from Meta before this can go live.
      </Alert>

      <Paper sx={{ p: 3, mb: 3, maxWidth: 500 }}>
        <Typography variant="h6" gutterBottom>Configuration</Typography>
        <TextField fullWidth margin="dense" label="Phone Number ID" value={form.phoneNumberId} onChange={(e) => setForm({ ...form, phoneNumberId: e.target.value })} />
        <TextField fullWidth margin="dense" label="Business Account ID" value={form.businessAccountId} onChange={(e) => setForm({ ...form, businessAccountId: e.target.value })} />
        <TextField fullWidth margin="dense" label="Access Token" type="password" placeholder={config?.hasAccessToken ? "•••••••• (saved)" : ""} value={form.accessToken} onChange={(e) => setForm({ ...form, accessToken: e.target.value })} />
        <TextField fullWidth margin="dense" label="Webhook Verify Token" value={form.webhookVerifyToken} onChange={(e) => setForm({ ...form, webhookVerifyToken: e.target.value })} />
        <FormControlLabel sx={{ mt: 1 }} control={<Switch checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />} label="Mark as active once real credentials are in place" />
        <Box mt={2}><Button variant="contained" onClick={saveConfig}>Save</Button></Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 3, maxWidth: 500 }}>
        <Typography variant="h6" gutterBottom>Send a Test Message</Typography>
        <TextField fullWidth margin="dense" label="To (phone number)" value={sendForm.toNumber} onChange={(e) => setSendForm({ ...sendForm, toNumber: e.target.value })} />
        <TextField fullWidth margin="dense" label="Message" multiline rows={2} value={sendForm.body} onChange={(e) => setSendForm({ ...sendForm, body: e.target.value })} />
        <Box mt={1}><Button variant="outlined" onClick={sendTest} disabled={!sendForm.toNumber || !sendForm.body}>Send</Button></Box>
        {sendResult && <Alert severity="info" sx={{ mt: 2 }}>{sendResult}</Alert>}
      </Paper>

      <Typography variant="h6" gutterBottom>Message Log</Typography>
      <Paper>
        <Table>
          <TableHead><TableRow><TableCell>Time</TableCell><TableCell>Direction</TableCell><TableCell>From</TableCell><TableCell>To</TableCell><TableCell>Message</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
          <TableBody>
            {messages.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{new Date(m.createdAt).toLocaleString()}</TableCell>
                <TableCell><Chip size="small" label={m.direction} /></TableCell>
                <TableCell>{m.fromNumber}</TableCell>
                <TableCell>{m.toNumber}</TableCell>
                <TableCell>{m.body}</TableCell>
                <TableCell>{m.status}</TableCell>
              </TableRow>
            ))}
            {messages.length === 0 && <TableRow><TableCell colSpan={6}>No messages yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
