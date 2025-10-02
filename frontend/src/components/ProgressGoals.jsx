import { useState, useEffect } from "react";
import api from "../api/axios";
import {
  Card,
  ProgressBar,
  Button,
  Form,
  Row,
  Col,
  Modal,
  Alert,
  Container,
} from "react-bootstrap";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Goals.css";
import { formatCurrency } from "../utils/format";

export default function ProgressGoals() {
  const [goals, setGoals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [unallocated, setUnallocated] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editGoal, setEditGoal] = useState(null);
  const [allocateModal, setAllocateModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState("");
  const [goalForm, setGoalForm] = useState({
    name: "",
    target_amount: "",
    category_id: "",
  });

  const fetchGoals = async () => {
    try {
      const res = await api.get("/goals");
      setGoals(res.data || []);
      setUnallocated(0);
    } catch {
      toast.error("❌ Failed to load goals");
      setGoals([]);
      setUnallocated(0);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories((res.data || []).filter((c) => c.type === "saving"));
    } catch {
      toast.error("❌ Failed to load categories");
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchGoals();
    fetchCategories();
  }, []);

  const handleSaveGoal = async (e) => {
    e.preventDefault();
    if (!goalForm.name.trim()) return toast.error("Please enter goal name!");
    if (!goalForm.target_amount || Number(goalForm.target_amount) <= 0)
      return toast.error("Please enter valid target amount!");
    if (!goalForm.category_id) return toast.error("Please select category!");

    const payload = {
      name: goalForm.name.trim(),
      target_amount: Number(goalForm.target_amount),
      category_id: Number(goalForm.category_id),
    };

    try {
      if (editGoal) {
        await api.put(`/goals/${editGoal.id}`, payload);
        toast.info("✏️ Goal updated successfully!");
      } else {
        await api.post("/goals", payload);
        toast.success("✅ Goal added successfully!");
      }
      setShowModal(false);
      setEditGoal(null);
      setGoalForm({ name: "", target_amount: "", category_id: "" });
      fetchGoals();
    } catch {
      toast.error("❌ Failed to save goal");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this goal?")) return;
    try {
      await api.delete(`/goals/${id}`);
      toast.warning("🗑 Goal deleted successfully!");
      fetchGoals();
    } catch {
      toast.error("❌ Failed to delete goal");
    }
  };

  const handleAllocate = async () => {
    if (!selectedGoal) return toast.error("Please select a goal first!");
    try {
      await api.post("/unallocated/allocate", { goal_id: selectedGoal });
      toast.success("✅ Unallocated savings allocated!");
      setAllocateModal(false);
      setSelectedGoal("");
      fetchGoals();
    } catch {
      toast.error("❌ Failed to allocate savings");
    }
  };

  return (
    <Container fluid className="goals-container">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Goals Dashboard</h3>
        <Button
          onClick={() => setShowModal(true)}
          variant="primary"
          size="sm">
          <i className="bi bi-plus-lg me-1"></i> Add Goal
        </Button>
      </div>


      {/* Goals Grid */}
      <Row>
        {goals.map((g) => {
          const progress = g.target_amount
            ? Math.min(100, ((g.current_amount ?? 0) / g.target_amount) * 100)
            : 0;
          const achieved = progress >= 100;

          return (
            <Col md={6} lg={4} key={g.id} className="mb-4">
              <Card className={`goal-card shadow-sm ${achieved ? "border-success" : "border-info"}`}>
                <Card.Body className="d-flex flex-column h-100">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5>{g.name}</h5>
                    <span className="category-name">{g.category?.name || "Saving"}</span>
                  </div>

                  <div className="goal-info d-flex justify-content-between small text-muted mb-2">
                    <span>🎯 Target: {formatCurrency(g.target_amount ?? 0)}</span>
                    <span>💰 Saved: {formatCurrency(g.current_amount ?? 0)}</span>
                  </div>

                  <ProgressBar
                    now={progress}
                    label={achieved ? "Goal Achieved!" : `${progress.toFixed(1)}%`}
                    variant={achieved ? "success" : "info"}
                    className="mb-3"
                  />

                  {achieved && (
                    <div className="text-success fw-bold text-center mb-2">
                      🎉 Congrats! Goal completed!
                    </div>
                  )}

                  <div className="d-flex justify-content-between mt-auto">
                    <Button
                      size="sm"
                      variant="outline-primary"
                      disabled={achieved}
                      onClick={() => {
                        setEditGoal(g);
                        setGoalForm({
                          name: g.name,
                          target_amount: g.target_amount,
                          category_id: g.category_id,
                        });
                        setShowModal(true);
                      }}
                    >
                      <i className="bi bi-pencil me-1"></i> Update
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleDelete(g.id)}
                    >
                      <i className="bi bi-trash me-1"></i> Delete
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Modal Add/Edit Goal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg" backdrop="static">
        <Card className="shadow-lg border-0">
          <Card.Header className="bg-primary text-white border-0 d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <i className={`bi ${editGoal ? "bi-pencil" : "bi-plus-lg"} me-2`}></i>
              {editGoal ? "Edit Goal" : "Add Goal"}
            </h5>
            <Button variant="link" className="text-white p-0" onClick={() => setShowModal(false)}>
              <i className="bi bi-x-lg fs-4"></i>
            </Button>
          </Card.Header>
          <Card.Body className="p-4">
            <Form onSubmit={handleSaveGoal}>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Goal Name</Form.Label>
                    <Form.Control
                      placeholder="e.g. Rumah"
                      value={goalForm.name}
                      onChange={(e) =>
                        setGoalForm({ ...goalForm, name: e.target.value })
                      }
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Target Amount</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="e.g. 200000000"
                      value={goalForm.target_amount}
                      onChange={(e) =>
                        setGoalForm({ ...goalForm, target_amount: e.target.value })
                      }
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mt-3">
                <Form.Label>Saving Category</Form.Label>
                <Form.Select
                  value={goalForm.category_id}
                  onChange={(e) =>
                    setGoalForm({ ...goalForm, category_id: e.target.value })
                  }
                  required
                >
                  <option value="">Select Saving Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <Button variant="outline-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  {editGoal ? "Update Goal" : "Add Goal"}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Modal>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </Container>
  );
}
