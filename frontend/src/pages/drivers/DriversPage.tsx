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
  Chip,
  Switch,
  InputAdornment,
  Avatar,
  TablePagination,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import DirectionsCarRoundedIcon from "@mui/icons-material/DirectionsCarRounded";
import AssignmentIndRoundedIcon from "@mui/icons-material/AssignmentIndRounded";
import CreditCardRoundedIcon from "@mui/icons-material/CreditCardRounded";
import { apiClient } from "../../api/client";

export function DriversPage() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [form, setForm] = useState({ name: "", licenseNumber: "", contact: "" });

  function load() {
    setLoading(true);
    apiClient
      .get("/drivers")
      .then(({ data }) => setDrivers(data.data ?? []))
      .catch(() => setDrivers([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate() {
    try {
      setCreating(true);
      await apiClient.post("/drivers", form);
      setOpen(false);
      setForm({ name: "", licenseNumber: "", contact: "" });
      load();
    } finally {
      setCreating(false);
    }
  }

  async function toggleAvailable(driver: any) {
    try {
      setTogglingId(driver.id);
      await apiClient.patch(`/drivers/${driver.id}`, { isAvailable: !driver.isAvailable });
      setDrivers((prev) =>
        prev.map((d) => (d.id === driver.id ? { ...d, isAvailable: !d.isAvailable } : d))
      );
    } finally {
      setTogglingId(null);
    }
  }

  const filteredDrivers = useMemo(() => {
    return drivers.filter((d) => {
      const q = searchQuery.toLowerCase();
      const name = d.name?.toLowerCase() ?? "";
      const license = d.licenseNumber?.toLowerCase() ?? "";
      const contact = d.contact?.toLowerCase() ?? "";
      const vehicles = d.vehicles?.map((v: any) => v.registrationNumber).join(" ").toLowerCase() ?? "";
      return name.includes(q) || license.includes(q) || contact.includes(q) || vehicles.includes(q);
    });
  }, [drivers, searchQuery]);

  const paginatedDrivers = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredDrivers.slice(start, start + rowsPerPage);
  }, [filteredDrivers, page, rowsPerPage]);

  const availableCount = drivers.filter((d) => d.isAvailable).length;

  return (
    <Box sx={{ p: { xs: 2.5, md: 4.5 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      {/* Top Header */}
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
              Driver Personnel
            </Typography>
            <Chip
              label={`${availableCount}/${drivers.length} On Duty`}
              size="small"
              icon={<AssignmentIndRoundedIcon style={{ fontSize: 14 }} />}
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
            Manage chauffeurs, valid license credentials, contact details, and live dispatch availability.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => setOpen(true)}
          sx={{
            bgcolor: "#2563eb",
            borderRadius: 2.5,
            px: 2.5,
            py: 1,
            textTransform: "none",
            fontWeight: 700,
            boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)",
            "&:hover": { bgcolor: "#1d4ed8" },
          }}
        >
          Add Driver
        </Button>
      </Box>

      {/* Search & Tool Bar */}
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
          placeholder="Search by driver name, license, contact, vehicle plate..."
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

        <Tooltip title="Refresh Drivers">
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

      {/* Main Drivers Table */}
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
        <Table sx={{ minWidth: 750 }}>
          <TableHead sx={{ bgcolor: "#fafcff" }}>
            <TableRow sx={{ borderBottom: "1px solid #eef2f6" }}>
              <TableCell sx={{ fontWeight: 800, color: "#64748b", py: 2.2, px: 3, fontSize: "0.75rem", letterSpacing: "0.06em" }}>
                DRIVER PROFILE
              </TableCell>
              <TableCell sx={{ fontWeight: 800, color: "#64748b", py: 2.2, fontSize: "0.75rem", letterSpacing: "0.06em" }}>
                LICENSE NO.
              </TableCell>
              <TableCell sx={{ fontWeight: 800, color: "#64748b", py: 2.2, fontSize: "0.75rem", letterSpacing: "0.06em" }}>
                CONTACT NUMBER
              </TableCell>
              <TableCell sx={{ fontWeight: 800, color: "#64748b", py: 2.2, fontSize: "0.75rem", letterSpacing: "0.06em" }}>
                MAPPED VEHICLES
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: "#64748b", py: 2.2, px: 3, fontSize: "0.75rem", letterSpacing: "0.06em" }}>
                DISPATCH AVAILABILITY
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedDrivers.map((d) => {
              const isToggling = togglingId === d.id;

              return (
                <TableRow
                  key={d.id}
                  hover
                  sx={{
                    transition: "background-color 0.15s ease",
                    "&:hover": { bgcolor: "#fbfcfe !important" },
                    "&:last-child td": { border: 0 },
                  }}
                >
                  {/* Name and Avatar */}
                  <TableCell sx={{ py: 2, px: 3 }}>
                    <Box display="flex" alignItems="center" gap={1.75}>
                      <Avatar
                        sx={{
                          width: 38,
                          height: 38,
                          bgcolor: "#eff6ff",
                          color: "#2563eb",
                          fontSize: "0.85rem",
                          fontWeight: 800,
                          borderRadius: 2,
                        }}
                      >
                        {d.name?.[0]?.toUpperCase() || <BadgeRoundedIcon fontSize="small" />}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={800} sx={{ color: "#0f172a" }}>
                          {d.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Driver ID #{d.id?.slice(-6).toUpperCase() ?? "REC"}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  {/* License */}
                  <TableCell sx={{ py: 2 }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <CreditCardRoundedIcon sx={{ fontSize: 16, color: "#94a3b8" }} />
                      <Typography
                        variant="body2"
                        fontFamily="monospace"
                        fontWeight={700}
                        sx={{
                          bgcolor: "#f1f5f9",
                          px: 1,
                          py: 0.25,
                          borderRadius: 1.5,
                          color: "#1e293b",
                          fontSize: "0.8rem",
                        }}
                      >
                        {d.licenseNumber || "N/A"}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Contact */}
                  <TableCell sx={{ py: 2 }}>
                    <Box display="flex" alignItems="center" gap={0.75}>
                      <PhoneRoundedIcon sx={{ fontSize: 15, color: "#94a3b8" }} />
                      <Typography variant="body2" fontWeight={600} color="#334155">
                        {d.contact || "—"}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Assigned Vehicles */}
                  <TableCell sx={{ py: 2 }}>
                    {d.vehicles && d.vehicles.length > 0 ? (
                      <Box display="flex" flexWrap="wrap" gap={0.75}>
                        {d.vehicles.map((v: any) => (
                          <Chip
                            key={v.id || v.registrationNumber}
                            size="small"
                            icon={<DirectionsCarRoundedIcon style={{ fontSize: 13 }} />}
                            label={v.registrationNumber}
                            sx={{
                              fontFamily: "monospace",
                              fontWeight: 700,
                              fontSize: "0.7rem",
                              bgcolor: "#f8fafc",
                              border: "1px solid #e2e8f0",
                              color: "#334155",
                              borderRadius: 1.5,
                            }}
                          />
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.secondary" fontWeight={500}>
                        No vehicle mapped
                      </Typography>
                    )}
                  </TableCell>

                  {/* Availability Switch */}
                  <TableCell align="right" sx={{ py: 2, px: 3 }}>
                    <Box display="inline-flex" alignItems="center" gap={1}>
                      {isToggling ? (
                        <CircularProgress size={18} sx={{ color: "#2563eb", mr: 1 }} />
                      ) : (
                        <Switch
                          size="small"
                          checked={Boolean(d.isAvailable)}
                          onChange={() => toggleAvailable(d)}
                          sx={{
                            "& .MuiSwitch-switchBase.Mui-checked": {
                              color: "#16a34a",
                            },
                            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                              backgroundColor: "#16a34a",
                              opacity: 1,
                            },
                            "& .MuiSwitch-track": {
                              borderRadius: 12,
                              backgroundColor: "#cbd5e1",
                              opacity: 0.7,
                            },
                          }}
                        />
                      )}
                      <Chip
                        size="small"
                        label={d.isAvailable ? "Available" : "Busy / Off"}
                        sx={{
                          fontWeight: 700,
                          fontSize: "0.72rem",
                          borderRadius: "6px",
                          bgcolor: d.isAvailable ? "#ecfdf5" : "#f1f5f9",
                          color: d.isAvailable ? "#047857" : "#64748b",
                          border: `1px solid ${d.isAvailable ? "#a7f3d0" : "#e2e8f0"}`,
                          minWidth: 84,
                        }}
                      />
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}

            {filteredDrivers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} sx={{ py: 8, textAlign: "center" }}>
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
                      <AssignmentIndRoundedIcon fontSize="medium" />
                    </Avatar>
                    <Typography variant="body1" fontWeight={700} sx={{ color: "#0f172a" }}>
                      {searchQuery ? "No matching driver records found" : "No drivers registered yet"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {searchQuery
                        ? "Check your query for spelling or clear search filters."
                        : "Start adding drivers to allocate personnel to bookings and fleet dispatches."}
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
          count={filteredDrivers.length}
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

      {/* Add Driver Modal */}
      <Dialog
        open={open}
        onClose={() => !creating && setOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3.5, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: "#0f172a", pb: 1 }}>
          Register Driver Personnel
        </DialogTitle>

        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: "10px !important" }}>
          <TextField
            size="small"
            label="Full Name"
            placeholder="e.g. Ramesh Kumar"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            fullWidth
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />

          <TextField
            size="small"
            label="Driving License Number"
            placeholder="e.g. DL-0420110012345"
            value={form.licenseNumber}
            onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
            required
            fullWidth
            sx={{
              "& .MuiOutlinedInput-root": { borderRadius: 2 },
              "& input": { textTransform: "uppercase" },
            }}
          />

          <TextField
            size="small"
            label="Contact Mobile"
            placeholder="e.g. +91 9876543210"
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
            required
            fullWidth
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />
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
            disabled={creating || !form.name.trim() || !form.licenseNumber.trim() || !form.contact.trim()}
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
            {creating ? "Saving..." : "Add Driver"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}