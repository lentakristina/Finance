import { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import api from "../Api";

export default function TransactionForm({ 
  show, 
  handleClose, 
  onSuccess, 
  categories, 
  mode = "add",       // "add" atau "edit"
  initialData = null, // data transaksi pas edit
}) {
  const [formData, setFormData] = useState({
    date: "",
    category_id: "",
    amount: "",
    note: "",
  });

  // Kalau mode edit → isi form otomatis
  useEffect(() => {
    if (initialData) {
      setFormData({
        date: initialData.date || "",
        category_id: initialData.category_id || "",
        amount: initialData.amount || "",
        note: initialData.note || "",
      });
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (mode === "edit" && initialData?.id) {
        await api.put(`/transactions/${initialData.id}`, formData);
      } else {
        await api.post("/transactions", formData);
      }

      // refresh list
      if (onSuccess) onSuccess();
      handleClose();

      // reset form
      setFormData({ date: "", category_id: "", amount: "", note: "" });
    } catch (err) {
      console.error("Error saving transaction:", err);
    }
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>
          {mode === "edit" ? "Edit Transaction" : "Add Transaction"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Date</Form.Label>
            <Form.Control
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </Form.Group>

        <Form.Select
          value={formData.category_id}
          onChange={(e) => setFormData({ ...formData, category_id:  Number(e.target.value) })}
        >
          <option value="">Select Category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.type})
            </option>
          ))}
        </Form.Select>

<Form.Group className="mb-2">
  {formData.category_id && categories.find(c => c.id == formData.category_id)?.name === "Save" && (
    <Form.Select
      value={formData.goal_id || ""}
      onChange={(e) => setFormData({ ...formData, goal_id: e.target.value })}
    >
      <option value="">Select Goal</option>
      {goals.map((g) => (
        <option key={g.id} value={g.id}>
          {g.name} (Target Rp {Number(g.target_amount).toLocaleString()})
        </option>
      ))}
    </Form.Select>
  )}
</Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Amount</Form.Label>
            <Form.Control
              type="number"
              placeholder="Enter amount"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Note</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="Optional note..."
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            />
          </Form.Group>

          <Button variant="success" type="submit" className="w-100">
            {mode === "edit" ? "Save Changes" : "Save Transaction"}
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
