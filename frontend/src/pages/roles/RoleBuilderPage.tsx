import { useEffect, useState } from "react";
import {
  Box, Typography, Button, Paper, Table, TableHead, TableRow, TableCell,
  TableBody, Checkbox, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip,
} from "@mui/material";
import { apiClient } from "../../api/client";

const ACTIONS = ["view", "add", "edit", "delete", "export"] as const;

function emptyGrid(modules: string[]) {
  const grid: Record<string, Record<string, boolean>> = {};
  for (const m of modules) grid[m] = { view: false, add: false, edit: false, delete: false, export: false };
  return grid;
}

// No-code Role Builder (SRS section 26 / USP #3) — the Client Admin
// creates unlimited custom roles here, each a module x action grid.
export function RoleBuilderPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [modules, setModules] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [grid, setGrid] = useState<Record<string, Record<string, boolean>>>({});

  function load() {
    apiClient.get("/roles").then(({ data }) => setRoles(data.data));
    apiClient.get("/roles/modules").then(({ data }) => { setModules(data.data); setGrid(emptyGrid(data.data)); });
  }
  useEffect(load, []);

  function toggle(moduleName: string, action: string) {
    setGrid({ ...grid, [moduleName]: { ...grid[moduleName], [action]: !grid[moduleName][action] } });
  }

  async function handleCreate() {
    await apiClient.post("/roles", { name, permissionsJson: grid });
    setOpen(false);
    setName("");
    setGrid(emptyGrid(modules));
    load();
  }

  return (
    <Box p={4}>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h4">Role Builder</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>+ New Role</Button>
      </Box>

      <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
        {roles.map((r) => <Chip key={r.id} label={r.isSystemRole ? `${r.name} (built-in)` : r.name} />)}
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>New Role</DialogTitle>
        <DialogContent>
          <TextField label="Role Name" placeholder="e.g. Sales Agent, Accountant, Dispatcher"
            fullWidth sx={{ mb: 2, mt: 1 }} value={name} onChange={(e) => setName(e.target.value)} />
          <Paper variant="outlined" sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Module</TableCell>
                  {ACTIONS.map((a) => <TableCell key={a} align="center">{a}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {modules.map((m) => (
                  <TableRow key={m}>
                    <TableCell>{m}</TableCell>
                    {ACTIONS.map((a) => (
                      <TableCell key={a} align="center">
                        <Checkbox size="small" checked={!!grid[m]?.[a]} onChange={() => toggle(m, a)} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!name}>Create Role</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
