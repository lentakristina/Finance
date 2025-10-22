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
  const [insight, setInsight] = useState(null);
  const [loadingInsight, setLoadingInsight] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [summaryRes, currentRes, insightRes] = await Promise.all([
          api.get("/transactions/summary"),
          api.get("/transactions/summary-current"),
          api.get("/transactions/insight"),
        ]);

        setSummary(summaryRes.data.slice(-3));
        setCurrentMonth(currentRes.data);

        // Process insight from backend
        const { 
          growth, 
          current_total, 
          last_total,
          top_category_this_month,
          top_category_last_month 
        } = insightRes.data;

        const categoryEmoji = (name) => {
          if (!name) return "💸";
          const n = name.toLowerCase();
          if (n.includes("food") || n.includes("makan")) return "🍔";
          if (n.includes("transport") || n.includes("tiket")) return "🚗";
          if (n.includes("entertain") || n.includes("hiburan")) return "🎬";
          if (n.includes("shopping") || n.includes("belanja")) return "🛍️";
          if (n.includes("health") || n.includes("kesehatan")) return "💊";
          if (n.includes("saving") || n.includes("tabung")) return "💰";
          return "💸";
        };

        let msg = "";
        
        if (current_total === 0 && last_total === 0) {
          msg = `✅ Great! No expenses recorded for both months. Keep saving! 🎉`;
        } else if (current_total === 0) {
          const lastCat = top_category_last_month.name;
          const lastAmt = top_category_last_month.amount;
          msg = `✅ Excellent! No expenses this month. Last month spent <b>${formatCurrency(
            last_total
          )}</b>, mostly on <b>${lastCat}</b> ${categoryEmoji(lastCat)} (<b>${formatCurrency(lastAmt)}</b>). 🎊`;
        } else if (last_total === 0) {
          const thisCat = top_category_this_month.name;
          const thisAmt = top_category_this_month.amount;
          msg = `⚠️ This month spent <b>${formatCurrency(
            current_total
          )}</b> (last month: <b>Rp 0</b>), mostly on <b>${thisCat}</b> ${categoryEmoji(thisCat)} (<b>${formatCurrency(thisAmt)}</b>).`;
        } else {
          const thisCat = top_category_this_month.name;
          const thisAmt = top_category_this_month.amount;
          const lastCat = top_category_last_month.name;
          const lastAmt = top_category_last_month.amount;

          if (growth < 0) {
            msg = `✅ Expenses decreased by <b>${Math.abs(growth).toFixed(1)}%</b> (<b>${formatCurrency(
              current_total
            )}</b> vs <b>${formatCurrency(
              last_total
            )}</b>). This month: <b>${thisCat}</b> ${categoryEmoji(thisCat)} (<b>${formatCurrency(thisAmt)}</b>). Last month: <b>${lastCat}</b> ${categoryEmoji(lastCat)} (<b>${formatCurrency(lastAmt)}</b>).`;
          } else if (growth === 0) {
            msg = `📊 Expenses stayed at <b>${formatCurrency(
              current_total
            )}</b>. This month: <b>${thisCat}</b> ${categoryEmoji(thisCat)} (<b>${formatCurrency(thisAmt)}</b>). Last month: <b>${lastCat}</b> ${categoryEmoji(lastCat)} (<b>${formatCurrency(lastAmt)}</b>).`;
          } else {
            msg = `⚠️ Expenses increased by <b>${growth.toFixed(1)}%</b> (<b>${formatCurrency(
              current_total
            )}</b> vs <b>${formatCurrency(
              last_total
            )}</b>). This month: <b>${thisCat}</b> ${categoryEmoji(thisCat)} (<b>${formatCurrency(thisAmt)}</b>). Last month: <b>${lastCat}</b> ${categoryEmoji(lastCat)} (<b>${formatCurrency(lastAmt)}</b>).`;
          }
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
              {loadingInsight ? (
                <Skeleton height={40} width={120} className="mx-auto mt-2" />
              ) : (
                <h2 className="fw-bold text-success">
                  {formatCurrency(currentMonth.income)}
                </h2>
              )}
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
              {loadingInsight ? (
                <Skeleton height={40} width={120} className="mx-auto mt-2" />
              ) : (
                <h2 className="fw-bold text-danger">
                  {formatCurrency(currentMonth.expense)}
                </h2>
              )}
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
          {loadingInsight ? (
            <Skeleton height={300} />
          ) : (
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
                <Bar
                  dataKey="income"
                  fill="#81c784"
                  name="Income"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="expense"
                  fill="#e57373"
                  name="Expense"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="saving"
                  fill="#64b5f6"
                  name="Saving"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
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