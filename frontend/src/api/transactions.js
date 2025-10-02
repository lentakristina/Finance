import api from "./axios";

export const getTransactions = () => api.get("/transactions");
export const createTransaction = (data) => api.post("/transactions", data);
export const updateTransaction = (id, data) => api.put(`/transactions/${id}`, data);
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`);

// summary & insight
export const summaryLast3Months = () => api.get("/transactions/summary");
export const summaryCurrentMonth = () => api.get("/transactions/summary-current");
export const insightCurrentMonth = () => api.get("/transactions/insight");
