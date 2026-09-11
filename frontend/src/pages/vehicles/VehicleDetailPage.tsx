import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box, Button, Chip, Divider, MenuItem, Paper, TextField, Typography,
  Avatar, IconButton, Tooltip, Grid
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import DirectionsCarRoundedIcon from "@mui/icons-material/DirectionsCarRounded";
import AirlineSeatReclineExtraRoundedIcon from "@mui/icons-material/AirlineSeatReclineExtraRounded";
import LuggageRoundedIcon from "@mui/icons-material/LuggageRounded";
import AcUnitRoundedIcon from "@mui/icons-material/AcUnitRounded";
import SpeedRoundedIcon from "@mui/icons-material/SpeedRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import { apiClient } from "../../api/client";

const initialForm = {
  vehicleName: "", slug: "", pricePerKm: "", sortOrder: "0", seats: "", bags: "", acType: "", pricingType: "",
  description: "", vehicleImage: "", catalogStatus: "INACTIVE", featured: false, vehicleType: "", registrationNumber: "",
  capacity: "4", rcExpiry: "", insuranceExpiry: "", permitExpiry: "", assignedDriverId: "", isAvailable: true,
};

export function VehicleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<any>(null);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function load() {
    apiClient
      .get(`/vehicles/${id}`)
      .then(({ data }) => {
        const v = data.data;
        setVehicle(v);
        setForm({
          vehicleName: v.vehicleName ?? v.vehicleType ?? "",
          slug: v.slug ?? "",
          pricePerKm: String(v.pricePerKm ?? 0),
          sortOrder: String(v.sortOrder ?? 0),
          seats: String(v.seats ?? v.capacity ?? ""),
          bags: String(v.bags ?? 0),
          acType: v.acType ?? "",
          pricingType: v.pricingType ?? "",
          description: v.description ?? "",
          vehicleImage: v.vehicleImage ?? "",
          catalogStatus: v.catalogStatus ?? "INACTIVE",
          featured: Boolean(v.featured),
          vehicleType: v.vehicleType ?? "",
          registrationNumber: v.registrationNumber ?? "",
          capacity: String(v.capacity ?? 4),
          rcExpiry: v.rcExpiry ? new Date(v.rcExpiry).toISOString().slice(0, 10) : "",
          insuranceExpiry: v.insuranceExpiry ? new Date(v.insuranceExpiry).toISOString().slice(0, 10) : "",
          permitExpiry: v.permitExpiry ? new Date(v.permitExpiry).toISOString().slice(0, 10) : "",
          assignedDriverId: v.assignedDriverId ?? "",
          isAvailable: v.isAvailable,
        });
      })
      .catch(() => setError("Could not load vehicle details."));
  }

  useEffect(() => {
    load();
    apiClient.get("/drivers").then(({ data }) => setDrivers(data.data ?? [])).catch(() => setDrivers([]));
  }, [id]);

  function update(field: string, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function save() {
    try {
      setSaving(true);
      setError("");
      await apiClient.patch(`/vehicles/${id}`, {
        ...form,
        pricePerKm: Number(form.pricePerKm),
        sortOrder: Number(form.sortOrder),
        seats: Number(form.seats),
        bags: Number(form.bags),
        capacity: Number(form.capacity),
        assignedDriverId: form.assignedDriverId || undefined,
        rcExpiry: form.rcExpiry || undefined,
        insuranceExpiry: form.insuranceExpiry || undefined,
        permitExpiry: form.permitExpiry || undefined,
      });
      setEditing(false);
      load();
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Could not update vehicle.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm("Delete this vehicle permanently?")) return;
    try {
      await apiClient.delete(`/vehicles/${id}`);
      navigate("/app/vehicles", { replace: true });
    } catch (err: any) {
      window.alert(err.response?.data?.message ?? "Could not delete vehicle.");
    }
  }

  if (!vehicle) {
    return (
      <Box sx={{ p: 4, minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography variant="body1" color="text.secondary" fontWeight={600}>
          {error || "Loading vehicle details..."}
        </Typography>
      </Box>
    );
  }

  const field = (label: string, key: keyof typeof initialForm, type = "text") => (
    <TextField
      fullWidth
      label={label}
      type={type}
      value={form[key] as string}
      onChange={(e) => update(key, e.target.value)}
      InputLabelProps={type === "date" ? { shrink: true } : undefined}
    />
  );

  return (
    <Box sx={{ p: { xs: 2.5, md: 4 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      {/* Top Meta Bar */}
      <Box display="flex" alignItems="center" gap={1.5} mb={2.5}>
        <Tooltip title="Back to Fleet">
          <IconButton
            onClick={() => navigate("/app/vehicles")}
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
          FLEET ASSET / {vehicle.registrationNumber}
        </Typography>
      </Box>

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3.5} gap={2} flexWrap="wrap">
        <Box display="flex" alignItems="center" gap={1.75}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              background: "linear-gradient(135deg, #0284c7 0%, #0c4a6e 100%)",
              boxShadow: "0 4px 14px rgba(2, 132, 199, 0.35)",
            }}
          >
            <DirectionsCarRoundedIcon sx={{ color: "#fff", fontSize: 26 }} />
          </Avatar>
          <Box>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Typography variant="h4" fontWeight={900} sx={{ color: "#0f172a", letterSpacing: "-0.03em" }}>
                {editing ? "Edit Vehicle Asset" : (vehicle.vehicleName ?? vehicle.vehicleType)}
              </Typography>
              <Chip
                size="small"
                label={vehicle.catalogStatus ?? "INACTIVE"}
                sx={{
                  bgcolor: vehicle.catalogStatus === "ACTIVE" ? "#ecfdf5" : "#f1f5f9",
                  color: vehicle.catalogStatus === "ACTIVE" ? "#059669" : "#64748b",
                  fontWeight: 800,
                  fontSize: "0.75rem",
                  borderRadius: "8px",
                }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Plate: <strong>{vehicle.registrationNumber}</strong> · Category: {vehicle.vehicleType}
            </Typography>
          </Box>
        </Box>

        <Box display="flex" gap={1.5}>
          <Button
            variant="outlined"
            startIcon={<EditRoundedIcon />}
            onClick={() => setEditing(!editing)}
            sx={{
              bgcolor: "#ffffff",
              borderColor: "#e2e8f0",
              color: "#334155",
              fontWeight: 700,
              borderRadius: 2,
              textTransform: "none",
            }}
          >
            {editing ? "Cancel Editing" : "Edit Specifications"}
          </Button>
          <Button
            color="error"
            variant="outlined"
            startIcon={<DeleteOutlineRoundedIcon />}
            onClick={remove}
            sx={{
              fontWeight: 700,
              borderRadius: 2,
              textTransform: "none",
            }}
          >
            Delete Asset
          </Button>
        </Box>
      </Box>

      {/* Main Asset Sheet */}
      <Paper elevation={0} sx={{ p: { xs: 2.5, md: 4 }, maxWidth: 880, borderRadius: 3, border: "1px solid #e2e8f0", bgcolor: "#ffffff" }}>
        {error && <Typography color="error" mb={2}>{error}</Typography>}

        {editing ? (
          <>
            <Typography variant="subtitle2" fontWeight={800} color="#0f172a" mb={2}>
              Customer Catalog Information
            </Typography>
            <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }} gap={2} mb={3}>
              {field("Vehicle Display Name", "vehicleName")}
              {field("Public Catalog Slug", "slug")}
              {field("Base Rate Per KM (₹)", "pricePerKm", "number")}
              {field("Catalog Display Order", "sortOrder", "number")}
              {field("Passenger Seats", "seats", "number")}
              {field("Luggage Capacity (Bags)", "bags", "number")}
              <TextField
                select
                label="Climate Control (AC)"
                value={form.acType}
                onChange={(e) => update("acType", e.target.value)}
              >
                <MenuItem value="">Not set</MenuItem>
                <MenuItem value="AC">Air Conditioned (AC)</MenuItem>
                <MenuItem value="NON_AC">Non Air Conditioned</MenuItem>
              </TextField>
              <TextField
                select
                label="Billing Model"
                value={form.pricingType}
                onChange={(e) => update("pricingType", e.target.value)}
              >
                <MenuItem value="">Not set</MenuItem>
                <MenuItem value="PER_KM">Per Kilometer</MenuItem>
                <MenuItem value="PER_DAY">Per Day (8h/80km)</MenuItem>
                <MenuItem value="FIXED">Fixed Trip Rate</MenuItem>
              </TextField>
            </Box>

            <Typography variant="subtitle2" fontWeight={800} color="#0f172a" mb={2}>
              Compliance & Fleet Details
            </Typography>
            {field("Vehicle Model / Category", "vehicleType")}
            <Box mt={2} mb={2}>
              {field("License Plate Number", "registrationNumber")}
            </Box>

            <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr 1fr" }} gap={2} mb={2}>
              {field("RC Expiry", "rcExpiry", "date")}
              {field("Insurance Expiry", "insuranceExpiry", "date")}
              {field("Permit Expiry", "permitExpiry", "date")}
            </Box>

            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Vehicle Fleet Notes / Description"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              sx={{ mb: 2 }}
            />

            <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }} gap={2} mb={2}>
              <TextField
                select
                label="Listing Status"
                value={form.catalogStatus}
                onChange={(e) => update("catalogStatus", e.target.value)}
              >
                <MenuItem value="ACTIVE">Active in Booking Engine</MenuItem>
                <MenuItem value="INACTIVE">Hidden / Inactive</MenuItem>
              </TextField>
              <TextField
                select
                label="Featured Tag"
                value={form.featured ? "YES" : "NO"}
                onChange={(e) => update("featured", e.target.value === "YES")}
              >
                <MenuItem value="YES">Yes, Feature in Catalog</MenuItem>
                <MenuItem value="NO">Standard Listing</MenuItem>
              </TextField>
            </Box>

            <TextField
              select
              fullWidth
              label="Default Assigned Chauffeur"
              value={form.assignedDriverId}
              onChange={(e) => update("assignedDriverId", e.target.value)}
              sx={{ mb: 3 }}
            >
              <MenuItem value="">Unassigned</MenuItem>
              {drivers.map((driver) => (
                <MenuItem key={driver.id} value={driver.id}>
                  {driver.name}
                </MenuItem>
              ))}
            </TextField>

            <Button
              variant="contained"
              startIcon={<SaveRoundedIcon />}
              onClick={save}
              disabled={saving || !form.vehicleType || !form.registrationNumber}
              sx={{
                background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                fontWeight: 700,
                borderRadius: 2,
                px: 3,
                py: 1,
              }}
            >
              {saving ? "Saving Changes..." : "Save Vehicle Changes"}
            </Button>
          </>
        ) : (
          <>
            {vehicle.vehicleImage && (
              <Box
                component="img"
                src={vehicle.vehicleImage}
                alt={vehicle.vehicleName ?? vehicle.vehicleType}
                sx={{
                  width: "100%",
                  maxHeight: 280,
                  objectFit: "cover",
                  borderRadius: 2.5,
                  mb: 3,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                }}
              />
            )}

            <Box display="flex" gap={1.25} mb={3}>
              <Chip
                label={vehicle.catalogStatus ?? "INACTIVE"}
                sx={{
                  bgcolor: vehicle.catalogStatus === "ACTIVE" ? "#ecfdf5" : "#f1f5f9",
                  color: vehicle.catalogStatus === "ACTIVE" ? "#059669" : "#64748b",
                  fontWeight: 800,
                  borderRadius: "6px",
                }}
              />
              <Chip
                label={vehicle.featured ? "★ Featured" : "Standard"}
                sx={{
                  bgcolor: vehicle.featured ? "#fef3c7" : "#f8fafc",
                  color: vehicle.featured ? "#b45309" : "#64748b",
                  fontWeight: 800,
                  borderRadius: "6px",
                }}
              />
              <Chip
                label={vehicle.isAvailable ? "Available for Dispatch" : "On Duty / Unavailable"}
                sx={{
                  bgcolor: vehicle.isAvailable ? "#eff6ff" : "#fef2f2",
                  color: vehicle.isAvailable ? "#1d4ed8" : "#b91c1c",
                  fontWeight: 800,
                  borderRadius: "6px",
                }}
              />
            </Box>

            <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }} gap={2.5}>
              <Box p={2} sx={{ bgcolor: "#f8fafc", borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  VEHICLE NAME
                </Typography>
                <Typography variant="body1" fontWeight={800} color="#0f172a">
                  {vehicle.vehicleName ?? vehicle.vehicleType}
                </Typography>
              </Box>

              <Box p={2} sx={{ bgcolor: "#f8fafc", borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  BASE TARIFF RATE
                </Typography>
                <Typography variant="body1" fontWeight={800} color="#0284c7">
                  ₹{vehicle.pricePerKm ?? 0} / KM
                </Typography>
              </Box>

              <Box p={2} sx={{ bgcolor: "#f8fafc", borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  PASSENGER & LUGGAGE CAPACITY
                </Typography>
                <Typography variant="body1" fontWeight={800} color="#0f172a">
                  {vehicle.seats ?? vehicle.capacity} Passengers · {vehicle.bags ?? 0} Luggage Bags
                </Typography>
              </Box>

              <Box p={2} sx={{ bgcolor: "#f8fafc", borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  CLIMATE & BILLING
                </Typography>
                <Typography variant="body1" fontWeight={800} color="#0f172a">
                  {vehicle.acType ?? "AC"} · {vehicle.pricingType ?? "Per KM"}
                </Typography>
              </Box>

              <Box p={2} sx={{ bgcolor: "#f8fafc", borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  REGISTRATION NUMBER
                </Typography>
                <Typography variant="body1" fontWeight={800} color="#0f172a">
                  {vehicle.registrationNumber}
                </Typography>
              </Box>

              <Box p={2} sx={{ bgcolor: "#f8fafc", borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  ASSIGNED CHAUFFEUR
                </Typography>
                <Typography variant="body1" fontWeight={800} color="#0f172a">
                  {vehicle.assignedDriver?.name ?? "Unassigned"}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 3, borderColor: "#f1f5f9" }} />

            <Typography variant="subtitle2" fontWeight={800} color="#0f172a" mb={0.5}>
              Fleet Notes
            </Typography>
            <Typography variant="body2" color="#64748b">
              {vehicle.description || "No specific fleet notes or amenities listed for this vehicle."}
            </Typography>
          </>
        )}
      </Paper>
    </Box>
  );
}