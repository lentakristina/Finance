import { useEffect, useState } from "react";
import api from "../Api";
import { motion } from "framer-motion";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { formatRupiah } from "../utils/format";
import "./Dashboard.css";

export default function SmartInsight() {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);

  const formatPercent = (value) => {
    if (value == null || isNaN(value)) return "0%";
    return parseFloat(value).toFixed(1) + "%";
  };

  // emoji mapping by category name
  const categoryEmoji = (name) => {
    const n = name.toLowerCase();
    if (n.includes("food") || n.includes("makan")) return "🍔";
    if (n.includes("transport") || n.includes("tiket")) return "🚗";
    if (n.includes("entertain") || n.includes("hiburan")) return "🎬";
    if (n.includes("shopping") || n.includes("belanja")) return "🛍️";
    if (n.includes("health") || n.includes("kesehatan")) return "💊";
    return "💸";
  };

  useEffect(() => {
    const fetchInsight = async () => {
      try {
        const res = await api.get("/transactions");
        const transactions = res.data;

        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
        const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

        // helper: detect income category by name
        const isIncome = (tx) => {
          const name = tx.category?.name?.toLowerCase() || "";
          return (
            name.includes("salary") ||
            name.includes("income") ||
            name.includes("gaji") ||
            name.includes("pendapatan")
          );
        };

        // expenses only - this month
        const thisMonthExpenses = transactions.filter((tx) => {
          const d = new Date(tx.date);
          return (
            d.getMonth() === thisMonth &&
            d.getFullYear() === thisYear &&
            !isIncome(tx)
          );
        });

        // expenses only - last month
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

        // calculate totals
        const thisTotal = thisMonthExpenses.reduce(
          (a, tx) => a + parseFloat(tx.amount),
          0
        );
        const lastTotal = lastMonthExpenses.reduce(
          (a, tx) => a + parseFloat(tx.amount),
          0
        );

        // calculate top category
        const categoryTotals = {};
        thisMonthExpenses.forEach((tx) => {
          const cat = tx.category?.name || "Unknown";
          if (!categoryTotals[cat]) categoryTotals[cat] = 0;
          categoryTotals[cat] += parseFloat(tx.amount);
        });

        let topCategory = "Unknown";
        let topAmount = 0;
        for (const [cat, amt] of Object.entries(categoryTotals)) {
          if (amt > topAmount) {
            topAmount = amt;
            topCategory = cat;
          }
        }

        let msg = "";

        if (thisTotal < lastTotal) {
          msg = `This month’s expenses are smaller than last month (<b>${formatRupiah(
            thisTotal
          )}</b> vs <b>${formatRupiah(
            lastTotal
          )}</b>). But this month you spent the most in <b>${topCategory}</b> ${categoryEmoji(
            topCategory
          )}.`;
        } else {
          const growth = lastTotal
            ? ((thisTotal - lastTotal) / lastTotal) * 100
            : 100;
          msg = `This month’s expenses increased by <b>${formatPercent(
            growth
          )}</b> compared to last month (<b>${formatRupiah(
            thisTotal
          )}</b> vs <b>${formatRupiah(
            lastTotal
          )}</b>), mostly in <b>${topCategory}</b> ${categoryEmoji(
            topCategory
          )}.`;
        }

        setInsight(msg);
      } catch (err) {
        console.error("Error fetching insight:", err);
        setInsight("Failed to load Smart Insight.");
      } finally {
        setLoading(false);
      }
    };

    fetchInsight();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card p-4"
    >
      <div className="flex items-center mb-3">
        <span className="text-2xl mr-2">🤖</span>
        <h4 className="glass-title m-0">Smart Insight</h4>
      </div>

      {loading ? (
        <Skeleton count={2} />
      ) : (
        <p
          className="text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: insight,
          }}
        />
      )}
    </motion.div>
  );
}
