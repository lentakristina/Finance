import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api', // alamat Laravel API
});
export const getGoals = () => api.get("/goals");
export const createGoal = (data) => api.post("/goals", data);
export const updateGoal = (id, data) => api.put(`/goals/${id}`, data);
export const deleteGoal = (id) => api.delete(`/goals/${id}`);

export default api;
