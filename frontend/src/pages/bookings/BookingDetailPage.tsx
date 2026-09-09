import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Paper, Chip, Button, Select, MenuItem, Divider,
  TextField, Table, TableHead, TableRow, TableCell, TableBody,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert,
} from "@mui/material";
import { apiClient } from "../../api/client";

const STATUS_COLOR: Record<string, "info" | "warning" | "success" | "error"> = {
  CONFIRMED: "info", IN_PROGRESS: "warning", COMPLETED: "success", CANCELLED: "error",
};

export function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any>(null);

  function load() {
    apiClient.get(`/bookings/${id}`).then(({ data }) => setBooking(data.data));
  }
  useEffect(load, [id]);

  async function updateStatus(status: string) {
    await apiClient.patch(`/bookings/${id}/status`, { status });
    load();
  }

  if (!booking) return <Box p={4}>Loading…</Box>;

  return (
    <Box p={4}>
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2} className="no-print">
        <Box>
          <Typography variant="h4">Booking</Typography>
          <Typography color="text.secondary">{booking.customer?.name} · Quotation v{booking.quotation?.version}</Typography>
        </Box>
        <Chip label={booking.status.replace("_", " ")} color={STATUS_COLOR[booking.status]} />
      </Box>

      <Box display="flex" gap={2} alignItems="center" mb={3} className="no-print">
        <Select size="small" value={booking.status} onChange={(e) => updateStatus(e.target.value)}>
          {["CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((s) => <MenuItem key={s} value={s}>{s.replace("_", " ")}</MenuItem>)}
        </Select>
        <Button variant="outlined" onClick={() => window.print()}>Print Voucher</Button>
        <Button variant="outlined" onClick={() => navigate(`/app/bookings/${id}/edit`)}>Edit Booking</Button>
        {booking.trip && <Button variant="outlined" onClick={() => navigate(`/app/trips/${booking.trip.id}`)}>Manage Trip</Button>}
      </Box>

      <Paper sx={{ p: 4, maxWidth: 700 }}>
        <Typography variant="h5" gutterBottom>Booking Voucher</Typography>
        <Typography color="text.secondary" gutterBottom>Created {new Date(booking.createdAt).toLocaleDateString()}</Typography>
        <Divider sx={{ my: 2 }} />
        <Typography><b>Customer:</b> {booking.customer?.name} ({booking.customer?.phone})</Typography>
        <Typography><b>Travel dates:</b> {booking.travelStart ? new Date(booking.travelStart).toLocaleDateString() : "TBD"} — {booking.travelEnd ? new Date(booking.travelEnd).toLocaleDateString() : "TBD"}</Typography>
        <Typography><b>Amount:</b> ₹{(booking.amountInPaise / 100).toLocaleString()}</Typography>
        <Typography><b>Driver:</b> {booking.driver?.name ?? "Not yet assigned"}</Typography>
        <Typography><b>Vehicle:</b> {booking.vehicle?.registrationNumber ?? "Not yet assigned"}</Typography>
      </Paper>

      <PaymentsSection bookingId={id!} totalInPaise={booking.amountInPaise} />
      <InvoiceSection bookingId={id!} />
    </Box>
  );
}

function PaymentsSection({ bookingId, totalInPaise }: { bookingId: string; totalInPaise: number }) {
  const [summary, setSummary] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ amount: 0, mode: "UPI", paymentDate: new Date().toISOString().slice(0, 10), reference: "", notes: "" });
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  function load() {
    apiClient.get(`/payments/booking/${bookingId}/summary`).then(({ data }) => {
      setSummary(data.data);
      setDueDate(data.data.dueDate ? new Date(data.data.dueDate).toISOString().slice(0, 10) : "");
    });
    apiClient.get("/payments", { params: { bookingId } }).then(({ data }) => setPayments(data.data));
  }
  useEffect(load, [bookingId]);

  async function handleAddPayment() {
    setError(null);
    try {
      await apiClient.post("/payments", {
        bookingId, amountInPaise: Math.round(form.amount * 100), mode: form.mode,
        paymentDate: form.paymentDate, reference: form.reference, notes: form.notes,
      });
      setOpen(false);
      setForm({ amount: 0, mode: "UPI", paymentDate: new Date().toISOString().slice(0, 10), reference: "", notes: "" });
      load();
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Could not record payment");
    }
  }

  async function saveDueDate() {
    await apiClient.patch(`/bookings/${bookingId}`, { paymentDueDate: dueDate || undefined });
    load();
  }

  const STATUS_COLOR: Record<string, "success" | "warning" | "error"> = { PAID: "success", PARTIALLY_PAID: "warning", UNPAID: "error" };

  return (
    <Paper sx={{ p: 4, maxWidth: 700, mt: 3 }} className="no-print">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Payments</Typography>
        {summary && <Chip label={summary.paymentStatus.replace("_", " ")} color={STATUS_COLOR[summary.paymentStatus]} />}
      </Box>

      {summary && (
        <Box display="flex" gap={4} mb={2}>
          <Typography>Total: ₹{(summary.totalInPaise / 100).toLocaleString()}</Typography>
          <Typography color="success.main">Paid: ₹{(summary.paidInPaise / 100).toLocaleString()}</Typography>
          <Typography color="error.main">Pending: ₹{(summary.pendingInPaise / 100).toLocaleString()}</Typography>
        </Box>
      )}

      <Box display="flex" gap={2} alignItems="center" mb={2}>
        <TextField size="small" label="Payment Due Date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} InputLabelProps={{ shrink: true }} />
        <Button size="small" onClick={saveDueDate}>Save Due Date</Button>
      </Box>

      <Table size="small" sx={{ mb: 2 }}>
        <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Amount</TableCell><TableCell>Mode</TableCell><TableCell>Reference</TableCell></TableRow></TableHead>
        <TableBody>
          {payments.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{new Date(p.paymentDate).toLocaleDateString()}</TableCell>
              <TableCell>₹{(p.amountInPaise / 100).toLocaleString()}</TableCell>
              <TableCell>{p.mode.replace("_", " ")}</TableCell>
              <TableCell>{p.reference ?? "—"}</TableCell>
            </TableRow>
          ))}
          {payments.length === 0 && <TableRow><TableCell colSpan={4}>No payments recorded yet.</TableCell></TableRow>}
        </TableBody>
      </Table>

      {summary?.pendingInPaise > 0 && <Button variant="contained" size="small" onClick={() => setOpen(true)}>+ Record Payment</Button>}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Amount (₹)" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
          <TextField select label="Mode" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
            {["CASH", "UPI", "BANK_TRANSFER"].map((m) => <MenuItem key={m} value={m}>{m.replace("_", " ")}</MenuItem>)}
          </TextField>
          <TextField label="Payment Date" type="date" value={form.paymentDate} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })} InputLabelProps={{ shrink: true }} />
          <TextField label="Reference" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
          <TextField label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddPayment} disabled={!form.amount}>Record</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

function InvoiceSection({ bookingId }: { bookingId: string }) {
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [hsnSac, setHsnSac] = useState("");
  const [gstRate, setGstRate] = useState(5);

  useEffect(() => {
    apiClient.get("/invoices", { params: { bookingId } }).then(({ data }) => {
      setInvoice(data.data[0] ?? null);
      setLoaded(true);
    });
  }, [bookingId]);

  async function generate() {
    const { data } = await apiClient.post("/invoices", { bookingId, hsnSac: hsnSac || undefined, gstRatePercent: gstRate });
    navigate(`/app/invoices/${data.data.id}`);
  }

  if (!loaded) return null;

  return (
    <Paper sx={{ p: 4, maxWidth: 700, mt: 3 }} className="no-print">
      <Typography variant="h6" gutterBottom>Invoice</Typography>
      {invoice ? (
        <Button variant="outlined" onClick={() => navigate(`/app/invoices/${invoice.id}`)}>View Invoice</Button>
      ) : (
        <Box display="flex" gap={2} alignItems="center">
          <TextField size="small" label="HSN/SAC (optional)" value={hsnSac} onChange={(e) => setHsnSac(e.target.value)} />
          <TextField size="small" label="GST %" type="number" value={gstRate} onChange={(e) => setGstRate(Number(e.target.value))} sx={{ width: 100 }} />
          <Button variant="contained" onClick={generate}>Generate Invoice</Button>
        </Box>
      )}
    </Paper>
  );
}
