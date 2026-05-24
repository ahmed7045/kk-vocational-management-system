import { useEffect, useState } from "react";
import {
  Plus,
  RefreshCcw,
  Search,
  Receipt,
  WalletCards,
} from "lucide-react";

import axiosInstance from "../api/axiosInstance";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Table from "../components/common/Table";
import Modal from "../components/common/Modal";
import Loader from "../components/common/Loader";
import ActionButtons from "../components/common/ActionButtons";
import ConfirmDeleteModal from "../components/common/ConfirmDeleteModal";

import {
  formatCurrency,
  formatDate,
  getSelectedBranchId,
  getSelectedBranchName,
} from "../utils/formatters";

import "./expenses.css";

const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true";

const getCurrentPortalType = () => {
  const selectedPortal = localStorage.getItem("selectedPortal");

  if (selectedPortal === "welfare") return "welfare";
  if (selectedPortal === "vocational") return "vocational";

  const path = window.location.pathname.toLowerCase();

  if (path.includes("welfare")) return "welfare";

  return "vocational";
};

const Expenses = () => {
  const branchId =
    getSelectedBranchId() ||
    localStorage.getItem("selectedBranchId") ||
    "1";

  const branchName =
    getSelectedBranchName() ||
    localStorage.getItem("selectedBranchName") ||
    "Branch 1";

  const portalType = getCurrentPortalType();

  const [expenses, setExpenses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [selectedExpense, setSelectedExpense] = useState(null);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    fromDate: "",
    toDate: "",
  });

  const [form, setForm] = useState({
    name: "",
    amount: "",
    date: "",
    note: "",
  });

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (branchId) params.append("branchId", branchId);

      params.append("portalType", portalType);

      if (filters.search.trim()) {
        params.append("search", filters.search.trim());
      }

      if (filters.fromDate) {
        params.append("fromDate", filters.fromDate);
      }

      if (filters.toDate) {
        params.append("toDate", filters.toDate);
      }

      params.append("page", "1");
      params.append("limit", "100");

      const response = await axiosInstance.get(`/expenses?${params.toString()}`);
      setExpenses(response.data.data || []);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to fetch expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [
    branchId,
    portalType,
    filters.search,
    filters.fromDate,
    filters.toDate,
  ]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      fromDate: "",
      toDate: "",
    });
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm({
      name: "",
      amount: "",
      date: "",
      note: "",
    });
  };

  const openAddModal = () => {
    setSelectedExpense(null);
    resetForm();
    setModalOpen(true);
  };

  const saveExpense = async (event) => {
    event.preventDefault();

    if (!branchId) {
      alert("Please select a branch first.");
      return;
    }

    if (!form.name.trim()) {
      alert("Expense name is required.");
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      alert("Expense amount must be greater than zero.");
      return;
    }

    const payload = {
      branchId: Number(branchId),
      portalType,
      name: form.name.trim(),
      amount: Number(form.amount),
      date: form.date || null,
      note: form.note || null,
    };

    try {
      setSaving(true);

      if (selectedExpense?.id) {
        if (!isDemoMode) {
          await axiosInstance.put(`/expenses/${selectedExpense.id}`, payload);
          await fetchExpenses();
        } else {
          setExpenses((prev) =>
            prev.map((expense) =>
              expense.id === selectedExpense.id
                ? {
                    ...expense,
                    title: payload.name,
                    name: payload.name,
                    amount: payload.amount,
                    expense_date: payload.date || new Date().toISOString(),
                    date: payload.date || new Date().toISOString(),
                    description: payload.note,
                    note: payload.note,
                    expense_type: payload.portalType,
                    portal_type: payload.portalType,
                  }
                : expense
            )
          );
        }
      } else {
        if (!isDemoMode) {
          await axiosInstance.post("/expenses", payload);
          await fetchExpenses();
        } else {
          setExpenses((prev) => [
            {
              id: Date.now(),
              branch_id: branchId,
              branch_name: branchName || "Demo Branch",
              title: payload.name,
              name: payload.name,
              amount: payload.amount,
              expense_date: payload.date || new Date().toISOString(),
              date: payload.date || new Date().toISOString(),
              description: payload.note,
              note: payload.note,
              expense_type: payload.portalType,
              portal_type: payload.portalType,
              created_by_name: "Admin User",
            },
            ...prev,
          ]);
        }
      }

      setModalOpen(false);
      setSelectedExpense(null);
      resetForm();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save expense");
    } finally {
      setSaving(false);
    }
  };

  const handleViewExpense = async (expense) => {
    try {
      setError("");

      if (isDemoMode) {
        setSelectedExpense(expense);
        setViewModalOpen(true);
        return;
      }

      const response = await axiosInstance.get(`/expenses/${expense.id}`);
      setSelectedExpense(response.data.data);
      setViewModalOpen(true);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to fetch expense details");
    }
  };

  const handleEditExpense = async (expense) => {
    try {
      setError("");

      let expenseData = expense;

      if (!isDemoMode) {
        const response = await axiosInstance.get(`/expenses/${expense.id}`);
        expenseData = response.data.data;
      }

      setSelectedExpense(expenseData);

      setForm({
        name: expenseData.name || expenseData.title || "",
        amount: expenseData.amount || "",
        date:
          expenseData.date?.split("T")[0] ||
          expenseData.expense_date?.split("T")[0] ||
          "",
        note: expenseData.note || expenseData.description || "",
      });

      setModalOpen(true);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load expense for edit");
    }
  };

  const handleDeleteClick = (expense) => {
    setSelectedExpense(expense);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedExpense?.id) return;

    try {
      setDeleting(true);

      if (!isDemoMode) {
        await axiosInstance.delete(`/expenses/${selectedExpense.id}`);
      }

      setExpenses((prev) =>
        prev.filter((expense) => expense.id !== selectedExpense.id)
      );

      setDeleteModalOpen(false);
      setSelectedExpense(null);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete expense");
    } finally {
      setDeleting(false);
    }
  };

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0
  );

  const columns = [
    {
      key: "name",
      title: "Expense",
      render: (row) => (
        <div>
          <strong>{row.name || row.title}</strong>
          <span className="table-subtext">
            {row.note || row.description || "-"}
          </span>
        </div>
      ),
    },
    {
      key: "amount",
      title: "Amount",
      render: (row) => <strong>{formatCurrency(row.amount)}</strong>,
    },
    {
      key: "expense_date",
      title: "Date",
      render: (row) => formatDate(row.date || row.expense_date),
    },
    {
      key: "created_by_name",
      title: "Created By",
      render: (row) => row.created_by_name || "-",
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <ActionButtons
          onView={() => handleViewExpense(row)}
          onEdit={() => handleEditExpense(row)}
          onDelete={() => handleDeleteClick(row)}
        />
      ),
    },
  ];

  if (loading) {
    return (
      <div className="page">
        <Loader text="Loading expenses..." />
      </div>
    );
  }

  return (
    <div className="page expenses-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {portalType === "welfare" ? "Welfare Expenses" : "Vocational Expenses"}
          </h1>
          <p className="page-subtitle">
            Manage {portalType} expenses for {branchName || "selected branch"}.
          </p>
        </div>

        <Button onClick={openAddModal}>
          <Plus size={16} /> Add Expense
        </Button>
      </div>

      <div className="expenses-summary-grid">
        <Card>
          <div className="expense-summary-card">
            <div className="expense-summary-icon">
              <Receipt size={24} />
            </div>

            <div>
              <p>Total Expense Records</p>
              <h2>{expenses.length}</h2>
            </div>
          </div>
        </Card>

        <Card>
          <div className="expense-summary-card">
            <div className="expense-summary-icon danger">
              <WalletCards size={24} />
            </div>

            <div>
              <p>Total Expense Amount</p>
              <h2>{formatCurrency(totalExpenses)}</h2>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="expenses-toolbar simple">
          <div className="expenses-search">
            <Search size={17} />
            <input
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search expense name or note..."
            />
          </div>

          <Input
            name="fromDate"
            type="date"
            value={filters.fromDate}
            onChange={handleFilterChange}
          />

          <Input
            name="toDate"
            type="date"
            value={filters.toDate}
            onChange={handleFilterChange}
          />

          <Button variant="secondary" onClick={clearFilters}>
            Clear Filters
          </Button>

          <Button variant="secondary" onClick={fetchExpenses}>
            <RefreshCcw size={16} /> Refresh
          </Button>
        </div>

        {error && <div className="expenses-error">{error}</div>}

        <Table
          columns={columns}
          data={expenses}
          emptyText="No expenses found"
        />
      </Card>

      <Modal
        open={modalOpen}
        title={selectedExpense?.id ? "Edit Expense" : "Add Expense"}
        onClose={() => {
          setModalOpen(false);
          setSelectedExpense(null);
          resetForm();
        }}
        size="md"
      >
        <form onSubmit={saveExpense}>
          <Input
            label="Expense Name"
            name="name"
            value={form.name}
            onChange={handleFormChange}
            placeholder="e.g. Electricity Bill"
            required
          />

          <Input
            label="Amount"
            name="amount"
            type="number"
            value={form.amount}
            onChange={handleFormChange}
            placeholder="e.g. 12000"
            required
          />

          <Input
            label="Date"
            name="date"
            type="date"
            value={form.date}
            onChange={handleFormChange}
          />

          <div className="form-group">
            <label>Note Optional</label>
            <textarea
              name="note"
              value={form.note}
              onChange={handleFormChange}
              rows="3"
              placeholder="Write note if needed"
            />
          </div>

          <div className="modal-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setModalOpen(false);
                setSelectedExpense(null);
                resetForm();
              }}
            >
              Cancel
            </Button>

            <Button type="submit" loading={saving}>
              {selectedExpense?.id ? "Update Expense" : "Save Expense"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={viewModalOpen}
        title="Expense Details"
        onClose={() => {
          setViewModalOpen(false);
          setSelectedExpense(null);
        }}
        size="md"
      >
        {selectedExpense && (
          <div className="expense-detail-grid">
            <div>
              <strong>Name:</strong>
              <p>{selectedExpense.name || selectedExpense.title || "-"}</p>
            </div>

            <div>
              <strong>Amount:</strong>
              <p>{formatCurrency(selectedExpense.amount || 0)}</p>
            </div>

            <div>
              <strong>Date:</strong>
              <p>{formatDate(selectedExpense.date || selectedExpense.expense_date)}</p>
            </div>

            <div>
              <strong>Portal:</strong>
              <p>{selectedExpense.portal_type || selectedExpense.expense_type || "-"}</p>
            </div>

            <div>
              <strong>Branch:</strong>
              <p>{selectedExpense.branch_name || branchName || "-"}</p>
            </div>

            <div>
              <strong>Created By:</strong>
              <p>{selectedExpense.created_by_name || "-"}</p>
            </div>

            <div>
              <strong>Note:</strong>
              <p>{selectedExpense.note || selectedExpense.description || "-"}</p>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDeleteModal
        open={deleteModalOpen}
        title="Delete Expense"
        message={`Are you sure you want to delete ${
          selectedExpense?.name || selectedExpense?.title || "this expense"
        }?`}
        loading={deleting}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default Expenses;