import { useEffect, useState } from "react";
import api from "../api/axios";
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
import { motion } from "framer-motion";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { formatCurrency } from "../utils/format";
import "./Dashboard.css";

export default function Dashboard() {
  const [summary, setSummary] = useState([]);
  const [currentMonth, setCurrentMonth] = useState({ income: 0, expense: 0 });
  const [categories, setCategories] = useState([]);
  const [insight, setInsight] = useState(null);
  const [loadingInsight, setLoadingInsight] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [summaryRes, currentRes, categoriesRes, transactionsRes] =
          await Promise.all([
            api.get("/transactions/summary"),
            api.get("/transactions/summary-current"),
            api.get("/categories"),
            api.get("/transactions"),
          ]);

        setSummary(summaryRes.data.slice(-3));
        setCurrentMonth(currentRes.data);
        setCategories(categoriesRes.data);

        const transactions = transactionsRes.data;

        // --- Smart Insight ---
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
        const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

        const isIncome = (tx) => {
          const name = tx.category?.name?.toLowerCase() || "";
          return (
            name.includes("salary") ||
            name.includes("income") ||
            name.includes("gaji") ||
            name.includes("pendapatan")
          );
        };

        const thisMonthExpenses = transactions.filter((tx) => {
          const d = new Date(tx.date);
          return (
            d.getMonth() === thisMonth &&
            d.getFullYear() === thisYear &&
            !isIncome(tx)
          );
        });

        const lastMonthExpenses = transactions.filter((tx) => {
          const d = new Date(tx.date);
          return (
            d.getMonth() === lastMonth &&
            d.getFullYear() === lastMonthYear &&
            !isIncome(tx)
          );
        });

        if (!thisMonthExpenses.length) {
          setInsight("No expenses recorded this month.");
          return;
        }

        const thisTotal = thisMonthExpenses.reduce(
          (a, tx) => a + parseFloat(tx.amount),
          0
        );
        const lastTotal = lastMonthExpenses.reduce(
          (a, tx) => a + parseFloat(tx.amount),
          0
        );

        const categoryTotals = {};
        thisMonthExpenses.forEach((tx) => {
          const cat = tx.category?.name || "Unknown";
          categoryTotals[cat] =
            (categoryTotals[cat] || 0) + parseFloat(tx.amount);
        });

        let topCategory = "Unknown";
        let topAmount = 0;
        for (const [cat, amt] of Object.entries(categoryTotals)) {
          if (amt > topAmount) {
            topAmount = amt;
            topCategory = cat;
          }
        }

        const formatPercent = (value) =>
          value == null || isNaN(value)
            ? "0%"
            : parseFloat(value).toFixed(1) + "%";

        const categoryEmoji = (name) => {
          const n = name.toLowerCase();
          if (n.includes("food") || n.includes("makan")) return "🍔";
          if (n.includes("transport") || n.includes("tiket")) return "🚗";
          if (n.includes("entertain") || n.includes("hiburan")) return "🎬";
          if (n.includes("shopping") || n.includes("belanja")) return "🛍️";
          if (n.includes("health") || n.includes("kesehatan")) return "💊";
          return "💸";
        };

        let msg = "";
        if (thisTotal < lastTotal) {
          msg = `✅ This month’s expenses are smaller than last month (<b>${formatCurrency(
            thisTotal
          )}</b> vs <b>${formatCurrency(
            lastTotal
          )}</b>). Biggest spend in <b>${topCategory}</b> ${categoryEmoji(
            topCategory
          )}.`;
        } else {
          const growth = lastTotal
            ? ((thisTotal - lastTotal) / lastTotal) * 100
            : 100;
          msg = `⚠️ This month’s expenses increased by <b>${formatPercent(
            growth
          )}</b> (<b>${formatCurrency(
            thisTotal
          )}</b> vs <b>${formatCurrency(
            lastTotal
          )}</b>), mainly in <b>${topCategory}</b> ${categoryEmoji(
            topCategory
          )}.`;
        }

        setInsight(msg);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setInsight("Failed to load Smart Insight.");
      } finally {
        setLoadingInsight(false);
      }
    };

    fetchAll();
  }, []);

  return (
    <div className="dashboard-container">
      {/* --- Monthly Income & Expense --- */}
      <Row className="mb-4">
        <Col md={6}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="glass-card income-card text-center">
              <h5 className="glass-title">💰 Income (This Month)</h5>
              <h2 className="fw-bold text-success">
                {formatCurrency(currentMonth.income)}
              </h2>
            </Card>
          </motion.div>
        </Col>
        <Col md={6}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Card className="glass-card expense-card text-center">
              <h5 className="glass-title">💳 Expense (This Month)</h5>
              <h2 className="fw-bold text-danger">
                {formatCurrency(currentMonth.expense)}
              </h2>
            </Card>
          </motion.div>
        </Col>
      </Row>

      {/* --- Last 3 Months Chart --- */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <Card className="glass-card chart-card p-3">
          <h5 className="glass-title mb-3">📊 Last 3 Months Summary</h5>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={summary}
              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(val) => formatCurrency(val)} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="income" fill="#81c784" name="Income" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expense" fill="#e57373" name="Expense" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      {/* --- Smart Insight --- */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2 }}
      >
        <Card className="glass-card p-4 mt-4">
          <div className="d-flex align-items-center mb-3">
            <span className="fs-3 me-2">🤖</span>
            <h4 className="glass-title m-0">Smart Insight</h4>
          </div>
          {loadingInsight ? (
            <Skeleton count={2} />
          ) : (
            <p
              className="text-muted"
              dangerouslySetInnerHTML={{ __html: insight }}
            />
          )}
        </Card>
      </motion.div>
    </div>
  );
}
