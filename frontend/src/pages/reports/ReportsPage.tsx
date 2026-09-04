import { useEffect, useState } from "react";
import {
  Box, Typography, Paper, Tabs, Tab, TextField, Button, Table, TableHead,
  TableRow, TableCell, TableBody,
} from "@mui/material";
import { apiClient } from "../../api/client";

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => JSON.stringify(row[h] ?? "")).join(","));
  }
  return lines.join("\n");
}

function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  const blob = new Blob([toCsv(rows)], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const REPORTS = [
  { key: "sales-by-agent", label: "Sales by Agent", advanced: false },
  { key: "bookings-by-status", label: "Bookings by Status", advanced: false },
  { key: "revenue-by-destination", label: "Revenue by Destination", advanced: true },
  { key: "driver-utilization", label: "Driver Utilization", advanced: true },
  { key: "vehicle-utilization", label: "Vehicle Utilization", advanced: true },
  { key: "agent-performance-trends", label: "Agent Performance Trends", advanced: true },
];

export function ReportsPage() {
  const [tab, setTab] = useState(0);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [advancedEntitled, setAdvancedEntitled] = useState(true);

  const report = REPORTS[tab];

  function csvRows(): Record<string, unknown>[] {
    if (report.key === "agent-performance-trends") {
      return rows.flatMap((agent) =>
        agent.months.map((m: any) => ({ agent: agent.agentName, month: m.month, wonEnquiries: m.wonEnquiries, revenueInPaise: m.revenueInPaise }))
      );
    }
    return rows;
  }

  function load() {
    apiClient.get(`/reports/${report.key}`, { params: { from: from || undefined, to: to || undefined } })
      .then(({ data }) => { setRows(data.data); setAdvancedEntitled(true); })
      .catch((err) => {
        if (err.response?.data?.code === "FEATURE_NOT_ENTITLED") setAdvancedEntitled(false);
        setRows([]);
      });
  }
  useEffect(load, [tab, from, to]);

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>Reports</Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ mb: 2 }}>
        {REPORTS.map((r) => <Tab key={r.key} label={r.advanced ? `${r.label} (Business+)` : r.label} />)}
      </Tabs>

      <Box display="flex" gap={2} alignItems="center" mb={2}>
        <TextField size="small" label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField size="small" label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} InputLabelProps={{ shrink: true }} />
        <Button variant="outlined" onClick={() => downloadCsv(`${report.key}.csv`, csvRows())} disabled={rows.length === 0}>Export CSV</Button>
        <Button variant="outlined" onClick={() => window.print()}>Print / PDF</Button>
      </Box>

      {!advancedEntitled ? (
        <Paper sx={{ p: 3 }}>
          <Typography>Advanced reports are included in the Business and Enterprise plans. Ask your Super Admin to upgrade your plan to unlock this report.</Typography>
        </Paper>
      ) : (
        <ReportTable reportKey={report.key} rows={rows} />
      )}
    </Box>
  );
}

function ReportTable({ reportKey, rows }: { reportKey: string; rows: any[] }) {
  if (rows.length === 0) return <Paper sx={{ p: 3 }}>No data for this period.</Paper>;

  if (reportKey === "sales-by-agent") {
    return (
      <Paper>
        <Table>
          <TableHead><TableRow><TableCell>Agent</TableCell><TableCell>Won Enquiries</TableCell><TableCell>Revenue</TableCell></TableRow></TableHead>
          <TableBody>{rows.map((r, i) => (
            <TableRow key={i}><TableCell>{r.agentName}</TableCell><TableCell>{r.wonEnquiries}</TableCell><TableCell>₹{(r.revenueInPaise / 100).toLocaleString()}</TableCell></TableRow>
          ))}</TableBody>
        </Table>
      </Paper>
    );
  }

  if (reportKey === "bookings-by-status") {
    return (
      <Paper>
        <Table>
          <TableHead><TableRow><TableCell>Status</TableCell><TableCell>Count</TableCell><TableCell>Total Amount</TableCell></TableRow></TableHead>
          <TableBody>{rows.map((r, i) => (
            <TableRow key={i}><TableCell>{r.status.replace("_", " ")}</TableCell><TableCell>{r.count}</TableCell><TableCell>₹{(r.totalAmountInPaise / 100).toLocaleString()}</TableCell></TableRow>
          ))}</TableBody>
        </Table>
      </Paper>
    );
  }

  if (reportKey === "revenue-by-destination") {
    return (
      <Paper>
        <Table>
          <TableHead><TableRow><TableCell>Destination</TableCell><TableCell>Revenue</TableCell></TableRow></TableHead>
          <TableBody>{rows.map((r, i) => (
            <TableRow key={i}><TableCell>{r.destination}</TableCell><TableCell>₹{(r.revenueInPaise / 100).toLocaleString()}</TableCell></TableRow>
          ))}</TableBody>
        </Table>
      </Paper>
    );
  }

  if (reportKey === "driver-utilization") {
    return (
      <Paper>
        <Table>
          <TableHead><TableRow><TableCell>Driver</TableCell><TableCell>Trips</TableCell><TableCell>Utilization</TableCell></TableRow></TableHead>
          <TableBody>{rows.map((r, i) => (
            <TableRow key={i}><TableCell>{r.driverName}</TableCell><TableCell>{r.tripCount}</TableCell><TableCell>{r.utilizationPercent}%</TableCell></TableRow>
          ))}</TableBody>
        </Table>
      </Paper>
    );
  }

  if (reportKey === "vehicle-utilization") {
    return (
      <Paper>
        <Table>
          <TableHead><TableRow><TableCell>Vehicle</TableCell><TableCell>Trips</TableCell><TableCell>Utilization</TableCell></TableRow></TableHead>
          <TableBody>{rows.map((r, i) => (
            <TableRow key={i}><TableCell>{r.registrationNumber}</TableCell><TableCell>{r.tripCount}</TableCell><TableCell>{r.utilizationPercent}%</TableCell></TableRow>
          ))}</TableBody>
        </Table>
      </Paper>
    );
  }

  if (reportKey === "agent-performance-trends") {
    return (
      <Box display="flex" flexDirection="column" gap={2}>
        {rows.map((agent) => (
          <Paper key={agent.agentId} sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>{agent.agentName}</Typography>
            <Table size="small">
              <TableHead><TableRow><TableCell>Month</TableCell><TableCell>Won Enquiries</TableCell><TableCell>Revenue</TableCell></TableRow></TableHead>
              <TableBody>{agent.months.map((m: any) => (
                <TableRow key={m.month}><TableCell>{m.month}</TableCell><TableCell>{m.wonEnquiries}</TableCell><TableCell>₹{(m.revenueInPaise / 100).toLocaleString()}</TableCell></TableRow>
              ))}</TableBody>
            </Table>
          </Paper>
        ))}
      </Box>
    );
  }

  return null;
}
