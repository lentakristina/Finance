import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import Dashboard from "./components/Dashboard";
import TransactionsList from "./components/TransactionsList";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import ProgressGoals from "./components/ProgressGoals";
import "./App.css";

function App() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    category_id: "",
    amount: "",
    date: "",
    note: "",
  });

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, []);

  const fetchTransactions = async () => {
    const res = await axios.get("http://127.0.0.1:8000/api/transactions");
    setTransactions(res.data);
  };

  const fetchCategories = async () => {
    const res = await axios.get("http://127.0.0.1:8000/api/categories");
    setCategories(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post("http://127.0.0.1:8000/api/transactions", form);
    setForm({ category_id: "", amount: "", date: "", note: "" });
    fetchTransactions();
  };

  const handleDelete = async (id) => {
    await axios.delete(`http://127.0.0.1:8000/api/transactions/${id}`);
    fetchTransactions();
  };

  return (
    <Router>
      <div className="app-container">
        {/* 🔹 Navigation */}
        <nav className="navbar">
          <h3 className="logo">💸 Financial Data 'Lenta Kristina'</h3>
          <ul className="nav-links">
            <li><NavLink to="/" end>Dashboard</NavLink></li>
            <li><NavLink to="/transactions">Transactions</NavLink></li>
            <li><NavLink to="/goals">Goals</NavLink></li>
          </ul>
        </nav>

        {/* 🔹 Routing Pages */}
        <div className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<TransactionsList />} />
            <Route path="/goals" element={<ProgressGoals />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
