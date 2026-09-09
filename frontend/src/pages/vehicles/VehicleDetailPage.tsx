import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Button, Chip, Divider, MenuItem, Paper, TextField, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
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
    apiClient.get(`/vehicles/${id}`).then(({ data }) => {
      const v = data.data;
      setVehicle(v);
      setForm({
        vehicleName: v.vehicleName ?? v.vehicleType ?? "", slug: v.slug ?? "", pricePerKm: String(v.pricePerKm ?? 0), sortOrder: String(v.sortOrder ?? 0),
        seats: String(v.seats ?? v.capacity ?? ""), bags: String(v.bags ?? 0), acType: v.acType ?? "", pricingType: v.pricingType ?? "", description: v.description ?? "", vehicleImage: v.vehicleImage ?? "",
        catalogStatus: v.catalogStatus ?? "INACTIVE", featured: Boolean(v.featured), vehicleType: v.vehicleType ?? "", registrationNumber: v.registrationNumber ?? "", capacity: String(v.capacity ?? 4),
        rcExpiry: v.rcExpiry ? new Date(v.rcExpiry).toISOString().slice(0, 10) : "", insuranceExpiry: v.insuranceExpiry ? new Date(v.insuranceExpiry).toISOString().slice(0, 10) : "", permitExpiry: v.permitExpiry ? new Date(v.permitExpiry).toISOString().slice(0, 10) : "", assignedDriverId: v.assignedDriverId ?? "", isAvailable: v.isAvailable,
      });
    }).catch(() => setError("Could not load vehicle details."));
  }

  useEffect(() => { load(); apiClient.get("/drivers").then(({ data }) => setDrivers(data.data ?? [])).catch(() => setDrivers([])); }, [id]);

  function update(field: string, value: string | boolean) { setForm((current) => ({ ...current, [field]: value })); }

  async function save() {
    try {
      setSaving(true); setError("");
      await apiClient.patch(`/vehicles/${id}`, {
        ...form, pricePerKm: Number(form.pricePerKm), sortOrder: Number(form.sortOrder), seats: Number(form.seats), bags: Number(form.bags), capacity: Number(form.capacity),
        assignedDriverId: form.assignedDriverId || undefined, rcExpiry: form.rcExpiry || undefined, insuranceExpiry: form.insuranceExpiry || undefined, permitExpiry: form.permitExpiry || undefined,
      });
      setEditing(false); load();
    } catch (err: any) { setError(err.response?.data?.message ?? "Could not update vehicle."); } finally { setSaving(false); }
  }

  async function remove() {
    if (!window.confirm("Delete this vehicle permanently?")) return;
    try { await apiClient.delete(`/vehicles/${id}`); navigate("/app/vehicles", { replace: true }); }
    catch (err: any) { window.alert(err.response?.data?.message ?? "Could not delete vehicle."); }
  }

  if (!vehicle) return <Box p={4}>{error || "Loading vehicle..."}</Box>;

  const field = (label: string, key: keyof typeof initialForm, type = "text") => <TextField fullWidth label={label} type={type} value={form[key] as string} onChange={(e) => update(key, e.target.value)} InputLabelProps={type === "date" ? { shrink: true } : undefined} />;

  return (
    <Box sx={{ p: { xs: 2.5, md: 4.5 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate("/app/vehicles")} sx={{ mb: 2 }}>Back to Fleet</Button>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} gap={2} flexWrap="wrap">
        <Box><Typography variant="h4" fontWeight={900}>{editing ? "Edit Vehicle" : (vehicle.vehicleName ?? vehicle.vehicleType)}</Typography><Typography color="text.secondary">{vehicle.registrationNumber} · {vehicle.slug || "Fleet vehicle"}</Typography></Box>
        <Box display="flex" gap={1}><Button variant="outlined" startIcon={<EditRoundedIcon />} onClick={() => setEditing(!editing)}>{editing ? "Cancel" : "Edit Vehicle"}</Button><Button color="error" variant="outlined" startIcon={<DeleteOutlineRoundedIcon />} onClick={remove}>Delete Vehicle</Button></Box>
      </Box>
      <Paper sx={{ p: { xs: 2.5, md: 4 }, maxWidth: 920 }}>
        {error && <Typography color="error" mb={2}>{error}</Typography>}
        {editing ? <>
          <Typography variant="overline" color="text.secondary">Vehicle Catalog Details</Typography>
          <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }} gap={2} mb={3}>
            {field("Vehicle Name", "vehicleName")}{field("Slug", "slug")}{field("Price Per KM", "pricePerKm", "number")}{field("Sort Order", "sortOrder", "number")}{field("Seats", "seats", "number")}{field("Bags", "bags", "number")}
            <TextField select label="AC Type" value={form.acType} onChange={(e) => update("acType", e.target.value)}><MenuItem value="">Not set</MenuItem><MenuItem value="AC">AC</MenuItem><MenuItem value="NON_AC">Non AC</MenuItem></TextField>
            <TextField select label="Pricing Type" value={form.pricingType} onChange={(e) => update("pricingType", e.target.value)}><MenuItem value="">Not set</MenuItem><MenuItem value="PER_KM">Per KM</MenuItem><MenuItem value="PER_DAY">Per Day</MenuItem><MenuItem value="FIXED">Fixed</MenuItem></TextField>
          </Box>
          {field("Vehicle Model / Type", "vehicleType")}
          <Box mt={2} mb={2}>{field("Registration Number", "registrationNumber")}</Box>
          <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr 1fr" }} gap={2} mb={2}>{field("RC Expiry", "rcExpiry", "date")}{field("Insurance Expiry", "insuranceExpiry", "date")}{field("Permit Expiry", "permitExpiry", "date")}</Box>
          <TextField fullWidth multiline minRows={3} label="Description" value={form.description} onChange={(e) => update("description", e.target.value)} sx={{ mb: 2 }} />
          <Button component="label" variant="outlined" sx={{ mb: 2, textTransform: "none" }}>{form.vehicleImage ? "Replace Vehicle Image" : "Choose Vehicle Image"}<input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => update("vehicleImage", String(reader.result ?? "")); reader.readAsDataURL(file); }} /></Button>
          <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }} gap={2} mb={2}><TextField select label="Status" value={form.catalogStatus} onChange={(e) => update("catalogStatus", e.target.value)}><MenuItem value="ACTIVE">Active</MenuItem><MenuItem value="INACTIVE">Inactive</MenuItem></TextField><TextField select label="Featured" value={form.featured ? "YES" : "NO"} onChange={(e) => update("featured", e.target.value === "YES")}><MenuItem value="YES">Yes</MenuItem><MenuItem value="NO">No</MenuItem></TextField></Box>
          <TextField select fullWidth label="Assigned Driver" value={form.assignedDriverId} onChange={(e) => update("assignedDriverId", e.target.value)} sx={{ mb: 3 }}><MenuItem value="">Unassigned</MenuItem>{drivers.map((driver) => <MenuItem key={driver.id} value={driver.id}>{driver.name}</MenuItem>)}</TextField>
          <Button variant="contained" startIcon={<SaveRoundedIcon />} onClick={save} disabled={saving || !form.vehicleType || !form.registrationNumber}>{saving ? "Saving..." : "Save Vehicle"}</Button>
        </> : <>
          {vehicle.vehicleImage && <Box component="img" src={vehicle.vehicleImage} alt={vehicle.vehicleName ?? vehicle.vehicleType} sx={{ width: "100%", maxHeight: 260, objectFit: "cover", borderRadius: 2, mb: 3 }} />}
          <Box display="flex" gap={1} mb={3}><Chip label={vehicle.catalogStatus ?? "INACTIVE"} color={vehicle.catalogStatus === "ACTIVE" ? "success" : "default"} /><Chip label={vehicle.featured ? "Featured" : "Standard"} /><Chip label={vehicle.isAvailable ? "Available" : "Unavailable"} /></Box>
          <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }} gap={2}><Typography><b>Vehicle Name:</b> {vehicle.vehicleName ?? "—"}</Typography><Typography><b>Slug:</b> {vehicle.slug ?? "—"}</Typography><Typography><b>Price per KM:</b> ₹{vehicle.pricePerKm ?? 0}</Typography><Typography><b>Sort Order:</b> {vehicle.sortOrder ?? 0}</Typography><Typography><b>Seats:</b> {vehicle.seats ?? vehicle.capacity}</Typography><Typography><b>Bags:</b> {vehicle.bags ?? "—"}</Typography><Typography><b>AC Type:</b> {vehicle.acType ?? "—"}</Typography><Typography><b>Pricing Type:</b> {vehicle.pricingType ?? "—"}</Typography><Typography><b>Registration:</b> {vehicle.registrationNumber}</Typography><Typography><b>Assigned Driver:</b> {vehicle.assignedDriver?.name ?? "Unassigned"}</Typography></Box>
          <Divider sx={{ my: 3 }} /><Typography><b>Description:</b> {vehicle.description || "No description added."}</Typography>
        </>}
      </Paper>
    </Box>
  );
}