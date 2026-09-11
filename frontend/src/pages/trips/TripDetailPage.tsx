import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Paper, Chip, Select, MenuItem, TextField, Button, Grid, Alert,
  Avatar, IconButton, Tooltip
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import LuggageRoundedIcon from "@mui/icons-material/LuggageRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import DirectionsCarRoundedIcon from "@mui/icons-material/DirectionsCarRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import { apiClient } from "../../api/client";
import { WhatsAppModal } from "../../components/whatsapp/WhatsAppModal";
import { DutySlipDispatcherSection } from "../../components/trips/DutySlipDispatcherSection";

const STATUS_CONFIG: Record<string, { bg: string; color: string }> = {
  SCHEDULED: { bg: "#eff6ff", color: "#1d4ed8" },
  IN_PROGRESS: { bg: "#fff7ed", color: "#c2410c" },
  COMPLETED: { bg: "#f0fdf4", color: "#15803d" },
  CANCELLED: { bg: "#fef2f2", color: "#b91c1c" },
};

export function TripDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<any>(null);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [notes, setNotes] = useState({ pickup: "", drop: "", itineraryNotes: "" });
  const [assignError, setAssignError] = useState<string | null>(null);
  const [whatsAppOpen, setWhatsAppOpen] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  function load() {
    apiClient.get(`/trips/${id}`).then(({ data }) => {
      setTrip(data.data);
      setNotes({
        pickup: data.data.pickup ?? "",
        drop: data.data.drop ?? "",
        itineraryNotes: data.data.itineraryNotes ?? "",
      });
    });
  }
  useEffect(load, [id]);
  useEffect(() => {
    apiClient.get("/drivers").then(({ data }) => setDrivers(data.data)).catch(() => {});
    apiClient.get("/vehicles").then(({ data }) => setVehicles(data.data)).catch(() => {});
  }, []);

  async function updateStatus(status: string) {
    await apiClient.patch(`/trips/${id}/status`, { status });
    load();
  }

  async function assign(field: "driverId" | "vehicleId", value: string) {
    setAssignError(null);
    try {
      await apiClient.patch(`/trips/${id}/assign`, { [field]: value || null });
      load();
    } catch (err: any) {
      setAssignError(err.response?.data?.message ?? "Could not update assignment");
    }
  }

  async function saveNotes() {
    setSavingNotes(true);
    try {
      await apiClient.patch(`/trips/${id}`, notes);
      load();
    } finally {
      setSavingNotes(false);
    }
  }

  if (!trip) {
    return (
      <Box sx={{ p: 4, minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography variant="body1" color="text.secondary" fontWeight={600}>
          Loading trip dispatch...
        </Typography>
      </Box>
    );
  }

  const currentStatusConfig = STATUS_CONFIG[trip.status] || { bg: "#f1f5f9", color: "#475569" };

  return (
    <Box sx={{ p: { xs: 2.5, md: 4 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      {/* Top Meta Bar */}
      <Box display="flex" alignItems="center" gap={1.5} mb={2.5}>
        <Tooltip title="Back to Trips">
          <IconButton
            onClick={() => navigate("/app/trips")}
            size="small"
            sx={{
              bgcolor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 2,
              "&:hover": { bgcolor: "#f1f5f9" },
            }}
          >
            <ArrowBackRoundedIcon fontSize="small" sx={{ color: "#475569" }} />
          </IconButton>
        </Tooltip>
        <Typography variant="caption" color="text.secondary" fontWeight={700}>
          TRIP DISPATCH / #{id?.slice(-6).toUpperCase()}
        </Typography>
      </Box>

      {/* Header */}
      <Box
        display="flex"
        flexDirection={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        gap={2}
        mb={3.5}
      >
        <Box display="flex" alignItems="center" gap={1.75}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              background: "linear-gradient(135deg, #0284c7 0%, #0c4a6e 100%)",
              boxShadow: "0 4px 14px rgba(2, 132, 199, 0.35)",
            }}
          >
            <LuggageRoundedIcon sx={{ color: "#fff", fontSize: 26 }} />
          </Avatar>
          <Box>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Typography variant="h4" fontWeight={900} sx={{ color: "#0f172a", letterSpacing: "-0.03em" }}>
                Trip Dispatch
              </Typography>
              <Chip
                label={trip.status.replace("_", " ")}
                sx={{
                  bgcolor: currentStatusConfig.bg,
                  color: currentStatusConfig.color,
                  fontWeight: 800,
                  fontSize: "0.75rem",
                  borderRadius: "8px",
                }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Traveler: <strong>{trip.booking?.customer?.name || "Private Charter"}</strong> · Status: {trip.status.replace("_", " ")}
            </Typography>
          </Box>
        </Box>

        <Box display="flex" flexWrap="wrap" gap={1.5} alignItems="center">
          <Select
            size="small"
            value={trip.status}
            onChange={(e) => updateStatus(e.target.value)}
            sx={{
              bgcolor: "#ffffff",
              borderRadius: 2,
              fontSize: "0.82rem",
              fontWeight: 700,
              minWidth: 150,
            }}
          >
            {["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((s) => (
              <MenuItem key={s} value={s} sx={{ fontSize: "0.82rem", fontWeight: 600 }}>
                {s.replace("_", " ")}
              </MenuItem>
            ))}
          </Select>

          <Button
            variant="contained"
            startIcon={<WhatsAppIcon />}
            onClick={() => setWhatsAppOpen(true)}
            sx={{
              background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
              boxShadow: "0 4px 14px rgba(34, 197, 94, 0.3)",
              fontWeight: 700,
              borderRadius: 2.5,
              textTransform: "none",
              px: 2.5,
            }}
          >
            Share on WhatsApp
          </Button>
        </Box>
      </Box>

      {assignError && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>{assignError}</Alert>}

      {/* Driver & Vehicle Pairing Cards */}
      <Grid container spacing={2.5} mb={3.5}>
        <Grid item xs={12} sm={6}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}>
            <Box display="flex" alignItems="center" gap={1.25} mb={1.5}>
              <Avatar sx={{ width: 34, height: 34, bgcolor: "#eff6ff", color: "#0284c7" }}>
                <PersonRoundedIcon sx={{ fontSize: 20 }} />
              </Avatar>
              <Box>
                <Typography variant="subtitle2" fontWeight={800} color="#0f172a">
                  Assigned Driver
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Chauffeur responsible for passenger pickup
                </Typography>
              </Box>
            </Box>
            <Select
              fullWidth
              size="small"
              displayEmpty
              value={trip.driverId ?? ""}
              onChange={(e) => assign("driverId", e.target.value)}
              sx={{ borderRadius: 2, bgcolor: "#f8fafc" }}
            >
              <MenuItem value="">
                <em>Unassigned Chauffeur</em>
              </MenuItem>
              {drivers.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.name} {d.phone ? `(${d.phone})` : ""}
                </MenuItem>
              ))}
            </Select>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}>
            <Box display="flex" alignItems="center" gap={1.25} mb={1.5}>
              <Avatar sx={{ width: 34, height: 34, bgcolor: "#f0fdf4", color: "#16a34a" }}>
                <DirectionsCarRoundedIcon sx={{ fontSize: 20 }} />
              </Avatar>
              <Box>
                <Typography variant="subtitle2" fontWeight={800} color="#0f172a">
                  Assigned Vehicle
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Fleet unit dispatched for transit
                </Typography>
              </Box>
            </Box>
            <Select
              fullWidth
              size="small"
              displayEmpty
              value={trip.vehicleId ?? ""}
              onChange={(e) => assign("vehicleId", e.target.value)}
              sx={{ borderRadius: 2, bgcolor: "#f8fafc" }}
            >
              <MenuItem value="">
                <em>Unassigned Vehicle</em>
              </MenuItem>
              {vehicles.map((v) => (
                <MenuItem key={v.id} value={v.id}>
                  {v.registrationNumber} ({v.vehicleType})
                </MenuItem>
              ))}
            </Select>
          </Paper>
        </Grid>
      </Grid>

      {/* Duty Slip Dispatcher & Odometer Lifecycle Section */}
      <Box mb={3.5}>
        <DutySlipDispatcherSection tripId={id!} trip={trip} onTripRefresh={load} />
      </Box>

      {/* Route & Itinerary Notes */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}>
        <Box display="flex" alignItems="center" gap={1.25} mb={2}>
          <LocationOnRoundedIcon sx={{ color: "#0284c7", fontSize: 22 }} />
          <Typography variant="h6" fontWeight={800} color="#0f172a">
            Route Schedule & Transit Brief
          </Typography>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Pickup Location / Terminal"
              value={notes.pickup}
              onChange={(e) => setNotes({ ...notes, pickup: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Dropoff Location / Hotel"
              value={notes.drop}
              onChange={(e) => setNotes({ ...notes, drop: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Special Driver & Guest Itinerary Notes"
              placeholder="e.g. Flight arrives at 14:30 Terminal 2. Guest requested baby seat and bottled water."
              value={notes.itineraryNotes}
              onChange={(e) => setNotes({ ...notes, itineraryNotes: e.target.value })}
            />
          </Grid>
        </Grid>
        <Box mt={2.5} display="flex" justifyContent="flex-end">
          <Button
            variant="contained"
            startIcon={<SaveRoundedIcon />}
            disabled={savingNotes}
            onClick={saveNotes}
            sx={{
              background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
              fontWeight: 700,
              borderRadius: 2,
              px: 3,
            }}
          >
            Save Trip Notes
          </Button>
        </Box>
      </Paper>

      {/* WhatsApp Modal for Driver Broadcast */}
      {trip && (
        <WhatsAppModal
          open={whatsAppOpen}
          onClose={() => setWhatsAppOpen(false)}
          initialPhone={trip.booking?.customer?.phone || ""}
          customerName={trip.booking?.customer?.name || ""}
          defaultCategory="CAB_DISPATCH"
        />
      )}
    </Box>
  );
}
