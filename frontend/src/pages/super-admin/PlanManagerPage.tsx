import { useEffect, useState } from "react";
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Switch, TextField } from "@mui/material";
import { apiClient } from "../../api/client";

const FEATURES = [
  "enquiry_crm", "bookings", "quotation", "drivers", "vehicles", "payments",
  "basic_reports", "advanced_reports", "workflow_automation", "enhanced_controls",
  "multi_branch", "integrations", "custom_modules",
];

export function PlanManagerPage() {
  const [plans, setPlans] = useState<any[]>([]);

  function load() {
    apiClient.get("/super-admin/plans").then(({ data }) => setPlans(data.data));
  }
  useEffect(load, []);

  async function toggleFeature(plan: any, feature: string) {
    const entitlements = { ...plan.entitlements, [feature]: !plan.entitlements[feature] };
    await apiClient.patch(`/super-admin/plans/${plan.id}`, { entitlements });
    load();
  }

  async function updateLimit(plan: any, field: string, value: string) {
    const numeric = value === "" ? null : Number(value);
    await apiClient.patch(`/super-admin/plans/${plan.id}`, { [field]: numeric });
    load();
  }

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>Plan Manager</Typography>
      <Typography color="text.secondary" mb={2}>
        Changes apply instantly on clients' next request — no code deployment needed.
      </Typography>
      <Paper sx={{ overflowX: "auto" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Feature</TableCell>
              {plans.map((p) => <TableCell key={p.id} align="center">{p.name}<br /><Typography variant="caption">₹{(p.priceInPaise / 100).toLocaleString()}/mo</Typography></TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {FEATURES.map((feature) => (
              <TableRow key={feature}>
                <TableCell>{feature.replace(/_/g, " ")}</TableCell>
                {plans.map((p) => (
                  <TableCell key={p.id} align="center">
                    <Switch checked={!!p.entitlements[feature]} onChange={() => toggleFeature(p, feature)} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
            <TableRow>
              <TableCell>Max Users</TableCell>
              {plans.map((p) => (
                <TableCell key={p.id} align="center">
                  <TextField size="small" defaultValue={p.maxUsers ?? ""} placeholder="Unlimited"
                    onBlur={(e) => updateLimit(p, "maxUsers", e.target.value)} sx={{ width: 90 }} />
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell>Max Enquiries/Month</TableCell>
              {plans.map((p) => (
                <TableCell key={p.id} align="center">
                  <TextField size="small" defaultValue={p.maxEnquiriesPerMonth ?? ""} placeholder="Unlimited"
                    onBlur={(e) => updateLimit(p, "maxEnquiriesPerMonth", e.target.value)} sx={{ width: 90 }} />
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
