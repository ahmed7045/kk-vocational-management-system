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
import Select from "../components/common/Select";
import Table from "../components/common/Table";
import Badge from "../components/common/Badge";
import Modal from "../components/common/Modal";
import Loader from "../components/common/Loader";

import {
  formatCurrency,
  formatDate,
  getSelectedBranchId,
  getSelectedBranchName,
} from "../utils/formatters";

import "./expenses.css";

const Expenses = () => {
  const branchId = getSelectedBranchId();
  const branchName = getSelectedBranchName();

  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    categoryId: "",
    fromDate: "",
    toDate: "",
    expenseType: "branch",
  });

  const [form, setForm] = useState({
    categoryId: "",
    title: "",
    amount: "",
    expenseDate: "",
    description: "",
    receiptUrl: "",
    expenseType: "branch",
  });

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (branchId) params.append("branchId", branchId);
      if (filters.search) params.append("search", filters.search);
      if (filters.categoryId) params.append("categoryId", filters.categoryId);
      if (filters.fromDate) params.append("fromDate", filters.fromDate);
      if (filters.toDate) params.append("toDate", filters.toDate);
      if (filters.expenseType) params.append("expenseType", filters.expenseType);

      params.append("page", "1");
      params.append("limit", "50");

      const response = await axiosInstance.get(`/expenses?${params.toString()}`);
      setExpenses(response.data.data || []);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to fetch expenses");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get("/expenses/categories");
      setCategories(response.data.data || []);
    } catch (error) {
      console.error("Expense category fetch error:", error.response?.data?.message);
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, []);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
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
      categoryId: "",
      title: "",
      amount: "",
      expenseDate: "",
      description: "",
      receiptUrl: "",
      expenseType: "branch",
    });
  };

  const createExpense = async (event) => {
    event.preventDefault();

    if (!branchId) {
      alert("Please select a branch first.");
      return;
    }

    if (!form.title.trim()) {
      alert("Expense title is required.");
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      alert("Expense amount must be greater than zero.");
      return;
    }

    try {
      setSaving(true);

      await axiosInstance.post("/expenses", {
        branchId: Number(branchId),
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        title: form.title,
        amount: Number(form.amount),
        expenseDate: form.expenseDate || null,
        description: form.description || null,
        receiptUrl: form.receiptUrl || null,
        expenseType: form.expenseType || "branch",
      });

      setModalOpen(false);
      resetForm();
      fetchExpenses();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create expense");
    } finally {
      setSaving(false);
    }
  };

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0
  );

  const branchExpenses = expenses.filter(
    (expense) => expense.expense_type === "branch"
  ).length;

  const welfareExpenses = expenses.filter(
    (expense) => expense.expense_type === "welfare"
  ).length;

  const columns = [
    {
      key: "title",
      title: "Expense",
      render: (row) => (
        <div>
          <strong>{row.title}</strong>
          <span className="table-subtext">{row.category_name || "Uncategorized"}</span>
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
      render: (row) => formatDate(row.expense_date),
    },
    {
      key: "expense_type",
      title: "Type",
      render: (row) => (
        <Badge type={row.expense_type === "welfare" ? "warning" : "info"}>
          {row.expense_type}
        </Badge>
      ),
    },
    {
      key: "created_by_name",
      title: "Created By",
      render: (row) => row.created_by_name || "-",
    },
    {
      key: "description",
      title: "Description",
      render: (row) => row.description || "-",
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
          <h1 className="page-title">Expenses</h1>
          <p className="page-subtitle">
            Manage branch and welfare expenses for {branchName || "selected branch"}.
          </p>
        </div>

        <Button onClick={() => setModalOpen(true)}>
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

        <Card>
          <div className="expense-mini-stat">
            <p>Branch Expenses</p>
            <h3>{branchExpenses}</h3>
          </div>
        </Card>

        <Card>
          <div className="expense-mini-stat">
            <p>Welfare Expenses</p>
            <h3>{welfareExpenses}</h3>
          </div>
        </Card>
      </div>

      <Card>
        <div className="expenses-toolbar">
          <div className="expenses-search">
            <Search size={17} />
            <input
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search title, category or description..."
            />
          </div>

          <Select
            name="categoryId"
            value={filters.categoryId}
            onChange={handleFilterChange}
            placeholder="All categories"
            options={categories.map((category) => ({
              label: category.category_name,
              value: category.id,
            }))}
          />

          <Select
            name="expenseType"
            value={filters.expenseType}
            onChange={handleFilterChange}
            placeholder="Expense type"
            options={[
              { label: "Branch", value: "branch" },
              { label: "Welfare", value: "welfare" },
            ]}
          />

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

          <Button variant="secondary" onClick={fetchExpenses}>
            <RefreshCcw size={16} /> Apply
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
        title="Add Expense"
        onClose={() => setModalOpen(false)}
        size="lg"
      >
        <form onSubmit={createExpense}>
          <div className="expense-form-grid">
            <Input
              label="Title"
              name="title"
              value={form.title}
              onChange={handleFormChange}
              placeholder="e.g. Electricity Bill May"
              required
            />

            <Select
              label="Category"
              name="categoryId"
              value={form.categoryId}
              onChange={handleFormChange}
              placeholder="Select category"
              options={categories.map((category) => ({
                label: category.category_name,
                value: category.id,
              }))}
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
              label="Expense Date"
              name="expenseDate"
              type="date"
              value={form.expenseDate}
              onChange={handleFormChange}
            />

            <Select
              label="Expense Type"
              name="expenseType"
              value={form.expenseType}
              onChange={handleFormChange}
              options={[
                { label: "Branch", value: "branch" },
                { label: "Welfare", value: "welfare" },
              ]}
            />

            <Input
              label="Receipt URL"
              name="receiptUrl"
              value={form.receiptUrl}
              onChange={handleFormChange}
              placeholder="Optional receipt link"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleFormChange}
              rows="3"
              placeholder="Short expense description"
            />
          </div>

          <div className="modal-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>

            <Button type="submit" loading={saving}>
              Save Expense
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Expenses;