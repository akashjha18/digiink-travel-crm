import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Typography, Paper, Card, CardContent, Link, Select, MenuItem } from "@mui/material";
import { apiClient } from "../../api/client";

const STAGES = ["NEW", "CONTACTED", "QUOTED", "NEGOTIATION", "WON", "LOST"];

// Kanban-style pipeline view (SRS FR-9.1). Drag-and-drop is a nice-to-have
// left for later — moving stages via the per-card dropdown gets the same
// job done without a DnD library dependency for Phase 4.
export function PipelinePage() {
  const [grouped, setGrouped] = useState<Record<string, any[]>>({});

  function load() {
    apiClient.get("/enquiries/pipeline").then(({ data }) => setGrouped(data.data));
  }
  useEffect(load, []);

  async function moveStage(enquiryId: string, status: string) {
    await apiClient.patch(`/enquiries/${enquiryId}/status`, { status });
    load();
  }

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>Pipeline</Typography>
      <Box display="flex" gap={2} sx={{ overflowX: "auto", pb: 2 }}>
        {STAGES.map((stage) => (
          <Paper key={stage} sx={{ minWidth: 260, maxWidth: 260, p: 1.5, bgcolor: "grey.50" }}>
            <Typography variant="subtitle2" gutterBottom>
              {stage.replace(/_/g, " ")} ({grouped[stage]?.length ?? 0})
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              {(grouped[stage] ?? []).map((e) => (
                <Card key={e.id} variant="outlined">
                  <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                    <Link component={RouterLink} to={`/app/enquiries/${e.id}`} underline="hover">
                      <Typography variant="body2" fontWeight={600}>{e.customer?.name}</Typography>
                    </Link>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {e.destination ?? "No destination"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                      {e.assignedTo?.name ?? "Unassigned"}
                    </Typography>
                    <Select size="small" fullWidth value={e.status} onChange={(ev) => moveStage(e.id, ev.target.value)}>
                      {STAGES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </Select>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
