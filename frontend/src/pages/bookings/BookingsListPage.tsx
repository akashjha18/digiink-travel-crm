import { useEffect, useState, useMemo, type FormEvent } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Chip,
  TextField,
  MenuItem,
  InputAdornment,
  Avatar,
  TablePagination,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
} from "@mui/material";
import { createFilterOptions } from "@mui/material/Autocomplete";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import DirectionsCarRoundedIcon from "@mui/icons-material/DirectionsCarRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { apiClient } from "../../api/client";
import { useAuth } from "../../hooks/useAuth";

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; color: string; border: string }
> = {
  CONFIRMED: { label: "Confirmed", bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  IN_PROGRESS: { label: "In Progress", bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
  COMPLETED: { label: "Completed", bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
  CANCELLED: { label: "Cancelled", bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" },
};

const STATUS_OPTIONS = ["CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
const filterCustomerOptions = createFilterOptions<any>();

export function BookingsListPage() {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    customerId: "", customerName: "", customerPhone: "", customerEmail: "", pickup: "", drop: "", travelStart: "", travelEnd: "", vehicleType: "",
    distance: "", duration: "", driverId: "", vehicleId: "", fare: "", status: "CONFIRMED", paymentStatus: "UNPAID", paidAmount: "", notes: "",
  });
  const [bookings, setBookings] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  function load() {
    setLoading(true);
    apiClient
      .get("/bookings", { params: statusFilter ? { status: statusFilter } : {} })
      .then(({ data }) => setBookings(data.data ?? []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [statusFilter]);

  async function createBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setCreateError("");
    try {
      const { data } = await apiClient.post("/bookings", {
        ...bookingForm,
        customerId: creatingCustomer ? undefined : bookingForm.customerId || undefined,
        customerName: creatingCustomer ? bookingForm.customerName : undefined,
        customerPhone: creatingCustomer ? bookingForm.customerPhone : undefined,
        customerEmail: creatingCustomer ? bookingForm.customerEmail || undefined : undefined,
        fareInPaise: Math.round(Number(bookingForm.fare) * 100),
        paidAmountInPaise: bookingForm.paidAmount ? Math.round(Number(bookingForm.paidAmount) * 100) : undefined,
        travelStart: bookingForm.travelStart || undefined,
        travelEnd: bookingForm.travelEnd || undefined,
        driverId: bookingForm.driverId || undefined,
        vehicleId: bookingForm.vehicleId || undefined,
      });
      navigate(`/app/bookings/${data.data.id}`);
    } catch (error: any) {
      setCreateError(error.response?.data?.message || "Could not create the booking.");
    } finally {
      setCreating(false);
    }
  }

  async function openCreateDialog() {
    setCreateError("");
    setCreateOpen(true);
    try {
      const { data } = await apiClient.get("/customers");
      setCustomers(data.data ?? []);
    } catch (error: any) {
      setCreateError(error.response?.data?.message || "Could not load customers.");
    }
    apiClient.get("/drivers").then(({ data }) => setDrivers(data.data ?? [])).catch(() => setDrivers([]));
    apiClient.get("/vehicles").then(({ data }) => setVehicles(data.data ?? [])).catch(() => setVehicles([]));
  }

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const q = searchQuery.toLowerCase();
      const customer = b.customer?.name?.toLowerCase() ?? "";
      const driver = b.driver?.name?.toLowerCase() ?? "";
      const vehicle = b.vehicle?.registrationNumber?.toLowerCase() ?? "";
      const status = b.status?.toLowerCase() ?? "";
      return (
        customer.includes(q) ||
        driver.includes(q) ||
        vehicle.includes(q) ||
        status.includes(q)
      );
    });
  }, [bookings, searchQuery]);

  const paginatedBookings = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredBookings.slice(start, start + rowsPerPage);
  }, [filteredBookings, page, rowsPerPage]);

  const stats = useMemo(() => {
    const totalRev = bookings.reduce((sum, b) => sum + (b.amountInPaise || 0), 0) / 100;
    const confirmed = bookings.filter((b) => b.status === "CONFIRMED").length;
    const inProgress = bookings.filter((b) => b.status === "IN_PROGRESS").length;
    const completed = bookings.filter((b) => b.status === "COMPLETED").length;
    return { totalRev, confirmed, inProgress, completed };
  }, [bookings]);

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
              Active Bookings
            </Typography>
            <Chip
              label={`${bookings.length} Operations`}
              size="small"
              icon={<EventAvailableRoundedIcon style={{ fontSize: 15 }} />}
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
            Track confirmed tour operations, fleet & driver allocations, and transit status.
          </Typography>
        </Box>
        {(auth?.isClientAdmin || auth?.permissions?.bookings?.add) && (
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={openCreateDialog}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
          >
            Create Booking
          </Button>
        )}
      </Box>

      <Dialog open={createOpen} onClose={() => !creating && setCreateOpen(false)} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={createBooking}>
          <DialogTitle sx={{ fontWeight: 800 }}>Create Booking</DialogTitle>
          <DialogContent sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, pt: "12px !important" }}>
            <Autocomplete
              freeSolo
              options={customers}
              value={creatingCustomer
                ? { isNew: true, name: bookingForm.customerName, inputValue: bookingForm.customerName }
                : customers.find((customer) => customer.id === bookingForm.customerId) ?? null}
              inputValue={customerSearch}
              filterOptions={(options, params) => {
                const filtered = filterCustomerOptions(options, params);
                const typedName = params.inputValue.trim();
                const alreadyExists = options.some((customer) => customer.name?.toLowerCase() === typedName.toLowerCase());
                if (typedName && !alreadyExists) filtered.push({ isNew: true, inputValue: typedName, name: `Add "${typedName}" as new customer` });
                return filtered;
              }}
              getOptionLabel={(option: any) => typeof option === "string" ? option : option.isNew ? option.inputValue : `${option.name} · ${option.phone}`}
              isOptionEqualToValue={(option: any, value: any) => option.id ? option.id === value.id : option.inputValue === value.inputValue}
              noOptionsText="Type a name to add a new customer"
              onInputChange={(_, value, reason) => {
                if (reason === "input" || reason === "clear") setCustomerSearch(value);
              }}
              onChange={(_, value: any) => {
                if (typeof value === "string" || value?.isNew) {
                  const name = typeof value === "string" ? value : value.inputValue;
                  setCreatingCustomer(true);
                  setBookingForm((form) => ({ ...form, customerId: "", customerName: name, customerPhone: "", customerEmail: "" }));
                  setCustomerSearch(name);
                } else {
                  setCreatingCustomer(false);
                  setBookingForm((form) => ({ ...form, customerId: value?.id ?? "", customerName: "", customerPhone: "", customerEmail: "" }));
                  setCustomerSearch(value ? `${value.name} · ${value.phone}` : "");
                }
              }}
              renderOption={(props, option: any) => <li {...props} key={option.id ?? `new-${option.inputValue}`}>{option.isNew ? `+ ${option.name}` : `${option.name} · ${option.phone}`}</li>}
              renderInput={(params) => <TextField {...params} label="Customer name" required fullWidth />}
              sx={{ gridColumn: { sm: "1 / -1" } }}
            />
            {creatingCustomer && <>
              <TextField label="Customer phone" value={bookingForm.customerPhone} onChange={(e) => setBookingForm({ ...bookingForm, customerPhone: e.target.value })} required fullWidth />
              <TextField label="Customer email (optional)" type="email" value={bookingForm.customerEmail} onChange={(e) => setBookingForm({ ...bookingForm, customerEmail: e.target.value })} fullWidth />
            </>}
            <TextField label="Pickup" value={bookingForm.pickup} onChange={(e) => setBookingForm({ ...bookingForm, pickup: e.target.value })} required fullWidth />
            <TextField label="Drop" value={bookingForm.drop} onChange={(e) => setBookingForm({ ...bookingForm, drop: e.target.value })} required fullWidth />
            <TextField label="Pickup date & time" type="datetime-local" value={bookingForm.travelStart} onChange={(e) => setBookingForm({ ...bookingForm, travelStart: e.target.value })} InputLabelProps={{ shrink: true }} fullWidth />
            <TextField label="Return date & time" type="datetime-local" value={bookingForm.travelEnd} onChange={(e) => setBookingForm({ ...bookingForm, travelEnd: e.target.value })} InputLabelProps={{ shrink: true }} fullWidth />
            <TextField label="Vehicle type" value={bookingForm.vehicleType} onChange={(e) => setBookingForm({ ...bookingForm, vehicleType: e.target.value })} fullWidth />
            <TextField label="Fare (₹)" type="number" inputProps={{ min: 0.01, step: "0.01" }} value={bookingForm.fare} onChange={(e) => setBookingForm({ ...bookingForm, fare: e.target.value })} required fullWidth />
            <TextField label="Distance (km)" value={bookingForm.distance} onChange={(e) => setBookingForm({ ...bookingForm, distance: e.target.value })} fullWidth />
            <TextField label="Duration" value={bookingForm.duration} onChange={(e) => setBookingForm({ ...bookingForm, duration: e.target.value })} fullWidth />
            <TextField select label="Assign Driver" value={bookingForm.driverId} onChange={(e) => setBookingForm({ ...bookingForm, driverId: e.target.value })} fullWidth>
              <MenuItem value="">Unassigned</MenuItem>
              {drivers.map((driver) => <MenuItem key={driver.id} value={driver.id}>{driver.name}</MenuItem>)}
            </TextField>
            <TextField select label="Assign Vehicle" value={bookingForm.vehicleId} onChange={(e) => setBookingForm({ ...bookingForm, vehicleId: e.target.value })} fullWidth>
              <MenuItem value="">Unassigned</MenuItem>
              {vehicles.map((vehicle) => <MenuItem key={vehicle.id} value={vehicle.id}>{vehicle.registrationNumber} · {vehicle.vehicleName || vehicle.vehicleType}</MenuItem>)}
            </TextField>
            <TextField select label="Booking Status" value={bookingForm.status} onChange={(e) => setBookingForm({ ...bookingForm, status: e.target.value })} fullWidth>
              <MenuItem value="CONFIRMED">Confirmed</MenuItem><MenuItem value="IN_PROGRESS">In Progress</MenuItem><MenuItem value="COMPLETED">Completed</MenuItem><MenuItem value="CANCELLED">Cancelled</MenuItem>
            </TextField>
            <TextField select label="Payment Status" value={bookingForm.paymentStatus} onChange={(e) => setBookingForm({ ...bookingForm, paymentStatus: e.target.value })} fullWidth>
              <MenuItem value="UNPAID">Unpaid</MenuItem><MenuItem value="PARTIAL">Partial</MenuItem><MenuItem value="PAID">Paid</MenuItem>
            </TextField>
            {bookingForm.paymentStatus === "PARTIAL" && <TextField label="Paid amount (₹)" type="number" inputProps={{ min: 0.01, step: "0.01" }} value={bookingForm.paidAmount} onChange={(e) => setBookingForm({ ...bookingForm, paidAmount: e.target.value })} required fullWidth />}
            <TextField label="Notes" value={bookingForm.notes} onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })} multiline minRows={2} fullWidth sx={{ gridColumn: { sm: "1 / -1" } }} />
            {createError && <Typography color="error" variant="body2" sx={{ gridColumn: { sm: "1 / -1" } }}>{createError}</Typography>}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setCreateOpen(false)} disabled={creating}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={creating}>Create Booking</Button>
          </DialogActions>
        </Box>
      </Dialog>

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
            <EventAvailableRoundedIcon />
          </Avatar>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Total Bookings
            </Typography>
            <Typography variant="h5" fontWeight={900} color="#0f172a">
              {bookings.length}
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
            <PersonRoundedIcon />
          </Avatar>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Confirmed
            </Typography>
            <Typography variant="h5" fontWeight={900} color="#0f172a">
              {stats.confirmed}
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
              In Progress
            </Typography>
            <Typography variant="h5" fontWeight={900} color="#0f172a">
              {stats.inProgress}
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
          <Avatar sx={{ bgcolor: "rgba(147, 51, 234, 0.1)", color: "#9333ea", borderRadius: 2.5, width: 44, height: 44 }}>
            <BadgeRoundedIcon />
          </Avatar>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Pipeline Value
            </Typography>
            <Typography variant="h5" fontWeight={900} color="#0f172a">
              ₹{stats.totalRev.toLocaleString("en-IN")}
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* Filter and Search Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
          border: "1px solid #e2e8f0",
          bgcolor: "#ffffff",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <TextField
          size="small"
          placeholder="Search by customer, driver, vehicle plate..."
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
            flex: { xs: "1 1 100%", sm: "0 1 360px" },
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              bgcolor: "#f8fafc",
            },
          }}
        />

        <Box display="flex" alignItems="center" gap={1.5} width={{ xs: "100%", sm: "auto" }}>
          <TextField
            select
            size="small"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FilterListRoundedIcon fontSize="small" sx={{ color: "#94a3b8" }} />
                </InputAdornment>
              ),
            }}
            sx={{
              minWidth: 160,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                bgcolor: "#f8fafc",
              },
            }}
          >
            <MenuItem value="">All Statuses</MenuItem>
            {STATUS_OPTIONS.map((s) => (
              <MenuItem key={s} value={s}>
                {STATUS_CONFIG[s]?.label ?? s.replace("_", " ")}
              </MenuItem>
            ))}
          </TextField>

          <Tooltip title="Refresh Bookings">
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
        </Box>
      </Paper>

      {/* Main Bookings Table */}
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
        <Table sx={{ minWidth: 800 }}>
          <TableHead sx={{ bgcolor: "#fafcff" }}>
            <TableRow sx={{ borderBottom: "1px solid #eef2f6" }}>
              <TableCell sx={{ fontWeight: 800, color: "#64748b", py: 2.2, px: 3, fontSize: "0.75rem", letterSpacing: "0.06em" }}>
                CUSTOMER
              </TableCell>
              <TableCell sx={{ fontWeight: 800, color: "#64748b", py: 2.2, fontSize: "0.75rem", letterSpacing: "0.06em" }}>
                TOTAL VALUE
              </TableCell>
              <TableCell sx={{ fontWeight: 800, color: "#64748b", py: 2.2, fontSize: "0.75rem", letterSpacing: "0.06em" }}>
                TRAVEL DATE
              </TableCell>
              <TableCell sx={{ fontWeight: 800, color: "#64748b", py: 2.2, fontSize: "0.75rem", letterSpacing: "0.06em" }}>
                TRIP STATUS
              </TableCell>
              <TableCell sx={{ fontWeight: 800, color: "#64748b", py: 2.2, fontSize: "0.75rem", letterSpacing: "0.06em" }}>
                ALLOCATED CREW & FLEET
              </TableCell>
              <TableCell sx={{ fontWeight: 800, color: "#64748b", py: 2.2, fontSize: "0.75rem", letterSpacing: "0.06em" }}>
                BOOKED ON
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: "#64748b", py: 2.2, px: 3, fontSize: "0.75rem", letterSpacing: "0.06em" }}>
                ACTION
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedBookings.map((b) => {
              const statusMeta = STATUS_CONFIG[b.status] ?? {
                label: b.status?.replace("_", " ") ?? "—",
                bg: "#f1f5f9",
                color: "#475569",
                border: "#e2e8f0",
              };

              return (
                <TableRow
                  key={b.id}
                  hover
                  sx={{
                    transition: "background-color 0.15s ease",
                    "&:hover": { bgcolor: "#fbfcfe !important" },
                    "&:last-child td": { border: 0 },
                  }}
                >
                  {/* Customer Information */}
                  <TableCell sx={{ py: 2, px: 3 }}>
                    <Box display="flex" alignItems="center" gap={1.75}>
                      <Avatar
                        sx={{
                          width: 38,
                          height: 38,
                          bgcolor: "#eff6ff",
                          color: "#2563eb",
                          borderRadius: 2,
                        }}
                      >
                        <PersonRoundedIcon fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={800} sx={{ color: "#0f172a" }}>
                          {b.customer?.name ?? "Anonymous"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {b.customer?.phone || b.customer?.email || "Direct Booking"}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  {/* Amount */}
                  <TableCell sx={{ py: 2 }}>
                    <Typography variant="body2" fontWeight={800} color="#0f172a">
                      ₹{((b.amountInPaise || 0) / 100).toLocaleString("en-IN")}
                    </Typography>
                  </TableCell>

                  {/* Travel Date */}
                  <TableCell sx={{ py: 2 }}>
                    <Box display="flex" alignItems="center" gap={0.75}>
                      <CalendarMonthRoundedIcon sx={{ fontSize: 15, color: "#94a3b8" }} />
                      <Typography variant="body2" fontWeight={600} color="#334155">
                        {b.travelStart
                          ? new Date(b.travelStart).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Status Chip */}
                  <TableCell sx={{ py: 2 }}>
                    <Chip
                      size="small"
                      label={statusMeta.label}
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.72rem",
                        bgcolor: statusMeta.bg,
                        color: statusMeta.color,
                        border: `1px solid ${statusMeta.border}`,
                        borderRadius: "6px",
                      }}
                    />
                  </TableCell>

                  {/* Crew & Fleet */}
                  <TableCell sx={{ py: 2 }}>
                    <Box display="flex" flexDirection="column" gap={0.5}>
                      <Box display="flex" alignItems="center" gap={0.75}>
                        <BadgeRoundedIcon sx={{ fontSize: 14, color: "#94a3b8" }} />
                        <Typography variant="body2" fontWeight={600} color={b.driver ? "#1e293b" : "#94a3b8"}>
                          {b.driver?.name ?? "No Driver"}
                        </Typography>
                      </Box>

                      {b.vehicle && (
                        <Box display="flex" alignItems="center" gap={0.75}>
                          <DirectionsCarRoundedIcon sx={{ fontSize: 14, color: "#2563eb" }} />
                          <Typography variant="caption" fontFamily="monospace" fontWeight={700} color="#475569">
                            {b.vehicle.registrationNumber}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </TableCell>

                  {/* Created Date */}
                  <TableCell sx={{ py: 2 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                      {b.createdAt
                        ? new Date(b.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </Typography>
                  </TableCell>

                  {/* Action Button */}
                  <TableCell align="right" sx={{ py: 2, px: 3 }}>
                    <Button
                      component={RouterLink}
                      to={`/app/bookings/${b.id}`}
                      size="small"
                      endIcon={<ArrowForwardRoundedIcon fontSize="small" />}
                      sx={{
                        textTransform: "none",
                        fontWeight: 700,
                        fontSize: "0.8rem",
                        color: "#2563eb",
                        bgcolor: "#eff6ff",
                        borderRadius: 2,
                        px: 1.75,
                        py: 0.5,
                        "&:hover": { bgcolor: "#dbeafe" },
                      }}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}

            {filteredBookings.length === 0 && (
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
                      <EventAvailableRoundedIcon fontSize="medium" />
                    </Avatar>
                    <Typography variant="body1" fontWeight={700} sx={{ color: "#0f172a" }}>
                      {searchQuery || statusFilter ? "No matching bookings found" : "No bookings recorded yet"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {searchQuery || statusFilter
                        ? "Adjust your filters or query to inspect more operations."
                        : "Convert an accepted proposal from Quotations to register your first booking."}
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
          count={filteredBookings.length}
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
    </Box>
  );
}
