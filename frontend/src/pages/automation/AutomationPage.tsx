import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Switch,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Tabs,
  Tab,
  Chip,
  Avatar,
  Tooltip,
} from "@mui/material";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import NotificationImportantRoundedIcon from "@mui/icons-material/NotificationImportantRounded";
import { apiClient } from "../../api/client";

const TRIGGER_LABELS: Record<string, string> = {
  ENQUIRY_NO_CONTACT_WITHIN_HOURS: "Lead not contacted within X hours",
  QUOTATION_NOT_FOLLOWED_UP: "Quotation sent but not followed up within X days",
  BOOKING_PAYMENT_OVERDUE: "Booking payment overdue",
  VEHICLE_DOCUMENT_EXPIRING: "Vehicle document expiring within X days",
};

const ACTION_LABELS: Record<string, string> = {
  EMAIL_STAFF: "Email a staff member",
  CREATE_FOLLOWUP_NOTE: "Add an automatic note to the lead",
  REASSIGN_ENQUIRY: "Reassign the lead",
};

export function AutomationPage() {
  const [tab, setTab] = useState(0);
  const [rules, setRules] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    triggerType: "ENQUIRY_NO_CONTACT_WITHIN_HOURS",
    triggerValue: 2,
    actionType: "EMAIL_STAFF",
    recipient: "CLIENT_ADMIN",
    userId: "",
    toUserId: "",
  });

  function load() {
    apiClient.get("/automation/rules").then(({ data }) => setRules(data.data ?? []));
    apiClient.get("/automation/logs").then(({ data }) => setLogs(data.data ?? []));
  }
  useEffect(load, []);
  useEffect(() => {
    apiClient.get("/users").then(({ data }) => setStaff(data.data ?? []));
  }, []);

  function triggerConfig() {
    if (form.triggerType === "VEHICLE_DOCUMENT_EXPIRING") return { days: form.triggerValue };
    if (form.triggerType === "QUOTATION_NOT_FOLLOWED_UP") return { days: form.triggerValue };
    if (form.triggerType === "ENQUIRY_NO_CONTACT_WITHIN_HOURS") return { hours: form.triggerValue };
    return {};
  }

  function actionConfig() {
    if (form.actionType === "EMAIL_STAFF") {
      return form.recipient === "SPECIFIC_USER"
        ? { recipient: form.recipient, userId: form.userId }
        : { recipient: form.recipient };
    }
    if (form.actionType === "REASSIGN_ENQUIRY") return { toUserId: form.toUserId };
    return {};
  }

  async function handleCreate() {
    await apiClient.post("/automation/rules", {
      name: form.name,
      triggerType: form.triggerType,
      triggerConfig: triggerConfig(),
      actionType: form.actionType,
      actionConfig: actionConfig(),
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
    if (!window.confirm("Are you sure you want to remove this automation trigger?")) return;
    await apiClient.delete(`/automation/rules/${id}`);
    load();
  }

  const needsHoursOrDays = [
    "ENQUIRY_NO_CONTACT_WITHIN_HOURS",
    "QUOTATION_NOT_FOLLOWED_UP",
    "VEHICLE_DOCUMENT_EXPIRING",
  ].includes(form.triggerType);
  const unit = form.triggerType === "ENQUIRY_NO_CONTACT_WITHIN_HOURS" ? "hours" : "days";

  const activeCount = useMemo(() => rules.filter((r) => r.isActive).length, [rules]);

  return (
    <Box sx={{ p: { xs: 2.5, md: 4.5 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      {/* Top Header */}
      <Box
        display="flex"
        flexDirection={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        gap={2}
        mb={3}
      >
        <Box>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Typography variant="h4" fontWeight={900} sx={{ color: "#0f172a", letterSpacing: "-0.03em" }}>
              Workflow Automation
            </Typography>
            <Chip
              label={`${activeCount}/${rules.length} Active Triggers`}
              size="small"
              icon={<BoltRoundedIcon style={{ fontSize: 14 }} />}
              sx={{
                bgcolor: "rgba(2, 132, 199, 0.1)",
                color: "#0284c7",
                fontWeight: 800,
                fontSize: "0.72rem",
                borderRadius: "6px",
                border: "1px solid rgba(2, 132, 199, 0.2)",
              }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            No-code autonomous SLA alerts, reassignments, and document expiration triggers evaluated every 15m.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => setOpen(true)}
          sx={{
            background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
            borderRadius: 2.5,
            px: 2.75,
            py: 1,
            textTransform: "none",
            fontWeight: 800,
            boxShadow: "0 4px 14px rgba(2, 132, 199, 0.35)",
            "&:hover": {
              background: "linear-gradient(135deg, #0369a1 0%, #075985 100%)",
              transform: "translateY(-1px)",
            },
          }}
        >
          New Automation Rule
        </Button>
      </Box>

      {/* KPI Stats Strip */}
      <Box
        display="grid"
        gridTemplateColumns={{ xs: "repeat(1, 1fr)", sm: "repeat(3, 1fr)" }}
        gap={2.5}
        mb={3}
      >
        <Paper
          sx={{
            p: 2.5,
            border: "1px solid #e2e8f0",
            borderRadius: 3,
            bgcolor: "#ffffff",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Avatar sx={{ bgcolor: "rgba(2, 132, 199, 0.1)", color: "#0284c7", borderRadius: 2.5, width: 46, height: 46 }}>
            <BoltRoundedIcon />
          </Avatar>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Registered Rules
            </Typography>
            <Typography variant="h5" fontWeight={900} color="#0f172a">
              {rules.length} Rules
            </Typography>
          </Box>
        </Paper>

        <Paper
          sx={{
            p: 2.5,
            border: "1px solid #e2e8f0",
            borderRadius: 3,
            bgcolor: "#ffffff",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Avatar sx={{ bgcolor: "rgba(16, 185, 129, 0.1)", color: "#10b981", borderRadius: 2.5, width: 46, height: 46 }}>
            <CheckCircleRoundedIcon />
          </Avatar>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Active Background Sweeps
            </Typography>
            <Typography variant="h5" fontWeight={900} color="#0f172a">
              {activeCount} Active
            </Typography>
          </Box>
        </Paper>

        <Paper
          sx={{
            p: 2.5,
            border: "1px solid #e2e8f0",
            borderRadius: 3,
            bgcolor: "#ffffff",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Avatar sx={{ bgcolor: "rgba(147, 51, 234, 0.1)", color: "#9333ea", borderRadius: 2.5, width: 46, height: 46 }}>
            <AccessTimeRoundedIcon />
          </Avatar>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Engine Frequency
            </Typography>
            <Typography variant="h5" fontWeight={900} color="#0f172a">
              Every 15 mins
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3, borderRadius: 2.5, border: "1px solid #e2e8f0" }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          indicatorColor="primary"
          textColor="primary"
          sx={{ px: 2, borderBottom: "1px solid #e2e8f0" }}
        >
          <Tab
            icon={<BoltRoundedIcon fontSize="small" />}
            iconPosition="start"
            label="Automation Rules"
            sx={{ fontWeight: 700 }}
          />
          <Tab
            icon={<HistoryRoundedIcon fontSize="small" />}
            iconPosition="start"
            label={`Execution Audit Log (${logs.length})`}
            sx={{ fontWeight: 700 }}
          />
        </Tabs>
      </Paper>

      {tab === 0 && (
        <Paper sx={{ borderRadius: 3, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <Table>
            <TableHead sx={{ bgcolor: "#fafcff" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: "#64748b" }}>RULE NAME</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#64748b" }}>MONITORED TRIGGER</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#64748b" }}>DISPATCHED ACTION</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#64748b" }}>STATUS</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: "#64748b" }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rules.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell sx={{ fontWeight: 700, color: "#0f172a" }}>{r.name}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={TRIGGER_LABELS[r.triggerType] || r.triggerType}
                      sx={{
                        bgcolor: "rgba(2, 132, 199, 0.08)",
                        color: "#0284c7",
                        fontWeight: 700,
                        fontSize: "0.72rem",
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: "#334155", fontWeight: 600 }}>{ACTION_LABELS[r.actionType] || r.actionType}</TableCell>
                  <TableCell>
                    <Switch
                      checked={r.isActive}
                      onChange={() => toggleActive(r)}
                      color="primary"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Delete Rule">
                      <IconButton
                        size="small"
                        onClick={() => remove(r.id)}
                        sx={{
                          color: "#ef4444",
                          bgcolor: "rgba(239, 68, 68, 0.06)",
                          borderRadius: 2,
                          "&:hover": { bgcolor: "rgba(239, 68, 68, 0.15)" },
                        }}
                      >
                        <DeleteRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {rules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} sx={{ py: 6, textAlign: "center" }}>
                    <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                      <Avatar sx={{ bgcolor: "rgba(2, 132, 199, 0.1)", color: "#0284c7", width: 48, height: 48, mb: 1 }}>
                        <BoltRoundedIcon />
                      </Avatar>
                      <Typography variant="body1" fontWeight={700} color="#0f172a">
                        No automation rules configured yet
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        E.g. "If lead is not contacted within 2 hours, automatically alert team manager".
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}

      {tab === 1 && (
        <Paper sx={{ borderRadius: 3, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <Table>
            <TableHead sx={{ bgcolor: "#fafcff" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: "#64748b" }}>FIRED TIME</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#64748b" }}>TRIGGERED RULE</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#64748b" }}>TARGET ENTITY</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#64748b" }}>DISPATCH MESSAGE</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((l) => (
                <TableRow key={l.id} hover>
                  <TableCell sx={{ fontSize: "0.82rem", color: "#64748b" }}>
                    {new Date(l.createdAt).toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#0f172a" }}>{l.rule?.name}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={`${l.targetType} · ${l.targetId?.slice(0, 8)}`}
                      sx={{ bgcolor: "#f1f5f9", fontWeight: 700, fontSize: "0.72rem" }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: "#334155", fontSize: "0.85rem" }}>{l.message}</TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} sx={{ py: 6, textAlign: "center" }}>
                    <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                      <Avatar sx={{ bgcolor: "rgba(147, 51, 234, 0.1)", color: "#9333ea", width: 48, height: 48, mb: 1 }}>
                        <NotificationImportantRoundedIcon />
                      </Avatar>
                      <Typography variant="body1" fontWeight={700} color="#0f172a">
                        No execution events recorded yet
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        The background automated engine runs periodic checks every 15 minutes.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Creation Modal */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800, color: "#0f172a" }}>New Automation Rule</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
          <TextField
            label="Rule Name"
            placeholder="e.g., Fast Lead SLA Alert"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            fullWidth
          />

          <TextField
            select
            label="Trigger Condition"
            value={form.triggerType}
            onChange={(e) => setForm({ ...form, triggerType: e.target.value })}
            fullWidth
          >
            {Object.entries(TRIGGER_LABELS).map(([key, label]) => (
              <MenuItem key={key} value={key}>
                {label}
              </MenuItem>
            ))}
          </TextField>

          {needsHoursOrDays && (
            <TextField
              label={`Threshold Limit (${unit})`}
              type="number"
              value={form.triggerValue}
              onChange={(e) => setForm({ ...form, triggerValue: Number(e.target.value) })}
              fullWidth
            />
          )}

          <TextField
            select
            label="Target Action"
            value={form.actionType}
            onChange={(e) => setForm({ ...form, actionType: e.target.value })}
            fullWidth
          >
            {Object.entries(ACTION_LABELS).map(([key, label]) => (
              <MenuItem key={key} value={key}>
                {label}
              </MenuItem>
            ))}
          </TextField>

          {form.actionType === "EMAIL_STAFF" && (
            <>
              <TextField
                select
                label="Recipient Category"
                value={form.recipient}
                onChange={(e) => setForm({ ...form, recipient: e.target.value })}
                fullWidth
              >
                <MenuItem value="CLIENT_ADMIN">Client Admin</MenuItem>
                <MenuItem value="ASSIGNED_STAFF">Assigned Lead Handler</MenuItem>
                <MenuItem value="SPECIFIC_USER">Specific Team Member</MenuItem>
              </TextField>
              {form.recipient === "SPECIFIC_USER" && (
                <TextField
                  select
                  label="Select Team Member"
                  value={form.userId}
                  onChange={(e) => setForm({ ...form, userId: e.target.value })}
                  fullWidth
                >
                  {staff.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            </>
          )}

          {form.actionType === "REASSIGN_ENQUIRY" && (
            <TextField
              select
              label="Reassign Target"
              value={form.toUserId}
              onChange={(e) => setForm({ ...form, toUserId: e.target.value })}
              fullWidth
            >
              {staff.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </TextField>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpen(false)} sx={{ fontWeight: 600, color: "#64748b" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!form.name}
            sx={{
              background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
              fontWeight: 800,
              px: 3,
            }}
          >
            Create Rule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
