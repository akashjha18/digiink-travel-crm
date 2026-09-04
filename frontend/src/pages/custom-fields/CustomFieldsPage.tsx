import { useEffect, useState } from "react";
import {
  Box, Typography, Button, Paper, Table, TableHead, TableRow, TableCell,
  TableBody, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, Switch, Tabs, Tab,
} from "@mui/material";
import { apiClient } from "../../api/client";

const MODULES = ["customers", "enquiries", "bookings"];
const FIELD_TYPES = ["TEXT", "NUMBER", "DATE", "BOOLEAN"];

// Custom Module framework (SRS FR-12.3, Enterprise only). Deliberately
// "add custom fields to Customers/Enquiries/Bookings" rather than an
// open-ended new-entity builder — see the schema comment for why.
export function CustomFieldsPage() {
  const [tab, setTab] = useState(0);
  const [definitions, setDefinitions] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ fieldKey: "", label: "", fieldType: "TEXT" });

  const module = MODULES[tab];

  function load() {
    apiClient.get("/custom-fields/definitions", { params: { module } }).then(({ data }) => setDefinitions(data.data));
  }
  useEffect(load, [module]);

  async function handleCreate() {
    await apiClient.post("/custom-fields/definitions", { module, ...form });
    setOpen(false);
    setForm({ fieldKey: "", label: "", fieldType: "TEXT" });
    load();
  }

  async function toggleActive(def: any) {
    await apiClient.patch(`/custom-fields/definitions/${def.id}`, { isActive: !def.isActive });
    load();
  }

  return (
    <Box p={4}>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h4">Custom Fields</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>+ New Field</Button>
      </Box>
      <Typography color="text.secondary" mb={2}>
        Add extra fields to Customers, Enquiries, or Bookings — e.g. "Passport Number" or "Visa Status" — without any code changes.
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        {MODULES.map((m) => <Tab key={m} label={m.charAt(0).toUpperCase() + m.slice(1)} />)}
      </Tabs>

      <Paper>
        <Table>
          <TableHead><TableRow><TableCell>Field Key</TableCell><TableCell>Label</TableCell><TableCell>Type</TableCell><TableCell>Active</TableCell></TableRow></TableHead>
          <TableBody>
            {definitions.map((d) => (
              <TableRow key={d.id}>
                <TableCell><code>{d.fieldKey}</code></TableCell>
                <TableCell>{d.label}</TableCell>
                <TableCell><Chip size="small" label={d.fieldType} /></TableCell>
                <TableCell><Switch checked={d.isActive} onChange={() => toggleActive(d)} /></TableCell>
              </TableRow>
            ))}
            {definitions.length === 0 && <TableRow><TableCell colSpan={4}>No custom fields for {module} yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New Custom Field on {module}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField label="Label" placeholder="e.g. Passport Number" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          <TextField label="Field Key" placeholder="e.g. passport_number" helperText="lowercase letters, numbers, underscores only"
            value={form.fieldKey} onChange={(e) => setForm({ ...form, fieldKey: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })} />
          <TextField select label="Type" value={form.fieldType} onChange={(e) => setForm({ ...form, fieldType: e.target.value })}>
            {FIELD_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!form.label || !form.fieldKey}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
