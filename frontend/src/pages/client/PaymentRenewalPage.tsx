import { useEffect, useState } from "react";
import { Alert, Box, Button, Paper, Typography } from "@mui/material";
import { apiClient } from "../../api/client";

export function PaymentRenewalPage() {
  const [info, setInfo] = useState<{ subscriptionStatus: string; subscriptionExpiry: string } | null>(null);
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    apiClient.get("/payment-renewal").then(({ data }) => setInfo(data.data));
  }, []);

  async function handlePaid() {
    await apiClient.post("/payment-renewal/notify", {});
    setNotified(true);
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="grey.100">
      <Paper sx={{ p: 4, width: 420 }}>
        <Typography variant="h5" gutterBottom>Renew your plan</Typography>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Your account is locked. Complete payment below to restore full access — no data has been lost.
        </Alert>
        {info && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            Status: {info.subscriptionStatus} · Expired: {new Date(info.subscriptionExpiry).toLocaleDateString()}
          </Typography>
        )}
        <Typography variant="body2" sx={{ mb: 1 }}>Bank / UPI details and QR code are configured by Super Admin and rendered here.</Typography>
        {notified ? (
          <Alert severity="success">We've notified our team — access will be restored once payment is verified.</Alert>
        ) : (
          <Button fullWidth variant="contained" onClick={handlePaid}>I have made the payment</Button>
        )}
      </Paper>
    </Box>
  );
}
