import { useState, useEffect } from "react";
import {
  Button, Table, Pagination, Modal, Form, Row, Col, Card, Container, Alert, Placeholder,
} from "react-bootstrap";
import api from "../api/axios";
import toast from "react-hot-toast";
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
    goal_id: null,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ================= FETCH DATA =================
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const [txRes, goalsRes] = await Promise.all([
        api.get("/transactions"),
        api.get("/goals")
      ]);
      
      const txData = txRes.data || [];
      const goalsData = goalsRes.data || [];
      
      console.log('📦 Fetched data:', {
        transactions: txData.length,
        goals: goalsData.length
      });
      
      const correctedGoals = goalsData.map(goal => {
        const goalTransactions = txData.filter(tx => tx.goal_id === goal.id);
        
        const calculatedAmount = goalTransactions.reduce(
          (sum, tx) => sum + parseFloat(tx.amount || 0),
          0
        );
        
        console.log(`Goal "${goal.name}" (ID: ${goal.id}):`, {
          backend: parseFloat(goal.current_amount),
          calculated: calculatedAmount,
          diff: parseFloat(goal.current_amount) - calculatedAmount,
          transactions: goalTransactions.length,
          transaction_ids: goalTransactions.map(t => t.id)
        });
        
        return {
          ...goal,
          current_amount: calculatedAmount
        };
      });
      
      setTransactions(txData);
      setGoals(correctedGoals);
      
      console.log('✅ Data loaded & recalculated');
      
    } catch (err) {
      console.error("Failed to fetch data:", err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchGoals = async () => {
    try {
      const res = await api.get("/goals");
      setGoals(res.data || []);
    } catch (err) {
      toast.error("Failed to load goals");
    }
  };

  const recalculateGoals = async (transactionsData = null) => {
    try {
      const [goalsRes, txRes] = await Promise.all([
        api.get("/goals"),
        transactionsData ? Promise.resolve({ data: transactionsData }) : api.get("/transactions")
      ]);
      
      const goalsData = goalsRes.data || [];
      const txData = txRes.data || [];
      
      console.log('🔄 Recalculating goals...');
      
      const correctedGoals = goalsData.map(goal => {
        const goalTransactions = txData.filter(tx => tx.goal_id === goal.id);
        
        const correctAmount = goalTransactions.reduce(
          (sum, tx) => sum + parseFloat(tx.amount || 0),
          0
        );
        
        console.log(`Goal "${goal.name}" (ID: ${goal.id}):`, {
          fromBackend: parseFloat(goal.current_amount),
          calculated: correctAmount,
          difference: parseFloat(goal.current_amount) - correctAmount,
          transactions: goalTransactions.length
        });
        
        return {
          ...goal,
          current_amount: correctAmount.toFixed(2),
          backend_amount: goal.current_amount
        };
      });
      
      setGoals(correctedGoals);
      console.log('✅ Goals recalculated');
      
    } catch (err) {
      console.error("Failed to recalculate goals:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data);
    } catch (err) {
      toast.error("Failed to load categories");
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, []);

  // ================= MODAL HANDLER =================
  const handleAdd = () => {
    setModalMode("add");
    setSelectedTx(null);
    setFormData({
      date: new Date().toISOString().split("T")[0],
      category_id: "",
      amount: "",
      note: "",
      goal_id: null,
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
      await fetchTransactions();
      toast.success("Transaction deleted 🗑️");
    } catch (err) {
      toast.error("Failed to delete transaction");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const amount = parseFloat(formData.amount);
      const categoryId = parseInt(formData.category_id, 10);
      const goalId = formData.goal_id ? parseInt(formData.goal_id, 10) : null;

      // VALIDASI BASIC
      if (!categoryId || isNaN(categoryId)) {
        toast.error("Category is required");
        setLoading(false);
        return;
      }

      if (isNaN(amount) || amount <= 0) {
        toast.error("Amount must be greater than 0");
        setLoading(false);
        return;
      }

      if (!formData.date) {
        toast.error("Date is required");
        setLoading(false);
        return;
      }

      // VALIDASI GOAL
      if (selectedCategory?.type === "saving" && goalId) {
        const selectedGoal = goals.find(g => g.id === goalId);
        if (selectedGoal) {
          const existingTransactions = transactions.filter(
            tx => tx.goal_id === goalId && tx.id !== selectedTx?.id
          );
          const calculatedCurrentAmount = existingTransactions.reduce(
            (sum, tx) => sum + parseFloat(tx.amount || 0), 0
          );
          const targetAmount = parseFloat(selectedGoal.target_amount);
          const remaining = targetAmount - calculatedCurrentAmount;

          if (amount > remaining) {
            toast.error(
              `Amount exceeds remaining goal!\n\nGoal: ${selectedGoal.name}\nRemaining: ${formatCurrency(remaining)}\nYour input: ${formatCurrency(amount)}`,
              { duration: 5000 }
            );
            setLoading(false);
            return;
          }
        }
      }

      // PREPARE PAYLOAD
      const payload = {
        date: new Date(formData.date).toISOString().split("T")[0],
        category_id: categoryId,
        amount,
        ...(formData.note?.trim() && { note: formData.note.trim() }),
        ...(goalId && { goal_id: goalId })
      };

      // REQUEST KE BACKEND
      let response = modalMode === "add"
        ? await api.post("/transactions", payload)
        : await api.put(`/transactions/${selectedTx.id}`, payload);

      // SUCCESS
      toast.success(
        modalMode === "add" 
          ? "Transaction added successfully!" 
          : "Transaction updated!"
      );

      await fetchTransactions();
      handleCloseModal();

    } catch (err) {
      if (err.response) {
        const { status, data } = err.response;
        if (status === 422) {
          if (data?.message) {
            toast.error(data.message);
          }
          if (data?.errors) {
            Object.values(data.errors).forEach(arr =>
              arr.forEach(msg => toast.error(msg))
            );
          }
        } else if (status === 401) {
          toast.error("Unauthorized. Please login again.");
        } else if (status === 404) {
          toast.error("Resource not found");
        } else if (status === 500) {
          toast.error("Server error. Please try again later.");
        } else {
          toast.error(data?.message || "Failed to save transaction");
        }
      } else if (err.request) {
        toast.error("Network error. Please check your connection.");
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
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
      goal_id: null,
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
      <div className="d-flex justify-content-between align-items-center mt-4 mb-4">
        <h3>Transaction History</h3>
        <Button 
          onClick={handleAdd}  
          variant="primary"
          size="sm">
          <i className="bi bi-plus-lg me-1"></i> Add Transaction
        </Button>
      </div>

      <div>
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            {loading ? (
              <div className="p-4">
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
                    {[...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3">
                          <Placeholder animation="glow">
                            <Placeholder xs={6} />
                          </Placeholder>
                        </td>
                        <td className="px-4 py-3">
                          <Placeholder animation="glow">
                            <Placeholder xs={4} />
                          </Placeholder>
                        </td>
                        <td className="px-4 py-3">
                          <Placeholder animation="glow">
                            <Placeholder xs={5} />
                          </Placeholder>
                        </td>
                        <td className="px-4 py-3">
                          <Placeholder animation="glow">
                            <Placeholder xs={8} />
                          </Placeholder>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="d-flex justify-content-center gap-2">
                            <Placeholder.Button xs={4} variant="outline-secondary" />
                            <Placeholder.Button xs={4} variant="outline-secondary" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
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
                      <tr
                        key={t.id}
                        className={index % 2 === 0 ? "bg-white" : "bg-light bg-opacity-25"}
                      >
                        <td className="px-4 py-3">
                          <span className="fw-medium">{formatDate(t.date)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="badge bg-secondary bg-opacity-10 text-dark px-3 py-2">
                            {t.category?.name || "N/A"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="fw-bold text-success">
                            {formatCurrency(Number(t.amount))}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-muted">{t.note || "-"}</span>
                        </td>
                        <td className="text-center">
                          <div className="btn-group" role="group">
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
                        setFormData({ ...formData, category_id: catId, goal_id: null });
                        const cat = categories.find((c) => c.id.toString() === catId);
                        console.log('Selected category:', cat);
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
                      
                      {goals.length === 0 ? (
                        <Alert variant="warning" className="mb-0">
                          <i className="bi bi-exclamation-triangle me-2"></i>
                          No goals available. Create a goal first.
                        </Alert>
                      ) : (
                        <Form.Select
                          value={formData.goal_id || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            console.log('Goal selected:', value);
                            setFormData(prev => ({ 
                              ...prev, 
                              goal_id: value === "" ? null : parseInt(value, 10)
                            }));
                          }}
                          className="form-select-lg"
                        >
                          <option value="">Don't link to any goal</option>
                          {goals
                            .filter((g) => {
                              const remaining = parseFloat(g.target_amount) - (g.current_amount || 0);
                              return remaining > 0;
                            })
                            .map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.name} (Remaining: {formatCurrency(parseFloat(g.target_amount) - (g.current_amount || 0))})
                              </option>
                            ))}
                        </Form.Select>
                      )}
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