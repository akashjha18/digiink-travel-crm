import { useEffect, useState } from "react";
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody } from "@mui/material";
import { apiClient } from "../../api/client";

export function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => { apiClient.get("/super-admin/audit-logs").then(({ data }) => setLogs(data.data)); }, []);

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>Audit Log</Typography>
      <Paper>
        <Table>
          <TableHead><TableRow><TableCell>Time</TableCell><TableCell>Actor</TableCell><TableCell>Action</TableCell><TableCell>Target Client</TableCell></TableRow></TableHead>
          <TableBody>
            {logs.map((l) => (
              <TableRow key={l.id}>
                <TableCell>{new Date(l.createdAt).toLocaleString()}</TableCell>
                <TableCell>{l.actorEmail}</TableCell>
                <TableCell>{l.action}</TableCell>
                <TableCell>{l.targetClientId ?? "—"}</TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && <TableRow><TableCell colSpan={4}>No audit entries yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
