import { useState, useEffect } from "react";
import { Button, Table, Pagination } from "react-bootstrap";
import api from "../Api";
import TransactionForm from "./TransactionForm";
import { formatRupiah } from "../utils/format";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Dashboard.css";

export default function TransactionsList() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedTx, setSelectedTx] = useState(null);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchTransactions = async () => {
    const res = await api.get("/transactions");
    setTransactions(res.data);
  };

  const fetchCategories = async () => {
    const res = await api.get("/categories");
    // add saving category if not exists
    const allCategories = res.data;
    setCategories(allCategories);
  };

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, []);

  const handleAdd = () => {
    setModalMode("add");
    setSelectedTx(null);
    setShowModal(true);
  };

  const handleEdit = (tx) => {
    setModalMode("edit");
    setSelectedTx(tx);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      await api.delete(`/transactions/${id}`);
      fetchTransactions();
      toast.error("Transaction deleted successfully🗑️", {
      autoClose: 5000,
      style: { backgroundColor: "#ef4444", color: "#fff" }, // merah
    });
    }
  };


  // pagination logic
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = transactions.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(transactions.length / itemsPerPage);

  return (
    <div className="glass-card p-4">
      {/* 🔹 Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="glass-title">📋 Transactions</h3>
        <Button
          style={{
            backgroundColor: "#4f46e5",
            borderColor: "#4f46e5",
            color: "#fff",
            borderRadius: "8px",
            fontWeight: "500",
            padding: "6px 14px",
          }}
          onClick={handleAdd}
        >
          + Add Transaction
        </Button>
      </div>

      {/* 🔹 Table */}
      <div className="table-responsive">
        <Table hover className="align-middle">
          <thead className="table-light">
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Note</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((t) => (
              <tr key={t.id}>
                <td>{t.date}</td>
                <td>
                  <span
                    className="px-2 py-1 rounded"
                    style={{
                      backgroundColor:
                        t.category?.type === "income"
                          ? "rgba(34,197,94,0.1)"
                          : t.category?.type === "save"
                          ? "rgba(59,130,246,0.1)"
                          : "rgba(239,68,68,0.1)",
                      color:
                        t.category?.type === "income"
                          ? "#16a34a"
                          : t.category?.type === "save"
                          ? "#2563eb"
                          : "#dc2626",
                      fontWeight: "500",
                    }}
                  >
                    {t.category?.name}
                  </span>
                </td>
                <td
                  className={
                    t.category?.type === "income"
                      ? "text-success fw-bold"
                      : t.category?.type === "save"
                      ? "text-primary fw-bold"
                      : "text-danger fw-bold"
                  }
                >
                  {formatRupiah(t.amount)}
                </td>
                <td>{t.note}</td>
                <td className="text-center">
                  <Button
                    variant="outline-warning"
                    size="sm"
                    className="me-2"
                    onClick={() => handleEdit(t)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDelete(t.id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* 🔹 Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center">
          <Pagination>
            {[...Array(totalPages)].map((_, i) => (
              <Pagination.Item
                key={i + 1}
                active={i + 1 === currentPage}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </Pagination.Item>
            ))}
          </Pagination>
        </div>
      )}

      {/* 🔹 Modal Add/Edit */}
      <TransactionForm
  show={showModal}
  handleClose={() => setShowModal(false)}
  onSuccess={() => {
    fetchTransactions();

    if (modalMode === "add") {
      // ⬇️ pas Add
      toast.info("Transaction added successfully🎉", {
        autoClose: 5000,
        style: { backgroundColor: "#3b82f6", color: "#fff" }, // biru
      });
    } else {
      // ⬇️ pas Update
      toast.warn("Transaction updated successfully✏️", {
        autoClose: 5000,
        style: { backgroundColor: "#facc15", color: "#000" }, // kuning
      });
    }
  }}
  categories={categories}
  mode={modalMode}
  initialData={selectedTx}
/>
    </div>
  );
}