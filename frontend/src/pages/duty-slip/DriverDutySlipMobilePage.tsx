import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Chip,
  Rating,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Divider,
} from "@mui/material";
import CallRoundedIcon from "@mui/icons-material/CallRounded";
import NavigationRoundedIcon from "@mui/icons-material/NavigationRounded";
import SpeedRoundedIcon from "@mui/icons-material/SpeedRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";

import {
  fetchPublicDutySlip,
  startDutyTrip,
  addDutyExpense,
  completeDutyTrip,
} from "../../api/dutySlips";
import { DutySlip } from "../../types/dutySlip";

export function DriverDutySlipMobilePage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [dutySlip, setDutySlip] = useState<DutySlip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Start Duty state
  const [startKm, setStartKm] = useState<number | "">("");
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  // Expense modal state
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [expenseType, setExpenseType] = useState("TOLL");
  const [expenseAmount, setExpenseAmount] = useState<number | "">("");
  const [expenseNotes, setExpenseNotes] = useState("");
  const [savingExpense, setSavingExpense] = useState(false);

  // End Duty state
  const [endKm, setEndKm] = useState<number | "">("");
  const [customerRating, setCustomerRating] = useState<number>(5);
  const [customerFeedback, setCustomerFeedback] = useState("");
  const [completing, setCompleting] = useState(false);
  const [endError, setEndError] = useState<string | null>(null);

  // HTML5 Signature Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasSignature, setHasSignature] = useState(false);
  const isDrawing = useRef(false);

  async function load() {
    if (!shareToken) return;
    setLoading(true);
    try {
      const data = await fetchPublicDutySlip(shareToken);
      setDutySlip(data);
      if (data.startOdometer) {
        setStartKm(data.startOdometer);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Duty slip not found or invalid link");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [shareToken]);

  // Handle Canvas Drawing for Signature
  function startDrawing(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    isDrawing.current = true;
    draw(e);
  }

  function stopDrawing() {
    isDrawing.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.beginPath();
    }
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0f172a";

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    setHasSignature(true);
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    setHasSignature(false);
  }

  async function handleStartTrip() {
    if (!startKm || Number(startKm) <= 0) {
      setStartError("Please enter a valid Opening Odometer reading (KM)");
      return;
    }

    setStarting(true);
    setStartError(null);
    try {
      const updated = await startDutyTrip(shareToken!, {
        startOdometer: Number(startKm),
      });
      setDutySlip(updated);
    } catch (err: any) {
      setStartError(err.response?.data?.message || "Failed to start duty");
    } finally {
      setStarting(false);
    }
  }

  async function handleAddExpense() {
    if (!expenseAmount || Number(expenseAmount) <= 0) return;
    setSavingExpense(true);
    try {
      const result = await addDutyExpense(shareToken!, {
        expenseType,
        amountInPaise: Math.round(Number(expenseAmount) * 100),
        notes: expenseNotes || undefined,
      });
      setDutySlip(result.dutySlip);
      setExpenseOpen(false);
      setExpenseAmount("");
      setExpenseNotes("");
    } catch (err) {
      console.error("Failed to add expense", err);
    } finally {
      setSavingExpense(false);
    }
  }

  async function handleCompleteTrip() {
    if (!endKm || Number(endKm) <= 0) {
      setEndError("Please enter Closing Odometer reading (KM)");
      return;
    }
    const currentStart = dutySlip?.startOdometer || 0;
    if (Number(endKm) < currentStart) {
      setEndError(`Closing KM (${endKm}) cannot be less than Opening KM (${currentStart})`);
      return;
    }

    let signatureBase64: string | undefined = undefined;
    if (canvasRef.current && hasSignature) {
      signatureBase64 = canvasRef.current.toDataURL("image/png");
    }

    setCompleting(true);
    setEndError(null);
    try {
      const updated = await completeDutyTrip(shareToken!, {
        endOdometer: Number(endKm),
        customerSignature: signatureBase64,
        customerRating,
        customerFeedback: customerFeedback || undefined,
      });
      setDutySlip(updated);
    } catch (err: any) {
      setEndError(err.response?.data?.message || "Failed to complete duty");
    } finally {
      setCompleting(false);
    }
  }

  if (loading) {
    return (
      <Box p={4} textAlign="center" minHeight="100vh" display="flex" flexDirection="column" justifyContent="center" alignItems="center">
        <CircularProgress size={48} sx={{ color: "#2563eb" }} />
        <Typography variant="body1" color="text.secondary" mt={2} fontWeight={600}>
          Loading Digital Duty Slip...
        </Typography>
      </Box>
    );
  }

  if (error || !dutySlip) {
    return (
      <Box p={4} maxWidth={500} mx="auto" mt={8}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error || "Duty slip could not be found. Please check your link or contact the travel agency."}
        </Alert>
      </Box>
    );
  }

  const isCompleted = dutySlip.status === "COMPLETED" || dutySlip.status === "BILLED";
  const isStarted = dutySlip.status === "STARTED" || isCompleted;

  const totalRunKm =
    dutySlip.totalKm !== null && dutySlip.totalKm !== undefined
      ? dutySlip.totalKm
      : endKm && dutySlip.startOdometer && Number(endKm) >= dutySlip.startOdometer
      ? Number(endKm) - dutySlip.startOdometer
      : null;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f1f5f9",
        pb: 8,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Top Agency Branding Bar */}
      <Box
        sx={{
          bgcolor: "#0f172a",
          color: "#fff",
          px: 3,
          py: 2.5,
          borderBottom: "3px solid #2563eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="subtitle2" color="#94a3b8" textTransform="uppercase" letterSpacing={1} fontSize={10}>
            DIGITAL DRIVER DUTY SLIP
          </Typography>
          <Typography variant="h6" fontWeight={800} color="#fff" lineHeight={1.2}>
            {dutySlip.client?.companyProfile?.companyName || dutySlip.client?.businessName || "DIGIINK TRAVEL FLEET"}
          </Typography>
        </Box>
        <Chip
          label={dutySlip.slipNumber}
          sx={{
            bgcolor: "#2563eb",
            color: "#fff",
            fontWeight: 800,
            borderRadius: 1.5,
            fontSize: 12,
          }}
        />
      </Box>

      {/* Main Content Container (Mobile-first width) */}
      <Box maxWidth={540} mx="auto" px={2} pt={2}>
        {/* Status Indicator */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 3,
            border: "1px solid",
            borderColor: isCompleted ? "#86efac" : isStarted ? "#93c5fd" : "#fde68a",
            bgcolor: isCompleted ? "#f0fdf4" : isStarted ? "#eff6ff" : "#fffbeb",
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          {isCompleted ? (
            <CheckCircleRoundedIcon sx={{ color: "#16a34a", fontSize: 28 }} />
          ) : isStarted ? (
            <PlayArrowRoundedIcon sx={{ color: "#2563eb", fontSize: 28 }} />
          ) : (
            <SpeedRoundedIcon sx={{ color: "#d97706", fontSize: 28 }} />
          )}
          <Box>
            <Typography variant="subtitle2" fontWeight={700} color="#0f172a">
              {isCompleted
                ? "Trip Completed & Verified"
                : isStarted
                ? "Trip In Progress — Drive Safely"
                : "Duty Dispatched — Enter Opening KM to Start"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isCompleted && dutySlip.endTime
                ? `Finished at ${new Date(dutySlip.endTime).toLocaleTimeString()}`
                : isStarted && dutySlip.startTime
                ? `Started at ${new Date(dutySlip.startTime).toLocaleTimeString()} · Opening: ${dutySlip.startOdometer} KM`
                : "Reporting duty at pickup location"}
            </Typography>
          </Box>
        </Paper>

        {/* Passenger & Navigation Card */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 2,
            borderRadius: 3,
            border: "1px solid #e2e8f0",
            bgcolor: "#fff",
          }}
        >
          <Typography variant="caption" color="#64748b" fontWeight={700} textTransform="uppercase">
            Passenger Details
          </Typography>
          <Typography variant="h5" fontWeight={800} color="#0f172a" mt={0.5}>
            {dutySlip.passengerName || "Valued Passenger"}
          </Typography>

          {/* Call Passenger Button */}
          {dutySlip.passengerPhone && (
            <Button
              variant="contained"
              fullWidth
              size="large"
              startIcon={<CallRoundedIcon />}
              href={`tel:${dutySlip.passengerPhone}`}
              sx={{
                mt: 2,
                mb: 1.5,
                bgcolor: "#16a34a",
                "&:hover": { bgcolor: "#15803d" },
                fontWeight: 700,
                fontSize: 16,
                py: 1.5,
                borderRadius: 2.5,
                textTransform: "none",
                boxShadow: "0 4px 12px rgba(22,163,74,0.3)",
              }}
            >
              Call Passenger ({dutySlip.passengerPhone})
            </Button>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Pickup & Drop Points with Google Maps Navigation */}
          <Box mb={2}>
            <Typography variant="caption" color="#64748b" fontWeight={700} textTransform="uppercase">
              📍 Pickup Point:
            </Typography>
            <Typography variant="body1" fontWeight={700} color="#1e293b" mb={1}>
              {dutySlip.pickupAddress || "As per schedule"}
            </Typography>
            {dutySlip.pickupAddress && (
              <Button
                variant="outlined"
                fullWidth
                startIcon={<NavigationRoundedIcon />}
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                  dutySlip.pickupAddress
                )}`}
                target="_blank"
                sx={{
                  color: "#2563eb",
                  borderColor: "#bfdbfe",
                  borderRadius: 2,
                  fontWeight: 700,
                  textTransform: "none",
                  py: 1,
                  bgcolor: "#eff6ff",
                }}
              >
                Navigate to Pickup with Google Maps
              </Button>
            )}
          </Box>

          {dutySlip.dropAddress && (
            <Box mt={2}>
              <Typography variant="caption" color="#64748b" fontWeight={700} textTransform="uppercase">
                🏁 Drop Point:
              </Typography>
              <Typography variant="body1" fontWeight={700} color="#1e293b" mb={1}>
                {dutySlip.dropAddress}
              </Typography>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<NavigationRoundedIcon />}
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                  dutySlip.dropAddress
                )}`}
                target="_blank"
                sx={{
                  color: "#0f172a",
                  borderColor: "#cbd5e1",
                  borderRadius: 2,
                  fontWeight: 700,
                  textTransform: "none",
                  py: 1,
                }}
              >
                Navigate to Drop with Google Maps
              </Button>
            </Box>
          )}
        </Paper>

        {/* Assigned Vehicle & Driver Info */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 3,
            border: "1px solid #e2e8f0",
            bgcolor: "#f8fafc",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary">Assigned Cab</Typography>
            <Typography variant="subtitle1" fontWeight={800} color="#0f172a">
              {dutySlip.vehicleNumber || "Cab Assigned"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {dutySlip.vehicleModel || "Commercial Fleet"}
            </Typography>
          </Box>
          <Box textAlign="right">
            <Typography variant="caption" color="text.secondary">Driver Name</Typography>
            <Typography variant="subtitle1" fontWeight={800} color="#0f172a">
              {dutySlip.driverName || "Driver on Duty"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {dutySlip.driverPhone || ""}
            </Typography>
          </Box>
        </Paper>

        {/* STEP 1: START DUTY (If not started yet) */}
        {!isStarted && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 2,
              borderRadius: 3,
              border: "2px solid #2563eb",
              bgcolor: "#ffffff",
            }}
          >
            <Typography variant="h6" fontWeight={800} color="#0f172a" mb={1}>
              Step 1: Start Duty
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Enter your vehicle dashboard opening odometer (KM) before beginning the journey:
            </Typography>

            {startError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {startError}
              </Alert>
            )}

            <TextField
              label="Opening Odometer (KM) *"
              type="number"
              fullWidth
              size="medium"
              placeholder="e.g. 45210"
              value={startKm}
              onChange={(e) => setStartKm(e.target.value === "" ? "" : Number(e.target.value))}
              inputProps={{ style: { fontSize: 22, fontWeight: 700, textAlign: "center" } }}
              sx={{ mb: 2 }}
            />

            <Button
              variant="contained"
              fullWidth
              size="large"
              startIcon={<PlayArrowRoundedIcon />}
              onClick={handleStartTrip}
              disabled={starting || !startKm}
              sx={{
                bgcolor: "#2563eb",
                fontWeight: 800,
                fontSize: 17,
                py: 1.6,
                borderRadius: 2.5,
                textTransform: "none",
                boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
              }}
            >
              {starting ? "Starting..." : "Start Trip Now"}
            </Button>
          </Paper>
        )}

        {/* STEP 2: ON-TRIP EXPENSES (If started) */}
        {isStarted && (
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              mb: 2,
              borderRadius: 3,
              border: "1px solid #e2e8f0",
              bgcolor: "#ffffff",
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Box>
                <Typography variant="subtitle1" fontWeight={800} color="#0f172a">
                  Toll, Parking & Expenses
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total: ₹{((dutySlip.totalExpensesInPaise || 0) / 100).toLocaleString()}
                </Typography>
              </Box>
              {!isCompleted && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddRoundedIcon />}
                  onClick={() => setExpenseOpen(true)}
                  sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
                >
                  Add Toll/Parking
                </Button>
              )}
            </Box>

            {dutySlip.expenses && dutySlip.expenses.length > 0 ? (
              <Box display="flex" flexDirection="column" gap={1}>
                {dutySlip.expenses.map((exp) => (
                  <Box
                    key={exp.id}
                    display="flex"
                    justifyContent="space-between"
                    p={1.2}
                    sx={{ bgcolor: "#f8fafc", borderRadius: 1.5, border: "1px solid #e2e8f0" }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={700}>
                        {exp.expenseType}
                      </Typography>
                      {exp.notes && (
                        <Typography variant="caption" color="text.secondary">
                          {exp.notes}
                        </Typography>
                      )}
                    </Box>
                    <Typography variant="body2" fontWeight={800} color="#16a34a">
                      +₹{(exp.amountInPaise / 100).toLocaleString()}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="caption" color="text.secondary" fontStyle="italic">
                No on-trip expenses logged yet.
              </Typography>
            )}
          </Paper>
        )}

        {/* STEP 3: END DUTY & SIGNATURE (If started and not completed) */}
        {isStarted && !isCompleted && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 2,
              borderRadius: 3,
              border: "2px solid #16a34a",
              bgcolor: "#ffffff",
            }}
          >
            <Typography variant="h6" fontWeight={800} color="#0f172a" mb={1}>
              Step 2: Complete Duty & Customer Sign
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Enter vehicle closing odometer (KM) and hand your phone to the passenger to sign:
            </Typography>

            {endError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {endError}
              </Alert>
            )}

            <TextField
              label="Closing Odometer (KM) *"
              type="number"
              fullWidth
              size="medium"
              placeholder={`e.g. ${(dutySlip.startOdometer || 0) + 50}`}
              value={endKm}
              onChange={(e) => setEndKm(e.target.value === "" ? "" : Number(e.target.value))}
              inputProps={{ style: { fontSize: 22, fontWeight: 700, textAlign: "center" } }}
              sx={{ mb: 2 }}
            />

            {/* Live Distance calculation */}
            {totalRunKm !== null && totalRunKm >= 0 && (
              <Box p={1.5} mb={2} sx={{ bgcolor: "#ecfdf5", borderRadius: 2, textAlign: "center" }}>
                <Typography variant="subtitle2" fontWeight={800} color="#15803d">
                  Total Journey Distance: {totalRunKm} KM
                </Typography>
              </Box>
            )}

            {/* Customer Signature Pad */}
            <Box mb={2}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle2" fontWeight={700} color="#1e293b">
                  Passenger Digital Signature
                </Typography>
                {hasSignature && (
                  <Button
                    size="small"
                    color="inherit"
                    startIcon={<ClearRoundedIcon />}
                    onClick={clearSignature}
                    sx={{ fontSize: 11 }}
                  >
                    Clear
                  </Button>
                )}
              </Box>
              <Box
                sx={{
                  border: "2px dashed #94a3b8",
                  borderRadius: 2,
                  bgcolor: "#f8fafc",
                  touchAction: "none",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <canvas
                  ref={canvasRef}
                  width={340}
                  height={150}
                  onMouseDown={startDrawing}
                  onMouseUp={stopDrawing}
                  onMouseMove={draw}
                  onTouchStart={startDrawing}
                  onTouchEnd={stopDrawing}
                  onTouchMove={draw}
                  style={{ display: "block", cursor: "crosshair" }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary" textAlign="center" display="block" mt={0.5}>
                Please ask the passenger to sign above with their finger.
              </Typography>
            </Box>

            {/* Customer Rating */}
            <Box mb={2} textAlign="center">
              <Typography variant="subtitle2" fontWeight={700} color="#1e293b" mb={0.5}>
                Passenger Experience Rating
              </Typography>
              <Rating
                size="large"
                value={customerRating}
                onChange={(_, val) => setCustomerRating(val || 5)}
              />
            </Box>

            <TextField
              label="Passenger Comments (Optional)"
              fullWidth
              size="small"
              multiline
              rows={2}
              value={customerFeedback}
              onChange={(e) => setCustomerFeedback(e.target.value)}
              placeholder="e.g. Excellent driving, polite and smooth trip."
              sx={{ mb: 2.5 }}
            />

            <Button
              variant="contained"
              fullWidth
              size="large"
              startIcon={<StopRoundedIcon />}
              onClick={handleCompleteTrip}
              disabled={completing || !endKm}
              sx={{
                bgcolor: "#16a34a",
                "&:hover": { bgcolor: "#15803d" },
                fontWeight: 800,
                fontSize: 17,
                py: 1.6,
                borderRadius: 2.5,
                textTransform: "none",
                boxShadow: "0 4px 14px rgba(22,163,74,0.35)",
              }}
            >
              {completing ? "Completing..." : "Complete & Submit Duty Slip"}
            </Button>
          </Paper>
        )}

        {/* TRIP SUMMARY (When Completed) */}
        {isCompleted && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 3,
              border: "1px solid #bbf7d0",
              bgcolor: "#ffffff",
            }}
          >
            <Typography variant="h6" fontWeight={800} color="#15803d" gutterBottom>
              ✅ Duty Summary
            </Typography>
            <Divider sx={{ my: 1.5 }} />

            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary">Opening Odometer:</Typography>
              <Typography variant="body2" fontWeight={700}>{dutySlip.startOdometer} KM</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary">Closing Odometer:</Typography>
              <Typography variant="body2" fontWeight={700}>{dutySlip.endOdometer} KM</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary">Total Distance Run:</Typography>
              <Typography variant="body2" fontWeight={800} color="#2563eb">{dutySlip.totalKm} KM</Typography>
            </Box>
            {dutySlip.totalHours && (
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="text.secondary">Total Duration:</Typography>
                <Typography variant="body2" fontWeight={700}>{dutySlip.totalHours} Hours</Typography>
              </Box>
            )}
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary">Total Toll & Expenses:</Typography>
              <Typography variant="body2" fontWeight={700} color="#16a34a">
                ₹{((dutySlip.totalExpensesInPaise || 0) / 100).toLocaleString()}
              </Typography>
            </Box>

            {/* Signature thumbnail */}
            {dutySlip.customerSignature && (
              <Box mt={2} pt={2} borderTop="1px solid #e2e8f0" textAlign="center">
                <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                  Verified Customer Signature:
                </Typography>
                <img
                  src={dutySlip.customerSignature}
                  alt="Customer Signature"
                  style={{ maxHeight: 60, maxWidth: "100%", border: "1px solid #e2e8f0", borderRadius: 6 }}
                />
              </Box>
            )}

            {dutySlip.customerRating && (
              <Box mt={1.5} textAlign="center">
                <Rating value={dutySlip.customerRating} readOnly size="small" />
                {dutySlip.customerFeedback && (
                  <Typography variant="caption" display="block" color="text.secondary" fontStyle="italic">
                    "{dutySlip.customerFeedback}"
                  </Typography>
                )}
              </Box>
            )}
          </Paper>
        )}
      </Box>

      {/* Add On-Trip Expense Dialog */}
      <Dialog open={expenseOpen} onClose={() => setExpenseOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Log On-Trip Expense</DialogTitle>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              select
              label="Expense Type *"
              fullWidth
              size="small"
              value={expenseType}
              onChange={(e) => setExpenseType(e.target.value)}
            >
              <MenuItem value="TOLL">Toll Tax</MenuItem>
              <MenuItem value="PARKING">Parking Fee</MenuItem>
              <MenuItem value="STATE_TAX">State / Border Tax</MenuItem>
              <MenuItem value="FUEL">Fuel / Petrol / Diesel</MenuItem>
              <MenuItem value="DRIVER_ALLOWANCE">Driver Night Allowance</MenuItem>
              <MenuItem value="MISC">Other Miscellaneous</MenuItem>
            </TextField>

            <TextField
              label="Amount (₹) *"
              type="number"
              fullWidth
              size="small"
              placeholder="e.g. 150"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value === "" ? "" : Number(e.target.value))}
            />

            <TextField
              label="Remarks / Receipt Ref"
              fullWidth
              size="small"
              placeholder="e.g. Yamuna Expressway Toll Plaza"
              value={expenseNotes}
              onChange={(e) => setExpenseNotes(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={() => setExpenseOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddExpense}
            disabled={savingExpense || !expenseAmount}
            sx={{ bgcolor: "#2563eb", fontWeight: 700, textTransform: "none" }}
          >
            {savingExpense ? "Saving..." : "Save Expense"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
