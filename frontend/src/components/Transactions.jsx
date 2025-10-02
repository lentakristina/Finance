import { useState, useEffect } from "react";
import {
  Button,
  Table,
  Pagination,
  Modal,
  Form,
  Row,
  Col,
  Card,
  Container,
  Alert,
} from "react-bootstrap";
import api from "../api/axios";
import { toast } from "react-toastify";
import "./Transaction.css";
import { formatCurrency, formatDate } from "../utils/format";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [goals, setGoals] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(undefined);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedTx, setSelectedTx] = useState(null);

  const [formData, setFormData] = useState({
    date: "",
    category_id: "",
    amount: "",
    note: "",
    goal_id: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ================= FETCH DATA =================
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.get("/transactions");
      setTransactions(res.data);
    } catch (err) {
  console.log("=== ERROR CAUGHT ===");
  console.log("Status:", err.response?.status);
  
  // Log dengan cara yang lebih eksplisit
  const errorData = err.response?.data;
  console.log("Error message:", errorData?.message);
  console.log("Error errors:", errorData?.errors);
  
  // Stringify untuk melihat semua isi
  console.log("Full error JSON:", JSON.stringify(errorData, null, 2));
  console.error("=== ERROR CAUGHT ===");
  console.error("Full error:", err);
  console.error("Response status:", err.response?.status);
  console.error("Response data:", err.response?.data);
  console.error("Response errors:", err.response?.data?.errors);
  console.error("Response message:", err.response?.data?.message);

  if (err.response?.status === 422) {
    const errorData = err.response?.data;
    
    // Log semua detail error
    console.log("Full error data:", JSON.stringify(errorData, null, 2));
    
    const errors = errorData?.errors;
    if (errors) {
      Object.entries(errors).forEach(([field, messages]) => {
        console.log(`Field "${field}" errors:`, messages);
        messages.forEach(msg => toast.error(`${field}: ${msg}`, { autoClose: 5000 }));
      });
    } else if (errorData?.message) {
      toast.error(errorData.message, { autoClose: 4000 });
    } else {
      toast.error("Validation error. Check console for details.");
    }
  } else {
    toast.error("Failed to save transaction");
  }
} finally {
  console.log('=== FORM SUBMIT END ===');
  setLoading(false);
}
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data);
    } catch (err) {
      toast.error("Failed to load categories ❌");
    }
  };

  const fetchGoals = async () => {
    try {
      const res = await api.get("/goals");
      setGoals(res.data || []);
    } catch (err) {
      toast.error("Failed to load goals ❌");
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
    fetchGoals();
  }, []);

  // ================= MODAL HANDLER =================
  const handleAdd = () => {
    setModalMode("add");
    setSelectedTx(null);
    setFormData({
      date: new Date().toISOString().split("T")[0], // Set today's date as default
      category_id: "",
      amount: "",
      note: "",
      goal_id: "",
    });
    setSelectedCategory(undefined);
    setShowModal(true);
  };

  const handleEdit = (tx) => {
    setModalMode("edit");
    setSelectedTx(tx);
    const cat = categories.find((c) => c.id === tx.category_id);
    setSelectedCategory(cat);
    setFormData({
      date: tx.date.split("T")[0] || "",
      category_id: tx.category_id,
      amount: tx.amount,
      note: tx.note || "",
      goal_id: tx.goal_id || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;
    try {
      await api.delete(`/transactions/${id}`);
      fetchTransactions();
      toast.success("Transaction deleted 🗑️", { autoClose: 2500 });
    } catch (err) {
      toast.error("Failed to delete transaction ❌");
    }
  };

// ================= FORM HANDLER =================
const handleSave = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    // Parse angka
    const amount = parseFloat(formData.amount);
    const categoryId = parseInt(formData.category_id, 10);
    const goalId = formData.goal_id ? parseInt(formData.goal_id, 10) : null;

    console.log('=== FORM SUBMIT START ===');
    console.log('Amount:', amount);
    console.log('Category ID:', categoryId);
    console.log('Goal ID:', goalId);
    console.log('Selected Category:', selectedCategory);

    // ======== VALIDASI BASIC =========
    if (!categoryId || isNaN(categoryId)) {
      toast.error("Category is required ❌");
      setLoading(false);
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      toast.error("Amount must be greater than 0 ❌");
      setLoading(false);
      return;
    }

    if (!formData.date) {
      toast.error("Date is required ❌");
      setLoading(false);
      return;
    }

    // ⭐ HANYA validasi jika user MEMILIH goal
    if (selectedCategory?.type === "saving" && goalId) {
      console.log('🔍 Validating amount vs goal target...');
      
      // Ambil data goal TERBARU
      const freshGoalsRes = await api.get("/goals");
      const freshGoals = freshGoalsRes.data || [];
      
      const selectedGoal = freshGoals.find((g) => g.id === goalId);
      
      if (selectedGoal) {
        const currentAmount = parseFloat(selectedGoal.current_amount) || 0;
        const targetAmount = parseFloat(selectedGoal.target_amount);
        const remaining = targetAmount - currentAmount;
        
        console.log(`Goal "${selectedGoal.name}": target=${targetAmount}, current=${currentAmount}, remaining=${remaining}`);
        
        if (amount > remaining) {
          console.log('❌ VALIDATION FAILED - Amount exceeds remaining!');
          toast.error(
            `Amount melebihi sisa target goal "${selectedGoal.name}"! Maksimum: ${formatCurrency(remaining)}`,
            { 
              autoClose: 5000,
              position: "top-center",
            }
          );
          setLoading(false);
          return;
        }
        
        console.log('✅ Validation passed');
      }
    }

    // ======== PREPARE PAYLOAD ========
    const payload = {
      date: new Date(formData.date).toISOString().split("T")[0],
      category_id: categoryId,
      amount: amount,
    };

    if (formData.note && formData.note.trim()) {
      payload.note = formData.note.trim();
    }

    // ⭐ HANYA kirim goal_id jika user memilih goal
    if (goalId) {
      payload.goal_id = goalId;
    }

    console.log('📦 Sending payload:', payload);

    // ======== REQUEST ========
    if (modalMode === "add") {
      await api.post("/transactions", payload);
      toast.success("Transaction added 🎉", { autoClose: 2500 });
    } else {
      await api.put(`/transactions/${selectedTx.id}`, payload);
      toast.info("Transaction updated ✏️", { autoClose: 2500 });
    }

    console.log('✅ Transaction saved successfully');

    // Refresh data
    await fetchGoals();
    await fetchTransactions();
    handleCloseModal();

  } catch (err) {
    console.error("=== ERROR CAUGHT ===");
    console.error("Full error:", err);
    console.error("Response:", err.response?.data);

    if (err.response?.status === 422) {
      const errorData = err.response?.data;
      
      // Tampilkan error dari backend
      if (errorData?.message) {
        toast.error(errorData.message, { autoClose: 5000 });
      }
      
      // Tampilkan validation errors
      if (errorData?.errors) {
        Object.values(errorData.errors).forEach((arr) => 
          arr.forEach(msg => toast.error(msg, { autoClose: 4000 }))
        );
      }
    } else {
      toast.error("Failed to save transaction ❌");
    }
  } finally {
    console.log('=== FORM SUBMIT END ===');
    setLoading(false);
  }
};


const handleCloseModal = () => {
  setShowModal(false);
  setFormData({
    date: "",
    category_id: "",
    amount: "",
    note: "",
    goal_id: "",
  });
  setSelectedCategory(undefined);
  setModalMode("add");
};


  // ================= PAGINATION =================
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = transactions.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(transactions.length / itemsPerPage);

  // ================= UI =================
  return (
    <Container fluid className="transaction-container">
        {/* Header */}
      <div className="d-flex justify-content-between align-items-center mt-4 mb-4">
        <h3>Transaction History</h3>
        <Button 
          onClick= {handleAdd}  
          variant="primary"
          size="sm">
          <i className="bi bi-plus-lg me-1"></i> Add Transaction
        </Button>
      </div>


      <div>
        {/* Transactions Table */}
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted">Loading transactions...</p>
              </div>
            ) : (
              <div className="table-responsive">
                <Table hover className="align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="border-0 px-4 py-3">Date</th>
                      <th className="border-0 px-4 py-3">Category</th>
                      <th className="border-0 px-4 py-3">Amount</th>
                      <th className="border-0 px-4 py-3">Note</th>
                      <th className="border-0 px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((t, index) => (
                      <tr key={t.id} className={index % 2 === 0 ? "bg-white" : "bg-light bg-opacity-25"}>
                        <td className="px-4 py-3">
                          <span className="fw-medium">{formatDate(t.date)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="badge bg-secondary bg-opacity-10 text-dark px-3 py-2">
                            {t.category?.name || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="fw-bold text-success">
                            {formatCurrency(Number(t.amount))}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-muted">
                            {t.note || '-'}
                          </span>
                        </td>
                        <td className="text-center">
                          <div className="btn-group" role="group">

                        {/* Tombol aksi table */}
                          <Button 
                            size="sm" 
                            className="btn-action-outline me-2"
                            onClick={() => handleDelete(t.id)}
                          >
                            <i className="bi bi-trash me-1"></i> Delete
                          </Button>

                          <Button 
                            size="sm" 
                            className="btn-action-outline"
                            onClick={() => handleEdit(t)}
                          >
                            <i className="bi bi-pencil me-1"></i> Update
                          </Button>


                          </div>
                        </td>

                      </tr>
                    ))}
                    {currentItems.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center py-5">
                          <div className="text-muted">
                            <i className="bi bi-inbox fs-1 d-block mb-3"></i>
                            <h5>No transactions yet</h5>
                            <p>Start by adding your first transaction</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-center mt-4">
            <Pagination className="mb-0">
              <Pagination.Prev 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              />
              {[...Array(totalPages)].map((_, i) => (
                <Pagination.Item
                  key={i + 1}
                  active={i + 1 === currentPage}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </Pagination.Item>
              ))}
              <Pagination.Next 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              />
            </Pagination>
          </div>
        )}
      </div>

      {/* ================= Modal Card Form ================= */}
      <Modal
        show={showModal}
        onHide={handleCloseModal}
        centered
        size="lg"
        backdrop="static"
      >
        <Card className="shadow-lg border-0">
          <Card.Header className="bg-primary text-white border-0">
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">
                <i className={`bi ${modalMode === "add" ? "bi-plus-lg" : "bi-pencil"} me-2`}></i>
                {modalMode === "add" ? "Add New Transaction" : "Edit Transaction"}
              </h4>
              <Button
                variant="link"
                className="text-white p-0"
                onClick={handleCloseModal}
              >
                <i className="bi bi-x-lg fs-4"></i>
              </Button>
            </div>
          </Card.Header>
          <Card.Body className="p-4">
            <Form onSubmit={handleSave}>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-medium">
                      <i className="bi bi-calendar3 me-2"></i>
                      Date
                    </Form.Label>
                    <Form.Control
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      required
                      className="form-control-lg"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-medium">
                      <i className="bi bi-currency-dollar me-2"></i>
                      Amount
                    </Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                      required
                      className="form-control-lg"
                      placeholder="0.00"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="g-3 mt-2">
                <Col md={selectedCategory?.type === "saving" ? 6 : 12}>
                  <Form.Group>
                    <Form.Label className="fw-medium">
                      <i className="bi bi-tags me-2"></i>
                      Category
                    </Form.Label>
                    <Form.Select
                      value={formData.category_id}
                      onChange={(e) => {
                        const catId = e.target.value;
                        setFormData({ ...formData, category_id: catId, goal_id: "" });
                        const cat = categories.find((c) => c.id.toString() === catId);

                        console.log('Selected category ID:', catId);
                        console.log('Found category:', cat);
                        console.log('Category type:', cat?.type);
                        console.log('All categories:', categories);

                        setSelectedCategory(cat);
                      }}
                      required
                      className="form-select-lg"
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                {selectedCategory?.type === "saving" && (
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-medium">
                      <i className="bi bi-bullseye me-2"></i>
                      Goal (optional)
                    </Form.Label>
                    <Form.Select
                      value={formData.goal_id}
                      onChange={(e) => {
                        console.log('Goal selected:', e.target.value);
                        setFormData(prev => ({ ...prev, goal_id: e.target.value }));
                      }}
                      className="form-select-lg"
                    >
                      <option value="">Create new goal</option>
                      {(() => {
                        const availableGoals = goals.filter((g) => {
                          const remaining = g.target_amount - (g.current_amount || 0);
                          const hasSpace = remaining > 0;
                         console.log(`Goal: ${g.name}, Target: ${g.target_amount}, Current: ${g.current_amount}, Remaining: ${remaining}, Has space: ${hasSpace}`);
                          return hasSpace;
                        });
                        
                        console.log('Available goals:', availableGoals);
                        
                        return availableGoals.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name} (Sisa: {formatCurrency(g.target_amount - (g.current_amount || 0))})
                          </option>
                        ));
                      })()}
                    </Form.Select>
                  </Form.Group>
                </Col>
              )}
              </Row>

              <Form.Group className="mt-3">
                <Form.Label className="fw-medium">
                  <i className="bi bi-chat-text me-2"></i>
                  Note
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={formData.note}
                  onChange={(e) =>
                    setFormData({ ...formData, note: e.target.value })
                  }
                  placeholder="Add a note (optional)"
                  className="form-control-lg"
                />
              </Form.Group>

              <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-4">
                <Button 
                  variant="outline-secondary" 
                  onClick={handleCloseModal}
                  className="px-4"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="px-4"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg me-2"></i>
                      {modalMode === "add" ? "Add Transaction" : "Update Transaction"}
                    </>
                  )}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Modal>
    </Container>
  );
}