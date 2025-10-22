import { useState, useEffect, useMemo } from "react";
import {Button, Table, Pagination, Modal, Form, Row, Col, Card, Container, Alert, Placeholder,} from "react-bootstrap";
import api from "../api/axios";
import toast from "react-hot-toast";
import "./Transaction.css";
import { formatCurrency, formatDate } from "../utils/format";

export default function Transactions() {
  // ==========================================
  // 1️⃣ STATE DECLARATIONS
  // ==========================================
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

  // ⭐ FILTER STATE
  const [filters, setFilters] = useState({
    search: "",
    categoryId: "",
    type: "", 
    startDate: "",
    endDate: "",
    datePreset: "" 
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ==========================================
  // 2️⃣ COMPUTED VALUES / MEMOIZED DATA
  // ==========================================
  
  // ⭐ FILTERED TRANSACTIONS
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Filter by search (note or amount)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchNote = tx.note?.toLowerCase().includes(searchLower);
        const matchAmount = tx.amount.toString().includes(searchLower);
        if (!matchNote && !matchAmount) return false;
      }

      // Filter by category
      if (filters.categoryId) {
        if (tx.category_id.toString() !== filters.categoryId) return false;
      }

      // Filter by type
      if (filters.type) {
        if (tx.category?.type !== filters.type) return false;
      }

      // Filter by date range
      if (filters.startDate) {
        const txDate = new Date(tx.date);
        const startDate = new Date(filters.startDate);
        if (txDate < startDate) return false;
      }

      if (filters.endDate) {
        const txDate = new Date(tx.date);
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59);
        if (txDate > endDate) return false;
      }

      return true;
    });
  }, [transactions, filters]);

  // ⭐ FILTERED STATISTICS
  const filteredStats = useMemo(() => {
    return filteredTransactions.reduce((acc, tx) => {
      const amount = parseFloat(tx.amount);
      const type = tx.category?.type;
      
      acc.total += amount;
      acc.count += 1;
      
      if (type === 'income') acc.income += amount;
      else if (type === 'expense') acc.expense += amount;
      else if (type === 'saving') acc.saving += amount;
      
      return acc;
    }, { total: 0, income: 0, expense: 0, saving: 0, count: 0 });
  }, [filteredTransactions]);

  // ⭐ PAGINATION (dengan filteredTransactions)
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filteredTransactions.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  // ==========================================
  // 3️⃣ EFFECTS
  // ==========================================
  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // ==========================================
  // 4️⃣ FETCH FUNCTIONS
  // ==========================================
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

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data);
    } catch (err) {
      toast.error("Failed to load categories");
    }
  };

  // ==========================================
  // 5️⃣ FILTER HANDLER FUNCTIONS
  // ==========================================
  const handleDatePreset = (preset) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch(preset) {
      case 'today':
        start = end = today;
        break;
      case 'week':
        start.setDate(today.getDate() - 7);
        break;
      case 'month':
        start.setMonth(today.getMonth() - 1);
        break;
      case 'all':
        setFilters(prev => ({
          ...prev,
          startDate: "",
          endDate: "",
          datePreset: "all"
        }));
        return;
      default:
        return;
    }

    setFilters(prev => ({
      ...prev,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      datePreset: preset
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      categoryId: "",
      type: "",
      startDate: "",
      endDate: "",
      datePreset: ""
    });
  };

  const hasActiveFilters = filters.search || filters.categoryId || 
                           filters.type || filters.startDate || 
                           filters.endDate;

  // ==========================================
  // 6️⃣ MODAL HANDLER FUNCTIONS
  // ==========================================
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

  // ==========================================
  // 7️⃣ RENDER / RETURN JSX
  // ==========================================
  const getCategoryIcon = (category) => {
    const icons = {
      'Health': '🏥',
      'Saving': '💰',
      'Food': '🍔',
      'Transport': '🚗',
      'Entertainment': '🎬',
      'Shopping': '🛍️',
      'Education': '📚',
      'Utilities': '💡'
    };
    return icons[category] || '📊';
  };

  const getTypeBadge = (type) => {
    const styles = {
      income: 'badge-income',
      expense: 'badge-expense',
      saving: 'badge-saving'
    };
    const icons = {
      income: '↓',
      expense: '↑',
      saving: '🏦'
    };
    const labels = {
      income: 'Income',
      expense: 'Expense',
      saving: 'Saving'
    };
    return (
      <span className={`type-badge ${styles[type]}`}>
        <span className="badge-icon">{icons[type]}</span>
        {labels[type]}
      </span>
    );
  };

  return (
    <Container fluid className="transaction-container">
      {/* =============== PAGE HEADER =============== */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Transaction History</h2>
          <p className="page-subtitle">Track and manage all your transactions</p>
        </div>
        <div className="header-actions">
          <Button 
            variant="outline-secondary" 
            className="btn-export"
            size="sm"
          >
            <i className="bi bi-download me-2"></i>
            Export
          </Button>
          <Button 
            onClick={handleAdd}  
            variant="primary"
            className="btn-add"
            size="sm"
          >
            <i className="bi bi-plus-lg me-2"></i>
            Add Transaction
          </Button>
        </div>
      </div>

      {/* =============== FILTER SECTION =============== */}
      <Card className="filter-card">
        <Card.Body>
          <Row className="g-3 mb-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label className="filter-label">
                  <i className="bi bi-search me-2"></i>
                  Search
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search note or amount..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({...prev, search: e.target.value}))}
                  className="filter-input"
                />
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group>
                <Form.Label className="filter-label">
                  <i className="bi bi-tags me-2"></i>
                  Category
                </Form.Label>
                <Form.Select
                  value={filters.categoryId}
                  onChange={(e) => setFilters(prev => ({...prev, categoryId: e.target.value}))}
                  className="filter-input"
                >
                  <option value="">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group>
                <Form.Label className="filter-label">
                  <i className="bi bi-filter me-2"></i>
                  Type
                </Form.Label>
                <Form.Select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({...prev, type: e.target.value}))}
                  className="filter-input"
                >
                  <option value="">All Types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                  <option value="saving">Saving</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group>
                <Form.Label className="filter-label">
                  <i className="bi bi-calendar-range me-2"></i>
                  Date Range
                </Form.Label>
                <Form.Select
                  value={filters.datePreset}
                  onChange={(e) => handleDatePreset(e.target.value)}
                  className="filter-input"
                >
                  <option value="">Select Range</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="all">All Time</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <div className="filter-footer">
            <div className="filter-stats">
              <i className="bi bi-bar-chart-line me-2"></i>
              <span className="stats-label">Total Transactions:</span>
              <span className="stats-value">{filteredStats.count}</span>
            </div>
            {hasActiveFilters && (
              <Button 
                variant="link" 
                size="sm" 
                onClick={handleClearFilters}
                className="btn-reset"
              >
                Reset Filters
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* =============== TABLE SECTION =============== */}
      <Card className="table-card">
        <Card.Body className="p-0">
          {loading ? (
            <div className="p-4">
              <Table hover className="modern-table mb-0">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Note</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td><Placeholder animation="glow"><Placeholder xs={6} /></Placeholder></td>
                      <td><Placeholder animation="glow"><Placeholder xs={4} /></Placeholder></td>
                      <td><Placeholder animation="glow"><Placeholder xs={5} /></Placeholder></td>
                      <td><Placeholder animation="glow"><Placeholder xs={5} /></Placeholder></td>
                      <td><Placeholder animation="glow"><Placeholder xs={8} /></Placeholder></td>
                      <td><Placeholder animation="glow"><Placeholder xs={6} /></Placeholder></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="modern-table mb-0">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Note</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((t, index) => (
                    <tr
                      key={t.id}
                      className={index % 2 === 0 ? "" : "row-alternate"}
                    >
                      <td>
                        <div className="cell-date">
                          <i className="bi bi-calendar3 me-2 text-muted"></i>
                          {formatDate(t.date)}
                        </div>
                      </td>
                      <td>
                        <div className="cell-category">
                          <span className="category-icon">{getCategoryIcon(t.category?.name)}</span>
                          <span className="category-name">{t.category?.name || "N/A"}</span>
                        </div>
                      </td>
                      <td>
                        {getTypeBadge(t.category?.type || 'expense')}
                      </td>
                      <td>
                        <span className={`cell-amount amount-${t.category?.type || 'expense'}`}>
                          {formatCurrency(Number(t.amount))}
                        </span>
                      </td>
                      <td>
                        <span className="cell-note">{t.note || "-"}</span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-action btn-action-edit"
                            onClick={() => handleEdit(t)}
                            title="Edit"
                          >
                            <i className="bi bi-pencil"></i>
                            Edit
                          </button>
                          <button
                            className="btn-action btn-action-delete"
                            onClick={() => handleDelete(t.id)}
                            title="Delete"
                          >
                            <i className="bi bi-trash"></i>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {currentItems.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-5">
                        <div className="empty-state">
                          <i className="bi bi-inbox fs-1 d-block mb-3 text-muted"></i>
                          <h5>No transactions found</h5>
                          <p className="text-muted">
                            {hasActiveFilters 
                              ? "Try adjusting your filters" 
                              : "Start by adding your first transaction"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>

        {/* =============== PAGINATION =============== */}
        {totalPages > 1 && (
          <div className="table-footer">
            <div className="pagination-info">
              Showing <strong>{indexOfFirst + 1}</strong> to <strong>{Math.min(indexOfLast, filteredTransactions.length)}</strong> of <strong>{filteredTransactions.length}</strong> results
            </div>
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
      </Card>

      {/* =============== MODAL ADD/EDIT =============== */}
      <Modal
        show={showModal}
        onHide={handleCloseModal}
        centered
        size="lg"
        backdrop="static"
        className="transaction-modal"
      >
        <Modal.Header closeButton className="modal-header-custom">
          <Modal.Title>
            <i className={`bi ${modalMode === "add" ? "bi-plus-lg" : "bi-pencil"} me-2`}></i>
            {modalMode === "add" ? "Add New Transaction" : "Edit Transaction"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form onSubmit={handleSave}>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="form-label-custom">
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
                    className="form-input-custom"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="form-label-custom">
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
                    className="form-input-custom"
                    placeholder="0.00"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3 mt-2">
              <Col md={selectedCategory?.type === "saving" ? 6 : 12}>
                <Form.Group>
                  <Form.Label className="form-label-custom">
                    <i className="bi bi-tags me-2"></i>
                    Category
                  </Form.Label>
                  <Form.Select
                    value={formData.category_id}
                    onChange={(e) => {
                      const catId = e.target.value;
                      setFormData({ ...formData, category_id: catId, goal_id: null });
                      const cat = categories.find((c) => c.id.toString() === catId);
                      setSelectedCategory(cat);
                    }}
                    required
                    className="form-input-custom"
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
                    <Form.Label className="form-label-custom">
                      <i className="bi bi-bullseye me-2"></i>
                      Goal (optional)
                    </Form.Label>
                    
                    {goals.length === 0 ? (
                      <Alert variant="warning" className="mb-0 alert-custom">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        No goals available. Create a goal first.
                      </Alert>
                    ) : (
                      <Form.Select
                        value={formData.goal_id || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData(prev => ({ 
                            ...prev, 
                            goal_id: value === "" ? null : parseInt(value, 10)
                          }));
                        }}
                        className="form-input-custom"
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
              <Form.Label className="form-label-custom">
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
                className="form-input-custom"
              />
            </Form.Group>

            <div className="modal-actions">
              <Button 
                variant="outline-secondary" 
                onClick={handleCloseModal}
                className="btn-modal-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary" 
                className="btn-modal-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
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
        </Modal.Body>
      </Modal>
    </Container>
  );
}