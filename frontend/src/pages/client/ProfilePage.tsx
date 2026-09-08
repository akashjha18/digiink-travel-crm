import { useEffect, useRef, useState } from "react";
import {
  Box, Typography, Paper, Avatar, Button, TextField, Alert, Grid, Divider, IconButton, CircularProgress,
} from "@mui/material";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import { apiClient } from "../../api/client";

interface MeProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  isClientAdmin: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  role: { name: string } | null;
  branch: { name: string } | null;
  businessName: string;
  clientCode: string;
  ownerName: string;
  phone: string;
  companyEmail: string;
  companyProfile: {
    companyName: string | null;
    address: string | null;
    gstNumber: string | null;
    phone: string | null;
    email: string | null;
    businessType: string | null;
    currency: string | null;
  } | null;
}

export function ProfilePage() {
  const [me, setMe] = useState<MeProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [emailDraft, setEmailDraft] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSaved, setNameSaved] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  function loadMe() {
    setLoading(true);
    apiClient
      .get("/client/me")
      .then(({ data }) => {
        setMe(data.data);
        setNameDraft(data.data.name);
        setEmailDraft(data.data.email);
      })
      .catch((err) => {
        console.error("Failed to load /client/me", err);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadMe();
  }, []);

  async function handleSaveName() {
    setNameError(null);
    setNameSaved(false);
    setSavingName(true);
    try {
      const { data } = await apiClient.put("/client/me", { name: nameDraft.trim(), email: emailDraft.trim() });
      setMe((prev) => (prev ? { ...prev, ...data.data } : prev));
      setEditing(false);
      setNameSaved(true);
    } catch (err: any) {
      setNameError(err.response?.data?.message ?? "Could not update your name");
    } finally {
      setSavingName(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      // No explicit Content-Type here — axios/the browser needs to set
      // the multipart boundary itself when the body is a FormData; a
      // manually-set header without a boundary breaks multer's parsing.
      const { data } = await apiClient.post("/client/me/avatar", formData);
      setMe((prev) => (prev ? { ...prev, avatarUrl: data.data.avatarUrl } : prev));
    } catch (err: any) {
      setAvatarError(err.response?.data?.message ?? "Could not upload photo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSaved(false);

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    setChangingPassword(true);
    try {
      await apiClient.post("/auth/change-password", { currentPassword, newPassword });
      setPasswordSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(err.response?.data?.message ?? "Could not update password");
    } finally {
      setChangingPassword(false);
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!me) {
    return (
      <Box p={4}>
        <Alert severity="error">Could not load your profile.</Alert>
      </Box>
    );
  }

  const initial = me.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <Box sx={{ p: { xs: 3, md: 4 }, maxWidth: 860, mx: "auto" }}>
      <Typography variant="h4" fontWeight={700} mb={3}>
        My Profile
      </Typography>

      <Paper
        elevation={0}
        sx={{ p: 4, mb: 3, borderRadius: 3, border: "1px solid #eef0f3", boxShadow: "0 2px 8px rgba(16,24,40,0.04)" }}
      >
        <Box display="flex" alignItems="center" gap={3} flexWrap="wrap">
          <Box position="relative">
            <Avatar src={me.avatarUrl ?? undefined} sx={{ width: 96, height: 96, fontSize: 36, bgcolor: "#2f6fed" }}>
              {initial}
            </Avatar>
            <IconButton
              size="small"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              sx={{
                position: "absolute", bottom: -4, right: -4, bgcolor: "#2f6fed", color: "#fff",
                "&:hover": { bgcolor: "#2559c4" },
              }}
            >
              {uploading ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : <PhotoCameraRoundedIcon fontSize="small" />}
            </IconButton>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp"
              hidden
              onChange={handleAvatarChange}
            />
          </Box>

          <Box flexGrow={1} minWidth={200}>
            <Typography variant="h6" fontWeight={700}>
              {me.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {me.role?.name ?? "—"} {me.isClientAdmin ? "· Admin" : ""}
            </Typography>
              <Typography variant="body2" color="text.secondary">
                {me.companyProfile?.companyName ?? me.businessName}
            </Typography>
          </Box>
        </Box>

        {avatarError && <Alert severity="error" sx={{ mt: 2 }}>{avatarError}</Alert>}
        <Typography variant="caption" color="text.secondary" display="block" mt={1}>
          JPG, PNG or WEBP. Max 2MB.
        </Typography>
      </Paper>

      <Paper
        elevation={0}
        sx={{ p: 4, mb: 3, borderRadius: 3, border: "1px solid #eef0f3", boxShadow: "0 2px 8px rgba(16,24,40,0.04)" }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight={700}>
            Account Details
          </Typography>
          {!editing && (
            <Button startIcon={<EditRoundedIcon />} onClick={() => { setEditing(true); setNameSaved(false); }}>
              Edit
            </Button>
          )}
        </Box>

        {nameSaved && <Alert severity="success" sx={{ mb: 2 }}>Profile updated.</Alert>}
        {nameError && <Alert severity="error" sx={{ mb: 2 }}>{nameError}</Alert>}

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">Full Name</Typography>
            {editing ? (
              <TextField
                fullWidth
                size="small"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                sx={{ mt: 0.5 }}
              />
            ) : (
              <Typography variant="body1" fontWeight={500}>{me.name}</Typography>
            )}
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">Email Address</Typography>
            {editing ? (
              <TextField
                fullWidth
                size="small"
                type="email"
                value={emailDraft}
                onChange={(e) => setEmailDraft(e.target.value)}
                sx={{ mt: 0.5 }}
              />
            ) : (
              <Typography variant="body1" fontWeight={500}>{me.email}</Typography>
            )}
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">Role</Typography>
            <Typography variant="body1" fontWeight={500}>{me.role?.name ?? "—"}</Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">Branch</Typography>
            <Typography variant="body1" fontWeight={500}>{me.branch?.name ?? "—"}</Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">Business</Typography>
            <Typography variant="body1" fontWeight={500}>{me.businessName} ({me.clientCode})</Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">Business Phone</Typography>
            <Typography variant="body1" fontWeight={500}>{me.companyProfile?.phone ?? me.phone ?? "—"}</Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">Business Email</Typography>
            <Typography variant="body1" fontWeight={500}>{me.companyProfile?.email ?? me.companyEmail ?? "—"}</Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">Business Type</Typography>
            <Typography variant="body1" fontWeight={500}>{me.companyProfile?.businessType ?? "—"}</Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">GST Number</Typography>
            <Typography variant="body1" fontWeight={500}>{me.companyProfile?.gstNumber ?? "—"}</Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">Currency</Typography>
            <Typography variant="body1" fontWeight={500}>{me.companyProfile?.currency ?? "INR"}</Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="caption" color="text.secondary">Business Address</Typography>
            <Typography variant="body1" fontWeight={500}>{me.companyProfile?.address ?? "—"}</Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">Member Since</Typography>
            <Typography variant="body1" fontWeight={500}>
              {new Date(me.createdAt).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">Last Login</Typography>
            <Typography variant="body1" fontWeight={500}>
              {me.lastLoginAt ? new Date(me.lastLoginAt).toLocaleString() : "—"}
            </Typography>
          </Grid>
        </Grid>

        {editing && (
          <Box display="flex" gap={1.5} mt={3}>
            <Button
              variant="contained"
              disabled={savingName || !nameDraft.trim()}
              onClick={handleSaveName}
              sx={{ bgcolor: "#2f6fed", "&:hover": { bgcolor: "#2559c4" } }}
            >
              {savingName ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              onClick={() => { setEditing(false); setNameDraft(me.name); setEmailDraft(me.email); setNameError(null); }}
              disabled={savingName}
            >
              Cancel
            </Button>
          </Box>
        )}
      </Paper>

      <Paper
        elevation={0}
        sx={{ p: 4, borderRadius: 3, border: "1px solid #eef0f3", boxShadow: "0 2px 8px rgba(16,24,40,0.04)" }}
      >
        <Typography variant="h6" fontWeight={700} mb={2}>
          Change Password
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {passwordSaved && <Alert severity="success" sx={{ mb: 2 }}>Password updated successfully.</Alert>}
        {passwordError && <Alert severity="error" sx={{ mb: 2 }}>{passwordError}</Alert>}

        <Box component="form" onSubmit={handleChangePassword} sx={{ maxWidth: 420 }}>
          <TextField
            fullWidth
            label="Current Password"
            type={showPassword ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: <LockOutlinedIcon fontSize="small" sx={{ color: "text.secondary", mr: 1 }} />,
            }}
          />
          <TextField
            fullWidth
            label="New Password"
            type={showPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            autoComplete="new-password"
            helperText="At least 8 characters"
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: <LockOutlinedIcon fontSize="small" sx={{ color: "text.secondary", mr: 1 }} />,
            }}
          />
          <TextField
            fullWidth
            label="Confirm New Password"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            sx={{ mb: 1 }}
            InputProps={{
              startAdornment: <LockOutlinedIcon fontSize="small" sx={{ color: "text.secondary", mr: 1 }} />,
              endAdornment: (
                <IconButton onClick={() => setShowPassword((v) => !v)} edge="end" size="small">
                  {showPassword ? <VisibilityOffRoundedIcon fontSize="small" /> : <VisibilityRoundedIcon fontSize="small" />}
                </IconButton>
              ),
            }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={changingPassword}
            sx={{ mt: 2, bgcolor: "#2f6fed", "&:hover": { bgcolor: "#2559c4" } }}
          >
            {changingPassword ? "Updating..." : "Update Password"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
