import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, TextField, Typography, Alert, InputAdornment, IconButton,
  Checkbox, FormControlLabel, Avatar,
} from "@mui/material";
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import DashboardCustomizeRoundedIcon from "@mui/icons-material/DashboardCustomizeRounded";
import { apiClient } from "../../api/client";
import { useAuth } from "../../hooks/useAuth";
import logo from "../../assets/digiink-logo.jpeg";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { setAuth } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { data } = await apiClient.post("/auth/login", { email, password });

      if (data.data.role === "SUPER_ADMIN") {
        const { accessToken, refreshToken, role } = data.data;
        setAuth({ accessToken, refreshToken, role });
        return navigate("/super-admin/dashboard");
      }

      // OTP is currently disabled server-side (see auth.controller.ts,
      // OTP_LOGIN_ENABLED) — the login response carries real tokens
      // directly. If OTP gets re-enabled later, data.data.otpRequired
      // will be true instead and this branch needs to route to
      // /verify-otp with data.data.otpToken, same as before.
      const { accessToken, refreshToken, role, subscriptionStatus, mustChangePassword, onboardingCompleted } = data.data;
      setAuth({ accessToken, refreshToken, role, subscriptionStatus, mustChangePassword });

      if (subscriptionStatus === "LOCKED") {
        navigate("/payment-renewal");
      } else if (mustChangePassword) {
        navigate("/change-password");
      } else if (!onboardingCompleted) {
        navigate("/onboarding");
      } else {
        navigate("/app/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box display="flex" minHeight="100vh">
      {/* Left panel — kept generic since this page serves both super-admin and client logins */}
      <Box
        flex={1}
        display={{ xs: "none", md: "flex" }}
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        px={6}
        sx={{ bgcolor: "#fff" }}
      >
        <Box
          sx={{
            width: 72, height: 72, borderRadius: 3, bgcolor: "#eaf1ff",
            display: "flex", alignItems: "center", justifyContent: "center", mb: 4,
          }}
        >
          <DashboardCustomizeRoundedIcon sx={{ color: "#2f6fed", fontSize: 36 }} />
        </Box>
        <Typography variant="h4" fontWeight={800} textAlign="center" gutterBottom>
          Manage Your Business, Effortlessly
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center" maxWidth={420}>
          One dashboard for platform administrators and client teams to manage leads, bookings, billing and content.
        </Typography>
      </Box>

      {/* Right panel — login card */}
      <Box
        flex={1}
        display="flex"
        alignItems="center"
        justifyContent="center"
        px={3}
        sx={{ bgcolor: "#f6f7fb" }}
      >
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            width: "100%",
            maxWidth: 440,
            bgcolor: "#fff",
            borderRadius: 4,
            boxShadow: "0 8px 30px rgba(16,24,40,0.08)",
            p: { xs: 3, sm: 5 },
          }}
        >
          <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
            <Avatar src={logo} alt="DigiInk Solutions" sx={{ width: 72, height: 72, mb: 2 }} />
            <Typography variant="h5" fontWeight={800}>
              DigiInk CRM
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to your account
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Typography variant="subtitle2" fontWeight={600} mb={0.5}>
            Email Address
          </Typography>
          <TextField
            fullWidth
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            autoComplete="username"
            sx={{ mb: 2.5 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MailOutlineRoundedIcon fontSize="small" sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
            }}
          />

          <Typography variant="subtitle2" fontWeight={600} mb={0.5}>
            Password
          </Typography>
          <TextField
            fullWidth
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            sx={{ mb: 1.5 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon fontSize="small" sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword((v) => !v)} edge="end" size="small">
                    {showPassword ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
            }
            label={<Typography variant="body2">Remember Me</Typography>}
            sx={{ mb: 1 }}
          />

          <Button
            fullWidth
            type="submit"
            variant="contained"
            disabled={submitting}
            sx={{
              mt: 1,
              py: 1.4,
              fontWeight: 700,
              letterSpacing: 0.5,
              borderRadius: 2,
              bgcolor: "#2f6fed",
              "&:hover": { bgcolor: "#2559c4" },
            }}
          >
            {submitting ? "Signing in..." : "LOGIN"}
          </Button>

          <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={3}>
            © {new Date().getFullYear()} DigiInk Solutions
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
