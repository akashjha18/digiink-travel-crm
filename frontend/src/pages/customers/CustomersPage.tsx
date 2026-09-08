import { useEffect, useState, useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";
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
  InputAdornment,
  Avatar,
  TablePagination,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import { apiClient } from "../../api/client";

export function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", notes: "" });

  function load() {
    setLoading(true);
    apiClient
      .get("/customers", { params: { search: search || undefined } })
      .then(({ data }) => setCustomers(data.data ?? []))
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [search]);

  async function handleCreate() {
    try {
      setCreating(true);
      await apiClient.post("/customers", form);
      setOpen(false);
      setForm({ name: "", phone: "", email: "", address: "", notes: "" });
      load();
    } finally {
      setCreating(false);
    }
  }

  const paginatedCustomers = useMemo(() => {
    const start = page * rowsPerPage;
    return customers.slice(start, start + rowsPerPage);
  }, [customers, page, rowsPerPage]);

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
              Customers Directory
            </Typography>
            <Chip
              label={`${customers.length} Profiles`}
              size="small"
              icon={<PeopleAltRoundedIcon style={{ fontSize: 15 }} />}
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
            Centralized client registry, direct communication contacts, and historical travel profiles.
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
          New Customer
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
          placeholder="Search by customer name, phone, or email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
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

        <Tooltip title="Refresh Directory">
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

      {/* Main Customers Table */}
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
        <Table sx={{ minWidth: 700 }}>
          <TableHead sx={{ bgcolor: "#fafcff" }}>
            <TableRow sx={{ borderBottom: "1px solid #eef2f6" }}>
              <TableCell sx={{ fontWeight: 800, color: "#64748b", py: 2.2, px: 3, fontSize: "0.75rem", letterSpacing: "0.06em" }}>
                CUSTOMER NAME
              </TableCell>
              <TableCell sx={{ fontWeight: 800, color: "#64748b", py: 2.2, fontSize: "0.75rem", letterSpacing: "0.06em" }}>
                PHONE NUMBER
              </TableCell>
              <TableCell sx={{ fontWeight: 800, color: "#64748b", py: 2.2, fontSize: "0.75rem", letterSpacing: "0.06em" }}>
                EMAIL ADDRESS
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: "#64748b", py: 2.2, px: 3, fontSize: "0.75rem", letterSpacing: "0.06em" }}>
                ACTION
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedCustomers.map((c) => (
              <TableRow
                key={c.id}
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
                      {c.name?.[0]?.toUpperCase() || <PersonRoundedIcon fontSize="small" />}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={800} sx={{ color: "#0f172a" }}>
                        {c.name}
                      </Typography>
                      {c.address && (
                        <Box display="flex" alignItems="center" gap={0.5} mt={0.25}>
                          <LocationOnRoundedIcon sx={{ fontSize: 13, color: "#94a3b8" }} />
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 220 }}>
                            {c.address}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </TableCell>

                {/* Phone */}
                <TableCell sx={{ py: 2 }}>
                  <Box display="flex" alignItems="center" gap={0.75}>
                    <PhoneRoundedIcon sx={{ fontSize: 15, color: "#94a3b8" }} />
                    <Typography variant="body2" fontWeight={600} color="#334155">
                      {c.phone || "—"}
                    </Typography>
                  </Box>
                </TableCell>

                {/* Email */}
                <TableCell sx={{ py: 2 }}>
                  <Box display="flex" alignItems="center" gap={0.75}>
                    <EmailRoundedIcon sx={{ fontSize: 15, color: "#94a3b8" }} />
                    <Typography variant="body2" color={c.email ? "#475569" : "#94a3b8"} fontWeight={500}>
                      {c.email ?? "—"}
                    </Typography>
                  </Box>
                </TableCell>

                {/* View Profile Action */}
                <TableCell align="right" sx={{ py: 2, px: 3 }}>
                  <Button
                    component={RouterLink}
                    to={`/app/customers/${c.id}`}
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
            ))}

            {customers.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} sx={{ py: 8, textAlign: "center" }}>
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
                      <PeopleAltRoundedIcon fontSize="medium" />
                    </Avatar>
                    <Typography variant="body1" fontWeight={700} sx={{ color: "#0f172a" }}>
                      {search ? "No matching customer profiles found" : "No customers registered yet"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {search
                        ? "Check spelling or refine search terms."
                        : "Start adding customer records to build your CRM contact directory."}
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
          count={customers.length}
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

      {/* New Customer Modal */}
      <Dialog
        open={open}
        onClose={() => !creating && setOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3.5, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: "#0f172a", pb: 1 }}>
          Create Customer Profile
        </DialogTitle>

        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: "10px !important" }}>
          <TextField
            size="small"
            label="Full Name"
            placeholder="e.g. John Doe"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            fullWidth
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />

          <TextField
            size="small"
            label="Phone Contact"
            placeholder="e.g. +91 9876543210"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
            fullWidth
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />

          <TextField
            size="small"
            label="Email Address"
            placeholder="e.g. client@example.com"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            fullWidth
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />

          <TextField
            size="small"
            label="Billing / Residential Address"
            placeholder="City, State, Country"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            fullWidth
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />

          <TextField
            size="small"
            label="Internal Notes"
            placeholder="Special preferences, billing terms, VIP status..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            multiline
            rows={2.5}
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
            disabled={creating || !form.name.trim() || !form.phone.trim()}
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
            {creating ? "Saving..." : "Save Customer"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}