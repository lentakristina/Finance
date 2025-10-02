// src/api/goals.js
import api from "./axios";

// ✅ GET all goals
export const getGoals = () => api.get("/goals");

// ✅ GET single goal by ID
export const getGoal = (id) => api.get(`/goals/${id}`);

// ✅ CREATE new goal
export const createGoal = (data) => api.post("/goals", data);

// ✅ UPDATE existing goal
export const updateGoal = (id, data) => api.put(`/goals/${id}`, data);

// ✅ DELETE goal
export const deleteGoal = (id) => api.delete(`/goals/${id}`);
