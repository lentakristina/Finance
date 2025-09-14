import { useState, useEffect } from "react";
import api from "../Api";
import { Card, ProgressBar, Button, Form } from "react-bootstrap";

export default function ProgressGoals() {
  const [goals, setGoals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newGoal, setNewGoal] = useState({
    name: "",
    target_amount: "",
    category_id: ""
  });

  const fetchGoals = async () => {
    try {
      const res = await api.get("/goals");
      setGoals(res.data);
    } catch (err) {
      console.error("Error fetching goals:", err.response?.data || err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data.filter((c) => c.type === "save")); // hanya kategori saving
    } catch (err) {
      console.error("Error fetching categories:", err.response?.data || err);
    }
  };

  useEffect(() => {
    fetchGoals();
    fetchCategories();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: newGoal.name,
        target_amount: Number(newGoal.target_amount),
        category_id: Number(newGoal.category_id), // penting: harus number
      };

      await api.post("/goals", payload);
      setNewGoal({ name: "", target_amount: "", category_id: "" });
      fetchGoals();
    } catch (err) {
      console.error("Error adding goal:", err.response?.data || err);
    }
  };

  return (
    <div className="glass-card p-4 shadow-lg rounded-3">
      <h2>🎯 Financial Goals</h2>

      {/* Form Add Goal */}
      <Form onSubmit={handleAdd} className="mb-4">
        <Form.Group className="mb-2">
          <Form.Control
            placeholder="Goal Name"
            value={newGoal.name}
            onChange={(e) =>
              setNewGoal({ ...newGoal, name: e.target.value })
            }
          />
        </Form.Group>
        <Form.Group className="mb-2">
          <Form.Control
            placeholder="Target Amount"
            type="number"
            value={newGoal.target_amount}
            onChange={(e) =>
              setNewGoal({ ...newGoal, target_amount: e.target.value })
            }
          />
        </Form.Group>
        <Form.Group className="mb-2">
          <Form.Select
            value={newGoal.category_id}
            onChange={(e) =>
              setNewGoal({ ...newGoal, category_id: e.target.value })
            }
          >
            <option value="">Select Saving Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        <Button type="submit" className="btn btn-primary">
          + Add Goal
        </Button>
      </Form>

      {/* Goals List */}
      {goals.map((g) => {
        const progress =
          g.target_amount > 0
            ? (g.current_amount / g.target_amount) * 100
            : 0;

        return (
          <Card
            key={g.id}
            className="mb-3 shadow-sm rounded-3 p-3 glass-card"
          >
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-1">{g.name}</h5>
              <span className="text-muted">({g.category?.name || "Saving"})</span>
            </div>

            <div className="d-flex justify-content-between small text-muted mb-1">
              <span>Target: Rp {Number(g.target_amount).toLocaleString()}</span>
              <span>Saved: Rp {Number(g.current_amount).toLocaleString()}</span>
            </div>

            <ProgressBar
              now={progress}
              label={`${progress.toFixed(1)}%`}
              variant={progress >= 100 ? "success" : "info"}
            />
          </Card>
        );
      })}

    </div>
  );
}
