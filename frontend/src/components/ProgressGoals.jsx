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
  Container,
  Placeholder,
} from "react-bootstrap";
import toast from "react-hot-toast";
import "./Goals.css";
import { formatCurrency } from "../utils/format";

export default function ProgressGoals() {
  const [goals, setGoals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editGoal, setEditGoal] = useState(null);
  const [goalForm, setGoalForm] = useState({
    name: "",
    target_amount: "",
    category_id: "",
  });
  const [loading, setLoading] = useState(true);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await api.get("/goals");
      setGoals(res.data || []);
    } catch {
      toast.error("Failed to load goals");
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories((res.data || []).filter((c) => c.type === "saving"));
    } catch {
      toast.error("Failed to load categories");
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
        toast.success("Goal updated successfully!");
      } else {
        await api.post("/goals", payload);
        toast.success("Goal added successfully!");
      }
      setShowModal(false);
      setEditGoal(null);
      setGoalForm({ name: "", target_amount: "", category_id: "" });
      fetchGoals();
    } catch {
      toast.error("Failed to save goal");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this goal?")) return;
    try {
      await api.delete(`/goals/${id}`);
      toast.success("Goal deleted successfully!");
      fetchGoals();
    } catch {
      toast.error("Failed to delete goal");
    }
  };

  return (
    <Container fluid className="goals-container">
      <div className="d-flex justify-content-between align-items-center mt-4 mb-4">
        <h5 className="fw-semibold text-dark mb-0">Goals Dashboard</h5>
        <Button
          onClick={() => setShowModal(true)}
          variant="primary"
          size="sm"
          className="shadow-sm"
        >
          <i className="bi bi-plus-lg me-1"></i> Add Goal
        </Button>
      </div>

      {loading ? (
        <Row>
          {[1, 2, 3].map((i) => (
            <Col md={6} lg={4} key={i} className="mb-4">
              <Card
                className="shadow-sm border-0"
                style={{ borderRadius: "1rem" }}
              >
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Placeholder as="h6" animation="glow" className="w-50">
                      <Placeholder xs={8} />
                    </Placeholder>
                    <Placeholder animation="glow" className="w-25">
                      <Placeholder xs={6} />
                    </Placeholder>
                  </div>

                  <Placeholder animation="glow">
                    <Placeholder xs={6} /> <Placeholder xs={4} />
                  </Placeholder>

                  <div className="mt-3">
                    <Placeholder as="div" animation="glow" className="w-100">
                      <Placeholder xs={12} style={{ height: "10px" }} />
                    </Placeholder>
                  </div>

                  <div className="d-flex justify-content-between mt-4">
                    <Placeholder.Button variant="outline-primary" xs={5} />
                    <Placeholder.Button variant="outline-danger" xs={5} />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Row>
          {goals.length === 0 ? (
            <p className="text-muted text-center mt-4">
              No goals yet. Click <b>Add Goal</b> to start saving!
            </p>
          ) : (
            goals.map((g) => {
              const progress = g.target_amount
                ? Math.min(100, ((g.current_amount ?? 0) / g.target_amount) * 100)
                : 0;
              const achieved = progress >= 100;

              return (
                <Col md={6} lg={4} key={g.id} className="mb-4">
                  <Card
                    className="goal-card border-0 shadow-sm h-100"
                    style={{
                      borderRadius: "12px",
                      backgroundColor: "#ffffff",
                      borderLeft: achieved ? "4px solid #10b981" : "4px solid #3b82f6",
                      minHeight: "280px"
                    }}
                  >
                    <Card.Body className="d-flex flex-column p-4">
                      {/* Header with name & category */}
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <h5 className="fw-bold mb-0 text-dark">{g.name}</h5>
                        <span className="badge bg-secondary bg-opacity-10 text-dark px-2 py-1">
                          {g.category?.name || "Saving"}
                        </span>
                      </div>

                      {/* Target & Saved Amount */}
                      <div className="mb-3">
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted" style={{ fontSize: '0.9rem' }}>
                            <i className="bi bi-bullseye me-1"></i>Target
                          </span>
                          <span className="fw-semibold text-dark">
                            {formatCurrency(g.target_amount ?? 0)}
                          </span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span className="text-muted" style={{ fontSize: '0.9rem' }}>
                            <i className="bi bi-piggy-bank me-1"></i>Saved
                          </span>
                          <span className="fw-semibold text-success">
                            {formatCurrency(g.current_amount ?? 0)}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <span className="small text-muted">Progress</span>
                          <span className="small fw-semibold">
                            {progress.toFixed(1)}%
                          </span>
                        </div>
                        <ProgressBar
                          now={progress}
                          variant={achieved ? "success" : "info"}
                          style={{ height: "12px", borderRadius: "6px" }}
                        />
                      </div>

                      {/* Achievement Badge */}
                      {achieved && (
                        <div className="alert alert-success text-center py-2 mb-3" role="alert">
                          <i className="bi bi-trophy-fill me-2"></i>
                          <strong>Goal Achieved!</strong>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="d-flex gap-2 mt-auto">
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
                          className="flex-fill"
                        >
                          <i className="bi bi-pencil-square me-1"></i> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => handleDelete(g.id)}
                          className="flex-fill"
                        >
                          <i className="bi bi-trash3 me-1"></i> Delete
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })
          )}
        </Row>
      )}

      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        size="lg"
        backdrop="static"
      >
        <Card className="shadow-lg border-0">
          <Card.Header className="bg-primary text-white border-0 d-flex justify-content-between align-items-center">
            <h6 className="mb-0 fw-semibold">
              <i
                className={`bi ${
                  editGoal ? "bi-pencil" : "bi-plus-lg"
                } me-2`}
              ></i>
              {editGoal ? "Edit Goal" : "Add Goal"}
            </h6>
            <Button
              variant="link"
              className="text-white p-0"
              onClick={() => setShowModal(false)}
            >
              <i className="bi bi-x-lg fs-5"></i>
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
                        setGoalForm({
                          ...goalForm,
                          target_amount: e.target.value,
                        })
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
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowModal(false)}
                >
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
    </Container>
  );
}