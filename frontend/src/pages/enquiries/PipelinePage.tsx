import { useEffect, useState, useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Link,
  Select,
  MenuItem,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import RouteRoundedIcon from "@mui/icons-material/RouteRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import ViewKanbanRoundedIcon from "@mui/icons-material/ViewKanbanRounded";
import { apiClient } from "../../api/client";

const STAGES = ["NEW", "CONTACTED", "QUOTED", "NEGOTIATION", "WON", "LOST"];

const STAGE_CONFIG: Record<
  string,
  { label: string; dot: string; bg: string; badgeBg: string; badgeColor: string }
> = {
  NEW: { label: "New Leads", dot: "#3b82f6", bg: "#f0f7ff", badgeBg: "#dbeafe", badgeColor: "#1e40af" },
  CONTACTED: { label: "Contacted", dot: "#eab308", bg: "#fefce8", badgeBg: "#fef08a", badgeColor: "#854d0e" },
  QUOTED: { label: "Quoted", dot: "#8b5cf6", bg: "#faf5ff", badgeBg: "#ede9fe", badgeColor: "#5b21b6" },
  NEGOTIATION: { label: "Negotiation", dot: "#f97316", bg: "#fff7ed", badgeBg: "#ffedd5", badgeColor: "#9a3412" },
  WON: { label: "Won Deals", dot: "#22c55e", bg: "#f0fdf4", badgeBg: "#dcfce7", badgeColor: "#166534" },
  LOST: { label: "Lost", dot: "#ef4444", bg: "#fef2f2", badgeBg: "#fee2e2", badgeColor: "#991b1b" },
};

export function PipelinePage() {
  const [grouped, setGrouped] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [movingId, setMovingId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    apiClient
      .get("/enquiries/pipeline")
      .then(({ data }) => setGrouped(data.data ?? {}))
      .catch(() => setGrouped({}))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function moveStage(enquiryId: string, status: string) {
    try {
      setMovingId(enquiryId);
      await apiClient.patch(`/enquiries/${enquiryId}/status`, { status });
      load();
    } finally {
      setMovingId(null);
    }
  }

  const totalCount = useMemo(() => {
    return Object.values(grouped).reduce((acc, list) => acc + (list?.length || 0), 0);
  }, [grouped]);

  const filterEnquiries = (list: any[] = []) => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (e) =>
        e.customer?.name?.toLowerCase().includes(q) ||
        e.destination?.toLowerCase().includes(q) ||
        e.source?.toLowerCase().includes(q) ||
        e.assignedTo?.name?.toLowerCase().includes(q)
    );
  };

  return (
    <Box sx={{ p: { xs: 2.5, md: 4.5 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      {/* Header & Global Toolbar */}
      <Box
        display="flex"
        flexDirection={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        gap={2}
        mb={3.5}
      >
        <Box>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Typography variant="h4" fontWeight={900} sx={{ color: "#0f172a", letterSpacing: "-0.03em" }}>
              Deal Pipeline
            </Typography>
            <Chip
              label={`${totalCount} Active Deals`}
              size="small"
              icon={<ViewKanbanRoundedIcon style={{ fontSize: 15 }} />}
              sx={{
                bgcolor: "#eff6ff",
                color: "#2563eb",
                fontWeight: 800,
                fontSize: "0.72rem",
                borderRadius: "6px",
              }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Track deals across conversion stages and transition statuses in real-time.
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={1.5} width={{ xs: "100%", sm: "auto" }}>
          <TextField
            size="small"
            placeholder="Filter by customer, agent, route..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" sx={{ color: "#94a3b8" }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: { xs: "100%", sm: 280 },
              "& .MuiOutlinedInput-root": {
                borderRadius: 2.5,
                bgcolor: "#ffffff",
              },
            }}
          />

          <Tooltip title="Refresh Board">
            <span>
              <IconButton
                onClick={load}
                disabled={loading}
                sx={{
                  bgcolor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 2.5,
                  "&:hover": { bgcolor: "#f1f5f9" },
                }}
              >
                <RefreshRoundedIcon fontSize="small" sx={{ color: "#475569" }} />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {/* Kanban Columns Swimlane */}
      <Box
        sx={{
          display: "flex",
          gap: 2.5,
          overflowX: "auto",
          alignItems: "flex-start",
          pb: 2.5,
          "&::-webkit-scrollbar": { height: 6 },
          "&::-webkit-scrollbar-thumb": { bgcolor: "#cbd5e1", borderRadius: 4 },
        }}
      >
        {STAGES.map((stage) => {
          const config = STAGE_CONFIG[stage] ?? STAGE_CONFIG.NEW;
          const stageEnquiries = filterEnquiries(grouped[stage] ?? []);

          return (
            <Paper
              key={stage}
              elevation={0}
              sx={{
                flex: "0 0 300px",
                width: 300,
                borderRadius: 3.5,
                border: "1px solid #e2e8f0",
                bgcolor: "#f1f5f9",
                p: 2,
                display: "flex",
                flexDirection: "column",
                maxHeight: "calc(100vh - 200px)",
              }}
            >
              {/* Column Header */}
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} px={0.5}>
                <Box display="flex" alignItems="center" gap={1.2}>
                  <Box
                    sx={{
                      width: 9,
                      height: 9,
                      borderRadius: "50%",
                      bgcolor: config.dot,
                      boxShadow: `0 0 8px ${config.dot}`,
                    }}
                  />
                  <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#0f172a", fontSize: "0.86rem" }}>
                    {config.label}
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={stageEnquiries.length}
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.72rem",
                    bgcolor: config.badgeBg,
                    color: config.badgeColor,
                    borderRadius: "6px",
                    height: 20,
                  }}
                />
              </Box>

              {/* Cards Container */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.75,
                  overflowY: "auto",
                  pr: 0.5,
                  "&::-webkit-scrollbar": { width: 4 },
                  "&::-webkit-scrollbar-thumb": { bgcolor: "#cbd5e1", borderRadius: 4 },
                }}
              >
                {stageEnquiries.map((e) => {
                  const isMoving = movingId === e.id;

                  return (
                    <Card
                      key={e.id}
                      elevation={0}
                      sx={{
                        borderRadius: 2.75,
                        border: "1px solid #e2e8f0",
                        bgcolor: "#ffffff",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          borderColor: "#cbd5e1",
                          boxShadow: "0 6px 16px -4px rgba(15, 23, 42, 0.08)",
                          transform: "translateY(-2px)",
                        },
                      }}
                    >
                      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                        {/* Header: Name & Link */}
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                          <Link
                            component={RouterLink}
                            to={`/app/enquiries/${e.id}`}
                            underline="none"
                            sx={{
                              color: "#0f172a",
                              fontWeight: 800,
                              fontSize: "0.92rem",
                              "&:hover": { color: "#2563eb" },
                            }}
                          >
                            {e.customer?.name || "Unnamed Deal"}
                          </Link>
                          <ArrowForwardIosRoundedIcon sx={{ fontSize: 12, color: "#94a3b8", mt: 0.4 }} />
                        </Box>

                        {/* Route Destination */}
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <RouteRoundedIcon sx={{ fontSize: 15, color: "#94a3b8" }} />
                          <Typography variant="body2" color="#475569" fontWeight={600} noWrap sx={{ fontSize: "0.8rem" }}>
                            {[e.source, e.destination].filter(Boolean).join(" → ") || "Open Route"}
                          </Typography>
                        </Box>

                        {/* Assigned Agent & Date Meta */}
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.75} pt={0.5}>
                          <Box display="flex" alignItems="center" gap={0.75}>
                            <Avatar
                              sx={{
                                width: 20,
                                height: 20,
                                fontSize: "0.65rem",
                                fontWeight: 700,
                                bgcolor: e.assignedTo ? "#eff6ff" : "#f1f5f9",
                                color: e.assignedTo ? "#2563eb" : "#94a3b8",
                              }}
                            >
                              {e.assignedTo?.name?.[0]?.toUpperCase() || <BadgeRoundedIcon sx={{ fontSize: 12 }} />}
                            </Avatar>
                            <Typography variant="caption" color="text.secondary" fontWeight={600} noWrap sx={{ maxWidth: 120 }}>
                              {e.assignedTo?.name || "Unassigned"}
                            </Typography>
                          </Box>

                          {e.createdAt && (
                            <Box display="flex" alignItems="center" gap={0.5} sx={{ color: "#94a3b8" }}>
                              <CalendarTodayRoundedIcon sx={{ fontSize: 12 }} />
                              <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
                                {new Date(e.createdAt).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                })}
                              </Typography>
                            </Box>
                          )}
                        </Box>

                        {/* Quick Transition Selector */}
                        <Box display="flex" alignItems="center" gap={1}>
                          <Select
                            size="small"
                            fullWidth
                            disabled={isMoving}
                            value={e.status}
                            onChange={(ev) => moveStage(e.id, ev.target.value)}
                            sx={{
                              fontSize: "0.78rem",
                              fontWeight: 700,
                              borderRadius: 2,
                              bgcolor: "#f8fafc",
                              "& .MuiSelect-select": { py: 0.65, px: 1.25 },
                            }}
                          >
                            {STAGES.map((s) => (
                              <MenuItem key={s} value={s} sx={{ fontSize: "0.8rem", fontWeight: 600 }}>
                                Move to {STAGE_CONFIG[s]?.label ?? s}
                              </MenuItem>
                            ))}
                          </Select>
                          {isMoving && <CircularProgress size={16} sx={{ color: "#2563eb" }} />}
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}

                {stageEnquiries.length === 0 && (
                  <Box
                    sx={{
                      p: 3,
                      border: "1.5px dashed #cbd5e1",
                      borderRadius: 2.5,
                      textAlign: "center",
                      bgcolor: "rgba(255, 255, 255, 0.4)",
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {search ? "No matches" : "No deals in this stage"}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
}