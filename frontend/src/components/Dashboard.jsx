import { useEffect, useState } from "react";
import api from "../Api";
import { Card, Row, Col } from "react-bootstrap";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion"; // 🚀 animasi
import { formatRupiah } from "../utils/format";
import SmartInsight from "./SmartInsight";
import "./Dashboard.css";

export default function Dashboard() {
  const [summary, setSummary] = useState([]);
  const [currentMonth, setCurrentMonth] = useState({ income: 0, expense: 0 });
const [categories, setCategories] = useState([]);

useEffect(() => {
  const fetchData = async () => {
    // fetch summary
    const res = await api.get("/transactions/summary");
    const last3 = res.data.slice(-3);
    setSummary(last3);

    const resCurrent = await api.get("/transactions/summary-current");
    setCurrentMonth(resCurrent.data);

    // 🔹 fetch categories
    const resCategories = await api.get("/categories");
    setCategories(resCategories.data);
  };
  fetchData();
}, []);


  return (
    <div className="dashboard-container">
      {/* 🔹 Monthly Summary */}
      <Row className="mb-4">
        <Col md={6}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="glass-card income-card">
              <h5>Income (This Month)</h5>
              <h3>{formatRupiah(currentMonth.income)}</h3>
            </Card>
          </motion.div>
        </Col>
        <Col md={6}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Card className="glass-card expense-card">
              <h5>Expense (This Month)</h5>
              <h3>{formatRupiah(currentMonth.expense)}</h3>
            </Card>
          </motion.div>
        </Col>
      </Row>

      {/* 🔹 Chart */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <Card className="glass-card chart-card">
          <h5>Last 3 Months Summary</h5>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={summary}
              margin={{ top: 20, right: 30, left: 50, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(val) => formatRupiah(val)} />
              <Tooltip formatter={(value) => formatRupiah(value)} />
              <Legend />
              <Bar dataKey="income" fill="#a8e6cf" name="Income" />
              <Bar dataKey="expense" fill="#ffb6b9" name="Expense" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      {/* 🔹 Smart Insight */}
     {/* 🔹 Smart Insight */}
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2 }}
    >
    <SmartInsight categories={categories} />
    </motion.div>

    </div>
  );
}
