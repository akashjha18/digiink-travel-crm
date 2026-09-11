import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Alert,
  InputAdornment,
  Avatar,
  TablePagination,
  IconButton,
  Tooltip,
  CircularProgress,
  Grid,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import DirectionsCarRoundedIcon from "@mui/icons-material/DirectionsCarRounded";
import AirlineSeatReclineNormalRoundedIcon from "@mui/icons-material/AirlineSeatReclineNormalRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import EventBusyRoundedIcon from "@mui/icons-material/EventBusyRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import { apiClient } from "../../api/client";

function expiryChip(date: string | null) {
  if (!date) {
    return (
      <Chip
        size="small"
        label="Not set"
        sx={{
          fontWeight: 600,
          fontSize: "0.72rem",
          bgcolor: "#f1f5f9",
          color: "#64748b",
          borderRadius: "6px",
        }}
      />
    );
  }

  const days = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
  const formattedDate = new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (days < 0) {
    return (
      <Chip
        size="small"
        icon={<EventBusyRoundedIcon style={{ fontSize: 13 }} />}
        label={`Expired ${formattedDate}`}
        sx={{
          fontWeight: 700,
          fontSize: "0.72rem",
          bgcolor: "#fef2f2",
          color: "#b91c1c",
          border: "1px solid #fecaca",
          borderRadius: "6px",
        }}
      />
    );
  }

  if (days <= 30) {
    return (
      <Chip
        size="small"
        icon={<WarningAmberRoundedIcon style={{ fontSize: 13 }} />}
        label={`Expires in ${days}d`}
        sx={{
          fontWeight: 700,
          fontSize: "0.72rem",
          bgcolor: "#fffbeb",
          color: "#b45309",
          border: "1px solid #fde68a",
          borderRadius: "6px",
        }}
      />
    );
  }

  return (
    <Chip
      size="small"
      label={formattedDate}
      sx={{
        fontWeight: 600,
        fontSize: "0.72rem",
        bgcolor: "#f8fafc",
        border: "1px solid #e2e8f0",
        color: "#334155",
        borderRadius: "6px",
      }}
    />
  );
}

export function VehiclesPage() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [imageName, setImageName] = useState("");

  const [form, setForm] = useState({
    vehicleType: "",
    vehicleName: "",
    slug: "",
    pricePerKm: 0,
    sortOrder: 0,
    seats: 4,
    bags: 0,
    acType: "",
    pricingType: "",
    description: "",
    vehicleImage: "",
    catalogStatus: "INACTIVE",
    featured: false,
    registrationNumber: "",
    capacity: 4,
    rcExpiry: "",
    insuranceExpiry: "",
    permitExpiry: "",
    assignedDriverId: "",
  });

  function load() {
    setLoading(true);
    apiClient
      .get("/vehicles")
      .then(({ data }) => setVehicles(data.data ?? []))
      .catch(() => setVehicles([]))
      .finally(() => setLoading(false));

    apiClient
      .get("/vehicles/alerts/expiring")
      .then(({ data }) => setAlerts(data.data ?? []))
      .catch(() => {});

    apiClient
      .get("/drivers")
      .then(({ data }) => setDrivers(data.data ?? []))
      .catch(() => {});
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate() {
    try {
      setCreating(true);
      await apiClient.post("/vehicles", {
        ...form,
        capacity: Number(form.capacity),
        pricePerKm: Number(form.pricePerKm),
        sortOrder: Number(form.sortOrder),
        seats: Number(form.seats),
        bags: Number(form.bags),
        assignedDriverId: form.assignedDriverId || undefined,
        rcExpiry: form.rcExpiry || undefined,
        insuranceExpiry: form.insuranceExpiry || undefined,
        permitExpiry: form.permitExpiry || undefined,
      });
      setOpen(false);
      setForm({
        vehicleType: "",
        registrationNumber: "",
        capacity: 4,
        rcExpiry: "",
        insuranceExpiry: "",
        permitExpiry: "",
        assignedDriverId: "",
        vehicleName: "",
        slug: "",
        pricePerKm: 0,
        sortOrder: 0,
        seats: 4,
        bags: 0,
        acType: "",
        pricingType: "",
        description: "",
        vehicleImage: "",
        catalogStatus: "INACTIVE",
        featured: false,
      });
      setImageName("");
      load();
    } finally {
      setCreating(false);
    }
  }

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const q = searchQuery.toLowerCase();
      const reg = v.registrationNumber?.toLowerCase() ?? "";
      const type = v.vehicleType?.toLowerCase() ?? "";
      const driver = v.assignedDriver?.name?.toLowerCase() ?? "";
      return reg.includes(q) || type.includes(q) || driver.includes(q);
    });
  }, [vehicles, searchQuery]);

  const paginatedVehicles = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredVehicles.slice(start, start + rowsPerPage);
  }, [filteredVehicles, page, rowsPerPage]);

  const stats = useMemo(() => {
    const total = vehicles.length;
    const withDriver = vehicles.filter((v) => v.assignedDriver).length;
    const documentAlerts = alerts.length;
    const activeCatalog = vehicles.filter((v) => v.catalogStatus === "ACTIVE").length;
    return { total, withDriver, documentAlerts, activeCatalog };
  }, [vehicles, alerts]);

  return (
    <Box sx={{ p: { xs: 2.5, md: 4.5 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      {/* Top Header */}
      <Box
        display="flex"
        flexDirection={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        gap={2}
        mb={3}
      >
        <Box>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Typography variant="h4" fontWeight={900} sx={{ color: "#0f172a", letterSpacing: "-0.03em" }}>
              Fleet Vehicles
            </Typography>
            <Chip
              label={`${vehicles.length} Units`}
              size="small"
              icon={<LocalShippingRoundedIcon style={{ fontSize: 14 }} />}
              sx={{
                bgcolor: "rgba(2, 132, 199, 0.1)",
                color: "#0284c7",
                fontWeight: 800,
                fontSize: "0.72rem",
                borderRadius: "6px",
                border: "1px solid rgba(2, 132, 199, 0.2)",
              }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Monitor transport inventory, seating capacity, driver assignments, and statutory document renewals.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => setOpen(true)}
          sx={{
            background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
            borderRadius: 2.5,
            px: 2.75,
            py: 1,
            textTransform: "none",
            fontWeight: 800,
            boxShadow: "0 4px 14px rgba(2, 132, 199, 0.35)",
            "&:hover": {
              background: "linear-gradient(135deg, #0369a1 0%, #075985 100%)",
              transform: "translateY(-1px)",
            },
          }}
        >
          Add Vehicle
        </Button>
      </Box>

      {/* KPI Stats Strip */}
      <Box
        display="grid"
        gridTemplateColumns={{ xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }}
        gap={2}
        mb={3}
      >
        <Paper
          sx={{
            p: 2.25,
            border: "1px solid #e2e8f0",
            borderRadius: 3,
            bgcolor: "#ffffff",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Avatar sx={{ bgcolor: "rgba(2, 132, 199, 0.1)", color: "#0284c7", borderRadius: 2.5, width: 44, height: 44 }}>
            <LocalShippingRoundedIcon />
          </Avatar>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Total Fleet
            </Typography>
            <Typography variant="h5" fontWeight={900} color="#0f172a">
              {stats.total}
            </Typography>
          </Box>
        </Paper>

        <Paper
          sx={{
            p: 2.25,
            border: "1px solid #e2e8f0",
            borderRadius: 3,
            bgcolor: "#ffffff",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Avatar sx={{ bgcolor: "rgba(16, 185, 129, 0.1)", color: "#10b981", borderRadius: 2.5, width: 44, height: 44 }}>
            <BadgeRoundedIcon />
          </Avatar>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Driver Assigned
            </Typography>
            <Typography variant="h5" fontWeight={900} color="#0f172a">
              {stats.withDriver}
            </Typography>
          </Box>
        </Paper>

        <Paper
          sx={{
            p: 2.25,
            border: "1px solid #e2e8f0",
            borderRadius: 3,
            bgcolor: "#ffffff",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Avatar sx={{ bgcolor: "rgba(249, 115, 22, 0.1)", color: "#f97316", borderRadius: 2.5, width: 44, height: 44 }}>
            <DirectionsCarRoundedIcon />
          </Avatar>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Catalog Active
            </Typography>
            <Typography variant="h5" fontWeight={900} color="#0f172a">
              {stats.activeCatalog}
            </Typography>
          </Box>
        </Paper>

        <Paper
          sx={{
            p: 2.25,
            border: "1px solid #e2e8f0",
            borderRadius: 3,
            bgcolor: "#ffffff",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Avatar sx={{ bgcolor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", borderRadius: 2.5, width: 44, height: 44 }}>
            <WarningAmberRoundedIcon />
          </Avatar>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Renewal Alerts
            </Typography>
            <Typography variant="h5" fontWeight={900} color={stats.documentAlerts > 0 ? "#ef4444" : "#0f172a"}>
              {stats.documentAlerts}
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* Compliance / Expiry Alert Banner */}
      {alerts.length > 0 && (
        <Alert
          severity="warning"
          icon={<WarningAmberRoundedIcon fontSize="inherit" />}
          sx={{
            mb: 3,
            borderRadius: 2.5,
            border: "1px solid #fde68a",
            bgcolor: "#fffbeb",
            color: "#92400e",
            fontWeight: 600,
            "& .MuiAlert-icon": { color: "#d97706" },
          }}
        >
          Compliance Warning: <strong>{alerts.length}</strong> vehicle
          {alerts.length > 1 ? "s have" : " has"} statutory documents (RC, Insurance, or Permit) expiring within 30 days or already lapsed.
        </Alert>
      )}

      {/* Search & Action Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
          border: "1px solid #e2e8f0",
          bgcolor: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <TextField
          size="small"
          placeholder="Search by registration plate, vehicle model, driver..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(0);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" sx={{ color: "#94a3b8" }} />
              </InputAdornment>
            ),
          }}
          sx={{
            flex: { xs: "1 1 100%", sm: "0 1 380px" },
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              bgcolor: "#f8fafc",
            },
          }}
        />

        <Tooltip title="Refresh Fleet">
          <span>
            <IconButton
              onClick={load}
              disabled={loading}
              sx={{
                bgcolor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 2,
                "&:hover": { bgcolor: "#f1f5f9" },
              }}
            >
              <RefreshRoundedIcon fontSize="small" sx={{ color: "#475569" }} />
            </IconButton>
          </span>
        </Tooltip>
      </Paper>

      {/* Main Vehicles Table */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3.5,
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          bgcolor: "#ffffff",
          boxShadow: "0 4px 16px rgba(16, 24, 40, 0.03)",
        }}
      >
        <Table sx={{ minWidth: 850 }}>
          <TableHead sx={{ bgcolor: "#fafcff" }}>
            <TableRow sx={{ borderBottom: "1px solid #eef2f6" }}>
              <TableCell sx={{ fontWeight: 800, color: "#64748b", py: 2.2, px: 3, fontSize: "0.75rem", letterSpacing: "0.06em" }}>
                REGISTRATION PLATE
              </TableCell>
              <TableCell sx={{ fontWeight: 800, color: "#64748b", py: 2.2, fontSize: "0.75rem", letterSpacing: "0.06em" }}>
                MODEL & TYPE
              </TableCell>
              <TableCell sx={{ fontWeight: 800, color: "#64748b", py: 2.2, fontSize: "0.75rem", letterSpacing: "0.06em" }}>
                SEATING CAPACITY
              </TableCell>
              <TableCell sx={{ fontWeight: 800, color: "#64748b", py: 2.2, fontSize: "0.75rem", letterSpacing: "0.06em" }}>
                RC EXPIRY
              </TableCell>
              <TableCell sx={{ fontWeight: 800, color: "#64748b", py: 2.2, fontSize: "0.75rem", letterSpacing: "0.06em" }}>
                INSURANCE
              </TableCell>
              <TableCell sx={{ fontWeight: 800, color: "#64748b", py: 2.2, fontSize: "0.75rem", letterSpacing: "0.06em" }}>
                PERMIT
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: "#64748b", py: 2.2, px: 3, fontSize: "0.75rem", letterSpacing: "0.06em" }}>
                ACTIONS
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedVehicles.map((v) => (
              <TableRow
                key={v.id}
                hover
                sx={{
                  transition: "background-color 0.15s ease",
                  "&:hover": { bgcolor: "#fbfcfe !important" },
                  "&:last-child td": { border: 0 },
                }}
              >
                {/* Plate & Icon */}
                <TableCell sx={{ py: 2, px: 3 }}>
                  <Box display="flex" alignItems="center" gap={1.75}>
                    <Avatar
                      src={v.vehicleImage || undefined}
                      sx={{
                        width: 38,
                        height: 38,
                        bgcolor: "#eff6ff",
                        color: "#2563eb",
                        borderRadius: 2,
                      }}
                    >
                      <DirectionsCarRoundedIcon fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography
                        variant="body2"
                        fontFamily="monospace"
                        fontWeight={900}
                        sx={{
                          bgcolor: "#f1f5f9",
                          px: 1,
                          py: 0.25,
                          borderRadius: 1.5,
                          color: "#0f172a",
                          display: "inline-block",
                          letterSpacing: "0.02em",
                        }}
                      >
                        {v.registrationNumber}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>

                {/* Model & Type */}
                <TableCell sx={{ py: 2 }}>
                  <Typography variant="body2" fontWeight={700} color="#1e293b">
                    {v.vehicleType}
                  </Typography>
                </TableCell>

                {/* Capacity */}
                <TableCell sx={{ py: 2 }}>
                  <Box display="flex" alignItems="center" gap={0.75}>
                    <AirlineSeatReclineNormalRoundedIcon sx={{ fontSize: 16, color: "#94a3b8" }} />
                    <Typography variant="body2" fontWeight={600} color="#334155">
                      {v.capacity} Seats
                    </Typography>
                  </Box>
                </TableCell>

                {/* Statutory Renewals */}
                <TableCell sx={{ py: 2 }}>{expiryChip(v.rcExpiry)}</TableCell>
                <TableCell sx={{ py: 2 }}>{expiryChip(v.insuranceExpiry)}</TableCell>
                <TableCell sx={{ py: 2 }}>{expiryChip(v.permitExpiry)}</TableCell>

                {/* Assigned Driver */}
                <TableCell align="right" sx={{ py: 2, px: 3 }}>
                  <Box display="inline-flex" alignItems="center" gap={0.75}>
                    <BadgeRoundedIcon sx={{ fontSize: 15, color: "#94a3b8" }} />
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color={v.assignedDriver ? "#1e293b" : "#94a3b8"}
                    >
                      {v.assignedDriver?.name ?? "Unassigned"}
                    </Typography>
                    <Button size="small" onClick={() => navigate(`/app/vehicles/${v.id}`)} sx={{ textTransform: "none", ml: 1 }}>View</Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}

            {filteredVehicles.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} sx={{ py: 8, textAlign: "center" }}>
                  <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                    <Avatar
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: "#eff6ff",
                        color: "#2563eb",
                        mb: 0.5,
                      }}
                    >
                      <LocalShippingRoundedIcon fontSize="medium" />
                    </Avatar>
                    <Typography variant="body1" fontWeight={700} sx={{ color: "#0f172a" }}>
                      {searchQuery ? "No matching vehicles found" : "No vehicles in inventory"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {searchQuery
                        ? "Check plate registration formatting or model keywords."
                        : "Enroll vehicles to link inventory to quotes, trips, and driver rosters."}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredVehicles.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          sx={{ borderTop: "1px solid #f1f5f9" }}
        />
      </Paper>

      {/* Add Vehicle Modal */}
      <Dialog
        open={open}
        onClose={() => !creating && setOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3.5, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: "#0f172a", pb: 1 }}>
          Enroll Fleet Vehicle
        </DialogTitle>

        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: "10px !important" }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField size="small" label="Vehicle Name" placeholder="e.g. Toyota Etios" value={form.vehicleName} onChange={(e) => setForm({ ...form, vehicleName: e.target.value, vehicleType: e.target.value })} required fullWidth />
            </Grid>
            <Grid item xs={12} sm={7}>
              <TextField size="small" label="Slug" placeholder="toyota-etios" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} required fullWidth />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField size="small" label="Price Per KM" type="number" value={form.pricePerKm} onChange={(e) => setForm({ ...form, pricePerKm: Number(e.target.value) })} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField size="small" label="Seats" type="number" value={form.seats} onChange={(e) => setForm({ ...form, seats: Number(e.target.value), capacity: Number(e.target.value) })} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField size="small" label="Bags" type="number" value={form.bags} onChange={(e) => setForm({ ...form, bags: Number(e.target.value) })} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select size="small" label="AC Type" value={form.acType} onChange={(e) => setForm({ ...form, acType: e.target.value })} fullWidth><MenuItem value=""><em>Select AC Type</em></MenuItem><MenuItem value="AC">AC</MenuItem><MenuItem value="NON_AC">Non AC</MenuItem></TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select size="small" label="Pricing Type" value={form.pricingType} onChange={(e) => setForm({ ...form, pricingType: e.target.value })} fullWidth><MenuItem value=""><em>Select Pricing Type</em></MenuItem><MenuItem value="PER_KM">Per KM</MenuItem><MenuItem value="PER_DAY">Per Day</MenuItem><MenuItem value="FIXED">Fixed</MenuItem></TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField size="small" label="Sort Order" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} fullWidth />
            </Grid>
            <Grid item xs={12} sm={7}>
              <TextField
                size="small"
                label="Vehicle Model / Type"
                placeholder="e.g. Innova Crysta, Urbania, Sedan"
                value={form.vehicleType}
                onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
                required
                fullWidth
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField
                size="small"
                label="Seating Capacity"
                type="number"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                required
                fullWidth
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
            </Grid>
          </Grid>

          <TextField multiline minRows={3} size="small" label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth />
          <Button component="label" variant="outlined" sx={{ justifyContent: "flex-start", textTransform: "none" }}>
            {imageName || "Choose Vehicle Image"}
            <input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setImageName(file.name);
              const reader = new FileReader();
              reader.onload = () => setForm((current) => ({ ...current, vehicleImage: String(reader.result ?? "") }));
              reader.readAsDataURL(file);
            }} />
          </Button>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField select size="small" label="Status" value={form.catalogStatus} onChange={(e) => setForm({ ...form, catalogStatus: e.target.value })} fullWidth><MenuItem value="INACTIVE">Inactive</MenuItem><MenuItem value="ACTIVE">Active</MenuItem></TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select size="small" label="Featured" value={form.featured ? "YES" : "NO"} onChange={(e) => setForm({ ...form, featured: e.target.value === "YES" })} fullWidth><MenuItem value="NO">No</MenuItem><MenuItem value="YES">Yes</MenuItem></TextField>
            </Grid>
          </Grid>

          <TextField
            size="small"
            label="Registration Number"
            placeholder="e.g. DL-01-AB-1234"
            value={form.registrationNumber}
            onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
            required
            fullWidth
            sx={{
              "& .MuiOutlinedInput-root": { borderRadius: 2 },
              "& input": { textTransform: "uppercase", fontFamily: "monospace", fontWeight: 700 },
            }}
          />

          <Typography variant="caption" fontWeight={800} color="#64748b" textTransform="uppercase" letterSpacing="0.04em" mt={0.5}>
            Statutory Document Compliance (Optional)
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                size="small"
                label="RC Expiry"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.rcExpiry}
                onChange={(e) => setForm({ ...form, rcExpiry: e.target.value })}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                size="small"
                label="Insurance Expiry"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.insuranceExpiry}
                onChange={(e) => setForm({ ...form, insuranceExpiry: e.target.value })}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                size="small"
                label="Permit Expiry"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.permitExpiry}
                onChange={(e) => setForm({ ...form, permitExpiry: e.target.value })}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
              />
            </Grid>
          </Grid>

          <TextField
            select
            size="small"
            label="Assign Dedicated Driver (Optional)"
            value={form.assignedDriverId}
            onChange={(e) => setForm({ ...form, assignedDriverId: e.target.value })}
            fullWidth
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          >
            <MenuItem value="">
              <em>None (Unassigned)</em>
            </MenuItem>
            {drivers.map((d) => (
              <MenuItem key={d.id} value={d.id}>
                {d.name} {d.contact ? `(${d.contact})` : ""}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setOpen(false)}
            disabled={creating}
            sx={{ textTransform: "none", fontWeight: 600, color: "#64748b" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={creating || !form.vehicleType.trim() || !form.registrationNumber.trim()}
            startIcon={creating ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : null}
            sx={{
              bgcolor: "#2563eb",
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
              px: 2.5,
              "&:hover": { bgcolor: "#1d4ed8" },
            }}
          >
            {creating ? "Enrolling..." : "Save Vehicle"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}