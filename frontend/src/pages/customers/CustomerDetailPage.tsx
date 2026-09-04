import { useEffect, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import { Box, Typography, Paper, Grid, List, ListItem, ListItemText, Link } from "@mui/material";
import { apiClient } from "../../api/client";
import { CustomFieldsForm } from "../../components/CustomFieldsForm";

export function CustomerDetailPage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<any>(null);

  useEffect(() => {
    apiClient.get(`/customers/${id}`).then(({ data }) => setCustomer(data.data));
  }, [id]);

  if (!customer) return <Box p={4}>Loading…</Box>;

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>{customer.name}</Typography>
      <Typography color="text.secondary" mb={3}>{customer.phone} · {customer.email ?? "no email"}</Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>Enquiries</Typography>
          <Paper>
            <List>
              {customer.enquiries?.map((e: any) => (
                <ListItem key={e.id}>
                  <ListItemText
                    primary={<Link component={RouterLink} to={`/app/enquiries/${e.id}`}>{e.destination ?? "Enquiry"} — {e.status}</Link>}
                    secondary={new Date(e.createdAt).toLocaleDateString()}
                  />
                </ListItem>
              ))}
              {(!customer.enquiries || customer.enquiries.length === 0) && <ListItem><ListItemText primary="No enquiries yet." /></ListItem>}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>Bookings</Typography>
          <Paper>
            <List>
              {customer.bookings?.map((b: any) => (
                <ListItem key={b.id}><ListItemText primary={`Booking — ${b.status}`} secondary={new Date(b.createdAt).toLocaleDateString()} /></ListItem>
              ))}
              {(!customer.bookings || customer.bookings.length === 0) && <ListItem><ListItemText primary="No bookings yet." /></ListItem>}
            </List>
          </Paper>
        </Grid>
      </Grid>

      <CustomFieldsForm module="customers" recordId={id!} />
    </Box>
  );
}
