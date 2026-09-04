import { useEffect, useState } from "react";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Box, Typography, Paper, Chip, Select, MenuItem, List, ListItem, ListItemText,
  TextField, Button, Grid, Link,
} from "@mui/material";
import { apiClient } from "../../api/client";

const STAGES = ["NEW", "CONTACTED", "QUOTED", "NEGOTIATION", "WON", "LOST"];
const ACTIVITY_TYPES = ["CALL", "NOTE", "FOLLOW_UP"];

export function EnquiryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [enquiry, setEnquiry] = useState<any>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [note, setNote] = useState("");
  const [activityType, setActivityType] = useState("NOTE");

  function load() {
    apiClient.get(`/enquiries/${id}`).then(({ data }) => setEnquiry(data.data));
  }
  useEffect(load, [id]);
  useEffect(() => { apiClient.get("/users").then(({ data }) => setStaff(data.data)); }, []);

  async function updateStatus(status: string) {
    await apiClient.patch(`/enquiries/${id}/status`, { status });
    load();
  }

  async function reassign(assignedToId: string) {
    await apiClient.patch(`/enquiries/${id}/assign`, { assignedToId: assignedToId || null });
    load();
  }

  async function addFollowUp() {
    if (!note.trim()) return;
    await apiClient.post(`/enquiries/${id}/follow-ups`, { activityType, description: note });
    setNote("");
    load();
  }

  if (!enquiry) return <Box p={4}>Loading…</Box>;

  return (
    <Box p={4}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Box>
          <Typography variant="h4">{enquiry.customer?.name}</Typography>
          <Typography color="text.secondary">
            {enquiry.destination ?? "No destination set"} · Source: {enquiry.source ?? "—"}
          </Typography>
        </Box>
        <Chip label={enquiry.status} color={enquiry.status === "WON" ? "success" : enquiry.status === "LOST" ? "error" : "default"} />
      </Box>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Pipeline Stage</Typography>
            <Select fullWidth size="small" value={enquiry.status} onChange={(e) => updateStatus(e.target.value)}>
              {STAGES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Assigned To</Typography>
            <Select fullWidth size="small" displayEmpty value={enquiry.assignedToId ?? ""} onChange={(e) => reassign(e.target.value)}>
              <MenuItem value="">Unassigned</MenuItem>
              {staff.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </Select>
          </Paper>
        </Grid>
      </Grid>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="h6">Quotations</Typography>
        <Button size="small" variant="contained" onClick={() => navigate(`/app/quotations/new?enquiryId=${id}`)}>+ New Quotation</Button>
      </Box>
      <Paper sx={{ mb: 3 }}>
        <List>
          {enquiry.quotations?.map((q: any) => (
            <ListItem key={q.id}>
              <ListItemText
                primary={<Link component={RouterLink} to={`/app/quotations/${q.id}`}>Version {q.version} — ₹{(q.totalInPaise / 100).toLocaleString()} ({q.status})</Link>}
                secondary={new Date(q.createdAt).toLocaleDateString()}
              />
            </ListItem>
          ))}
          {(!enquiry.quotations || enquiry.quotations.length === 0) && <ListItem><ListItemText primary="No quotations yet." /></ListItem>}
        </List>
      </Paper>

      <Typography variant="h6" gutterBottom>Activity Timeline</Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" gap={1} mb={1}>
          <Select size="small" value={activityType} onChange={(e) => setActivityType(e.target.value)}>
            {ACTIVITY_TYPES.map((t) => <MenuItem key={t} value={t}>{t.replace(/_/g, " ")}</MenuItem>)}
          </Select>
          <TextField fullWidth size="small" placeholder="Log a call, note, or follow-up..." value={note} onChange={(e) => setNote(e.target.value)} />
          <Button variant="contained" onClick={addFollowUp}>Add</Button>
        </Box>
      </Paper>

      <Paper>
        <List>
          {enquiry.followUps?.map((f: any) => (
            <ListItem key={f.id}>
              <ListItemText
                primary={`${f.activityType.replace(/_/g, " ")}${f.description ? ` — ${f.description}` : ""}`}
                secondary={`${f.loggedBy?.name ?? "System"} · ${new Date(f.createdAt).toLocaleString()}`}
              />
            </ListItem>
          ))}
          {(!enquiry.followUps || enquiry.followUps.length === 0) && <ListItem><ListItemText primary="No activity logged yet." /></ListItem>}
        </List>
      </Paper>
    </Box>
  );
}
