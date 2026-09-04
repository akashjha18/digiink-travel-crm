import { useEffect, useState } from "react";
import {
  Box, Typography, Button, Paper, Table, TableHead, TableRow, TableCell,
  TableBody, Switch, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Tabs, Tab,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { apiClient } from "../../api/client";

const TRIGGER_LABELS: Record<string, string> = {
  ENQUIRY_NO_CONTACT_WITHIN_HOURS: "Enquiry not contacted within X hours",
  QUOTATION_NOT_FOLLOWED_UP: "Quotation sent but not followed up within X days",
  BOOKING_PAYMENT_OVERDUE: "Booking payment overdue",
  VEHICLE_DOCUMENT_EXPIRING: "Vehicle document expiring within X days",
};

const ACTION_LABELS: Record<string, string> = {
  EMAIL_STAFF: "Email a staff member",
  CREATE_FOLLOWUP_NOTE: "Add an automatic note to the enquiry",
  REASSIGN_ENQUIRY: "Reassign the enquiry",
};

// No-code rule builder (SRS section 11/FR-11). Rules are evaluated by a
// background sweep every 15 minutes (see jobs/automation-engine.job.ts on
// the backend) — not instantly on the triggering event, since there's no
// real-time event bus wired up.
export function AutomationPage() {
  const [tab, setTab] = useState(0);
  const [rules, setRules] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", triggerType: "ENQUIRY_NO_CONTACT_WITHIN_HOURS", triggerValue: 2,
    actionType: "EMAIL_STAFF", recipient: "CLIENT_ADMIN", userId: "", toUserId: "",
  });

  function load() {
    apiClient.get("/automation/rules").then(({ data }) => setRules(data.data));
    apiClient.get("/automation/logs").then(({ data }) => setLogs(data.data));
  }
  useEffect(load, []);
  useEffect(() => { apiClient.get("/users").then(({ data }) => setStaff(data.data)); }, []);

  function triggerConfig() {
    if (form.triggerType === "VEHICLE_DOCUMENT_EXPIRING") return { days: form.triggerValue };
    if (form.triggerType === "QUOTATION_NOT_FOLLOWED_UP") return { days: form.triggerValue };
    if (form.triggerType === "ENQUIRY_NO_CONTACT_WITHIN_HOURS") return { hours: form.triggerValue };
    return {};
  }

  function actionConfig() {
    if (form.actionType === "EMAIL_STAFF") {
      return form.recipient === "SPECIFIC_USER" ? { recipient: form.recipient, userId: form.userId } : { recipient: form.recipient };
    }
    if (form.actionType === "REASSIGN_ENQUIRY") return { toUserId: form.toUserId };
    return {};
  }

  async function handleCreate() {
    await apiClient.post("/automation/rules", {
      name: form.name, triggerType: form.triggerType, triggerConfig: triggerConfig(),
      actionType: form.actionType, actionConfig: actionConfig(),
    });
    setOpen(false);
    setForm({ ...form, name: "" });
    load();
  }

  async function toggleActive(rule: any) {
    await apiClient.patch(`/automation/rules/${rule.id}`, { isActive: !rule.isActive });
    load();
  }

  async function remove(id: string) {
    await apiClient.delete(`/automation/rules/${id}`);
    load();
  }

  const needsHoursOrDays = ["ENQUIRY_NO_CONTACT_WITHIN_HOURS", "QUOTATION_NOT_FOLLOWED_UP", "VEHICLE_DOCUMENT_EXPIRING"].includes(form.triggerType);
  const unit = form.triggerType === "ENQUIRY_NO_CONTACT_WITHIN_HOURS" ? "hours" : "days";

  return (
    <Box p={4}>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h4">Workflow Automation</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>+ New Rule</Button>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Rules" /><Tab label="Execution Log" />
      </Tabs>

      {tab === 0 && (
        <Paper>
          <Table>
            <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Trigger</TableCell><TableCell>Action</TableCell><TableCell>Active</TableCell><TableCell /></TableRow></TableHead>
            <TableBody>
              {rules.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>{TRIGGER_LABELS[r.triggerType]}</TableCell>
                  <TableCell>{ACTION_LABELS[r.actionType]}</TableCell>
                  <TableCell><Switch checked={r.isActive} onChange={() => toggleActive(r)} /></TableCell>
                  <TableCell><IconButton size="small" onClick={() => remove(r.id)}><DeleteIcon fontSize="small" /></IconButton></TableCell>
                </TableRow>
              ))}
              {rules.length === 0 && <TableRow><TableCell colSpan={5}>No rules yet — e.g. "if enquiry not contacted within 2 hours, alert manager".</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Paper>
      )}

      {tab === 1 && (
        <Paper>
          <Table>
            <TableHead><TableRow><TableCell>Time</TableCell><TableCell>Rule</TableCell><TableCell>Target</TableCell><TableCell>Detail</TableCell></TableRow></TableHead>
            <TableBody>
              {logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{new Date(l.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{l.rule?.name}</TableCell>
                  <TableCell>{l.targetType} · {l.targetId.slice(0, 8)}</TableCell>
                  <TableCell>{l.message}</TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && <TableRow><TableCell colSpan={4}>No rules have fired yet. The engine sweeps every 15 minutes.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New Automation Rule</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField label="Rule Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

          <TextField select label="Trigger" value={form.triggerType} onChange={(e) => setForm({ ...form, triggerType: e.target.value })}>
            {Object.entries(TRIGGER_LABELS).map(([key, label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}
          </TextField>
          {needsHoursOrDays && (
            <TextField label={`Threshold (${unit})`} type="number" value={form.triggerValue} onChange={(e) => setForm({ ...form, triggerValue: Number(e.target.value) })} />
          )}

          <TextField select label="Action" value={form.actionType} onChange={(e) => setForm({ ...form, actionType: e.target.value })}>
            {Object.entries(ACTION_LABELS).map(([key, label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}
          </TextField>

          {form.actionType === "EMAIL_STAFF" && (
            <>
              <TextField select label="Notify" value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })}>
                <MenuItem value="CLIENT_ADMIN">Client Admin</MenuItem>
                <MenuItem value="ASSIGNED_STAFF">Whoever the enquiry is assigned to</MenuItem>
                <MenuItem value="SPECIFIC_USER">A specific staff member</MenuItem>
              </TextField>
              {form.recipient === "SPECIFIC_USER" && (
                <TextField select label="Staff Member" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
                  {staff.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                </TextField>
              )}
            </>
          )}

          {form.actionType === "REASSIGN_ENQUIRY" && (
            <TextField select label="Reassign To" value={form.toUserId} onChange={(e) => setForm({ ...form, toUserId: e.target.value })}>
              {staff.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </TextField>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!form.name}>Create Rule</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
