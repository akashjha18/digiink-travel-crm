import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Box, Typography, Paper, TextField, Button, Table, TableHead, TableRow,
  TableCell, TableBody, IconButton, Grid,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { apiClient } from "../../api/client";

interface ItineraryItem { description: string; amountInPaise: number }

// Handles both "new quotation for enquiry ?enquiryId=..." and
// "new version of an existing quotation" (:id present) — SRS FR-4.1/4.3.
export function QuotationBuilderPage() {
  const { id: existingQuotationId } = useParams();
  const [searchParams] = useSearchParams();
  const enquiryId = searchParams.get("enquiryId");
  const navigate = useNavigate();

  const [items, setItems] = useState<ItineraryItem[]>([{ description: "", amountInPaise: 0 }]);
  const [markup, setMarkup] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [terms, setTerms] = useState("");

  useEffect(() => {
    if (existingQuotationId) {
      apiClient.get(`/quotations/${existingQuotationId}`).then(({ data }) => {
        const q = data.data;
        setItems(q.itineraryJson);
        setMarkup(q.markupInPaise / 100);
        setDiscount(q.discountInPaise / 100);
        setTax(q.taxInPaise / 100);
        setTerms(q.termsAndConditions ?? "");
      });
    }
  }, [existingQuotationId]);

  const itemsTotal = items.reduce((sum, i) => sum + (i.amountInPaise || 0), 0);
  const grandTotal = itemsTotal + markup * 100 - discount * 100 + tax * 100;

  function updateItem(index: number, field: keyof ItineraryItem, value: string) {
    const next = [...items];
    next[index] = { ...next[index], [field]: field === "amountInPaise" ? Math.round(Number(value) * 100) : value };
    setItems(next);
  }

  function addItem() { setItems([...items, { description: "", amountInPaise: 0 }]); }
  function removeItem(index: number) { setItems(items.filter((_, i) => i !== index)); }

  async function handleSave() {
    const payload = {
      itinerary: items.filter((i) => i.description),
      markupInPaise: Math.round(markup * 100),
      discountInPaise: Math.round(discount * 100),
      taxInPaise: Math.round(tax * 100),
      termsAndConditions: terms,
    };

    if (existingQuotationId) {
      const { data } = await apiClient.post(`/quotations/${existingQuotationId}/new-version`, payload);
      navigate(`/app/quotations/${data.data.id}`);
    } else {
      const { data } = await apiClient.post("/quotations", { ...payload, enquiryId });
      navigate(`/app/quotations/${data.data.id}`);
    }
  }

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>{existingQuotationId ? "New Quotation Version" : "New Quotation"}</Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Itinerary Items</Typography>
        <Table size="small">
          <TableHead><TableRow><TableCell>Description</TableCell><TableCell width={160}>Amount (₹)</TableCell><TableCell width={50} /></TableRow></TableHead>
          <TableBody>
            {items.map((item, i) => (
              <TableRow key={i}>
                <TableCell><TextField fullWidth size="small" value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)} /></TableCell>
                <TableCell><TextField fullWidth size="small" type="number" value={item.amountInPaise / 100} onChange={(e) => updateItem(i, "amountInPaise", e.target.value)} /></TableCell>
                <TableCell><IconButton size="small" onClick={() => removeItem(i)}><DeleteIcon fontSize="small" /></IconButton></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Button size="small" onClick={addItem} sx={{ mt: 1 }}>+ Add Item</Button>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={4}><TextField fullWidth label="Markup (₹)" type="number" value={markup} onChange={(e) => setMarkup(Number(e.target.value))} /></Grid>
          <Grid item xs={4}><TextField fullWidth label="Discount (₹)" type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} /></Grid>
          <Grid item xs={4}><TextField fullWidth label="Tax (₹)" type="number" value={tax} onChange={(e) => setTax(Number(e.target.value))} /></Grid>
        </Grid>
        <Typography variant="h6" mt={2}>Total: ₹{(grandTotal / 100).toLocaleString()}</Typography>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <TextField fullWidth multiline rows={4} label="Terms & Conditions" value={terms} onChange={(e) => setTerms(e.target.value)} />
      </Paper>

      <Button variant="contained" onClick={handleSave} disabled={items.every((i) => !i.description)}>
        Save as Draft
      </Button>
    </Box>
  );
}
