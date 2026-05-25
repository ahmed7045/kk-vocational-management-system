import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  History,
  CreditCard,
  Wallet,
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
import ActionButtons from "../components/common/ActionButtons";
import ConfirmDeleteModal from "../components/common/ConfirmDeleteModal";
import DateRangePicker from "../components/common/DateRangePicker";
import {
  formatCurrency,
  formatDate,
  getSelectedBranchId,
  getSelectedBranchName,
} from "../utils/formatters";

import "./payments.css";

const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true";

const Payments = () => {
  const branchId = getSelectedBranchId();
  const branchName = getSelectedBranchName();

  const [payments, setPayments] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  const [studentHistory, setStudentHistory] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    paymentMethodId: "",
    fromDate: "",
    toDate: "",
  });

  const [form, setForm] = useState({
    studentId: "",
    amount: "",
    paymentMethodId: "",
    paymentDate: "",
    referenceNo: "",
    note: "",
  });

  const applyClientFilters = (records, currentFilters = filters) => {
    let filtered = [...records];

    if (currentFilters.search.trim()) {
      const searchText = currentFilters.search.toLowerCase().trim();

      filtered = filtered.filter((payment) =>
        [
          payment.student_name,
          payment.branch_name,
          payment.payment_method,
          payment.reference_no,
          payment.note,
          payment.created_by_name,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(searchText))
      );
    }

    if (currentFilters.paymentMethodId) {
      const selectedMethod = paymentMethods.find(
        (method) => Number(method.id) === Number(currentFilters.paymentMethodId)
      );

      filtered = filtered.filter((payment) => {
        if (payment.payment_method_id) {
          return (
            Number(payment.payment_method_id) ===
            Number(currentFilters.paymentMethodId)
          );
        }

        return (
          selectedMethod?.method_name &&
          payment.payment_method === selectedMethod.method_name
        );
      });
    }

    setPayments(filtered);
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (branchId) params.append("branchId", branchId);
      if (filters.fromDate) params.append("fromDate", filters.fromDate);
      if (filters.toDate) params.append("toDate", filters.toDate);

      params.append("page", "1");
      params.append("limit", "100");

      const response = await axiosInstance.get(`/payments?${params.toString()}`);
      const data = response.data.data || [];

      setAllPayments(data);
      applyClientFilters(data);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to fetch payments");
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [studentsRes, methodsRes] = await Promise.all([
        axiosInstance.get(`/students?branchId=${branchId || ""}&page=1&limit=200`),
        axiosInstance.get("/payments/methods"),
      ]);

      setStudents(studentsRes.data.data || []);
      setPaymentMethods(methodsRes.data.data || []);
    } catch (error) {
      console.error("Dropdown fetch error:", error.response?.data?.message);
    }
  };

  useEffect(() => {
    fetchDropdownData();
  }, [branchId]);

  useEffect(() => {
    fetchPayments();
  }, [branchId, filters.fromDate, filters.toDate]);

  useEffect(() => {
    applyClientFilters(allPayments);
  }, [filters.search, filters.paymentMethodId, paymentMethods]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // const clearFilters = () => {
  //   setFilters({
  //     search: "",
  //     paymentMethodId: "",
  //     fromDate: "",
  //     toDate: "",
  //   });
  // };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm({
      studentId: "",
      amount: "",
      paymentMethodId: "",
      paymentDate: "",
      referenceNo: "",
      note: "",
    });
  };

  const handleCreatePayment = async (event) => {
    event.preventDefault();

    if (!form.studentId) {
      alert("Please select a student.");
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      alert("Payment amount must be greater than zero.");
      return;
    }

    const selectedStudentForPayment = students.find(
      (student) => Number(student.id) === Number(form.studentId)
    );

    const selectedMethod = paymentMethods.find(
      (method) => Number(method.id) === Number(form.paymentMethodId)
    );

    try {
      setSaving(true);

      const payload = {
        studentId: Number(form.studentId),
        amount: Number(form.amount),
        paymentMethodId: form.paymentMethodId
          ? Number(form.paymentMethodId)
          : null,
        paymentDate: form.paymentDate || null,
        referenceNo: form.referenceNo || null,
        note: form.note || null,
      };

      if (!isDemoMode) {
        await axiosInstance.post("/payments", payload);
        await fetchPayments();
        await fetchDropdownData();
      } else {
        const newPayment = {
          id: Date.now(),
          student_id: payload.studentId,
          payment_method_id: payload.paymentMethodId,
          student_name: selectedStudentForPayment?.full_name || "Demo Student",
          branch_name: branchName || "Demo Branch",
          amount: payload.amount,
          payment_method: selectedMethod?.method_name || "Cash",
          payment_date: payload.paymentDate || new Date().toISOString(),
          reference_no: payload.referenceNo,
          note: payload.note,
          created_by_name: "Admin User",
        };

        setAllPayments((prev) => {
          const updated = [newPayment, ...prev];
          applyClientFilters(updated);
          return updated;
        });
      }

      setPaymentModalOpen(false);
      resetForm();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to add payment");
    } finally {
      setSaving(false);
    }
  };

  const openStudentHistory = async (studentId) => {
    if (!studentId) return;

    try {
      setHistoryLoading(true);
      setHistoryModalOpen(true);

      if (isDemoMode) {
        const student = students.find(
          (item) => Number(item.id) === Number(studentId)
        );

        const studentPayments = allPayments.filter(
          (payment) => Number(payment.student_id) === Number(studentId)
        );

        setStudentHistory({
          student: student || {
            full_name: "Demo Student",
            total_fee: 0,
            paid_fee: 0,
            remaining_fee: 0,
          },
          payments: studentPayments,
        });

        return;
      }

      const response = await axiosInstance.get(`/payments/student/${studentId}`);
      setStudentHistory(response.data.data);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to fetch payment history");
      setHistoryModalOpen(false);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setViewModalOpen(true);
  };

  const handleDeleteClick = (payment) => {
    setSelectedPayment(payment);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedPayment?.id) return;

    try {
      setDeleting(true);

      if (!isDemoMode) {
        await axiosInstance.delete(`/payments/${selectedPayment.id}`);
      }

      const updatedPayments = allPayments.filter(
        (payment) => payment.id !== selectedPayment.id
      );

      setAllPayments(updatedPayments);
      applyClientFilters(updatedPayments);

      setDeleteModalOpen(false);
      setSelectedPayment(null);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete payment");
    } finally {
      setDeleting(false);
    }
  };

  const selectedStudent = students.find(
    (student) => Number(student.id) === Number(form.studentId)
  );

  const totalPaid = payments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0
  );

  const columns = [
    {
      key: "student_name",
      title: "Student",
      render: (row) => (
        <div>
          <strong>{row.student_name || "-"}</strong>
          <span className="table-subtext">{row.branch_name || "-"}</span>
        </div>
      ),
    },
    {
      key: "amount",
      title: "Amount",
      render: (row) => <strong>{formatCurrency(row.amount)}</strong>,
    },
    {
      key: "payment_method",
      title: "Method",
      render: (row) => (
        <Badge type="info">{row.payment_method || "Unknown"}</Badge>
      ),
    },
    {
      key: "payment_date",
      title: "Date",
      render: (row) => formatDate(row.payment_date),
    },
    {
      key: "reference_no",
      title: "Reference",
      render: (row) => row.reference_no || "-",
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
        <div className="payment-actions">
          <ActionButtons
            onView={() => handleViewPayment(row)}
            onEdit={null}
            onDelete={() => handleDeleteClick(row)}
            canView={true}
            canEdit={false}
            canDelete={true}
          />

          <Button
            size="sm"
            variant="secondary"
            onClick={() => openStudentHistory(row.student_id)}
          >
            <History size={14} /> History
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="page">
        <Loader text="Loading payments..." />
      </div>
    );
  }

  return (
    <div className="page payments-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments & Fees</h1>
          <p className="page-subtitle">
            Manage student fee payments for {branchName || "selected branch"}.
          </p>
        </div>

        <Button onClick={() => setPaymentModalOpen(true)}>
          <Plus size={16} /> Add Payment
        </Button>
      </div>

      <div className="payments-summary-grid">
        <Card>
          <div className="payment-summary-card">
            <div className="payment-summary-icon">
              <CreditCard size={24} />
            </div>

            <div>
              <p>Total Payment Records</p>
              <h2>{payments.length}</h2>
            </div>
          </div>
        </Card>

        <Card>
          <div className="payment-summary-card">
            <div className="payment-summary-icon">
              <Wallet size={24} />
            </div>

            <div>
              <p>Total Amount Listed</p>
              <h2>{formatCurrency(totalPaid)}</h2>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="payments-toolbar">
          <div className="payments-search">
            <Search size={17} />
            <input
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search student, method, reference..."
            />
          </div>

          <Select
            name="paymentMethodId"
            value={filters.paymentMethodId}
            onChange={handleFilterChange}
            placeholder="Payment method"
            options={[
              { label: "All Methods", value: "" },
              ...paymentMethods.map((method) => ({
                label: method.method_name,
                value: method.id,
              })),
            ]}
          />

          {/* <Input
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
          /> */}

          <DateRangePicker
            fromDate={filters.fromDate}
            toDate={filters.toDate}
            onChange={({ fromDate, toDate }) => {
              setFilters((prev) => ({
                ...prev,
                fromDate,
                toDate,
              }));
            }}
          />
          {/* <Button variant="secondary" onClick={clearFilters}>
            Clear Filters
          </Button> */}

          {/* <Button variant="secondary" onClick={fetchPayments}>
            <RefreshCcw size={16} /> Refresh
          </Button> */}
        </div>

        {error && <div className="payments-error">{error}</div>}

        <Table
          columns={columns}
          data={payments}
          emptyText="No payments found"
        />
      </Card>

      <Modal
        open={paymentModalOpen}
        title="Add Student Payment"
        onClose={() => {
          setPaymentModalOpen(false);
          resetForm();
        }}
        size="lg"
      >
        <form onSubmit={handleCreatePayment}>
          <div className="payment-form-grid">
            <Select
              label="Student"
              name="studentId"
              value={form.studentId}
              onChange={handleFormChange}
              required
              placeholder="Select student"
              options={students.map((student) => ({
                label: `${student.full_name} - Remaining ${formatCurrency(
                  student.remaining_fee
                )}`,
                value: student.id,
              }))}
            />

            <Select
              label="Payment Method"
              name="paymentMethodId"
              value={form.paymentMethodId}
              onChange={handleFormChange}
              placeholder="Select method"
              options={paymentMethods.map((method) => ({
                label: method.method_name,
                value: method.id,
              }))}
            />

            <Input
              label="Amount"
              name="amount"
              type="number"
              value={form.amount}
              onChange={handleFormChange}
              placeholder="e.g. 5000"
              required
            />

            <Input
              label="Payment Date"
              name="paymentDate"
              type="date"
              value={form.paymentDate}
              onChange={handleFormChange}
            />

            <Input
              label="Reference No"
              name="referenceNo"
              value={form.referenceNo}
              onChange={handleFormChange}
              placeholder="e.g. RCPT-001"
            />

            <Input
              label="Note"
              name="note"
              value={form.note}
              onChange={handleFormChange}
              placeholder="Optional note"
            />
          </div>

          {selectedStudent && (
            <div className="student-fee-preview">
              <div>
                <span>Total Fee</span>
                <strong>{formatCurrency(selectedStudent.total_fee)}</strong>
              </div>

              <div>
                <span>Paid Fee</span>
                <strong>{formatCurrency(selectedStudent.paid_fee)}</strong>
              </div>

              <div>
                <span>Remaining</span>
                <strong>{formatCurrency(selectedStudent.remaining_fee)}</strong>
              </div>

              <div>
                <span>Status</span>
                <Badge
                  type={
                    selectedStudent.fee_status === "paid"
                      ? "success"
                      : selectedStudent.fee_status === "partial"
                        ? "warning"
                        : "danger"
                  }
                >
                  {selectedStudent.fee_status}
                </Badge>
              </div>
            </div>
          )}

          <div className="modal-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setPaymentModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>

            <Button type="submit" loading={saving}>
              Save Payment
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={viewModalOpen}
        title="Payment Details"
        onClose={() => {
          setViewModalOpen(false);
          setSelectedPayment(null);
        }}
        size="md"
      >
        {selectedPayment && (
          <div className="payment-detail-grid">
            <div>
              <strong>Student:</strong>
              <p>{selectedPayment.student_name || "-"}</p>
            </div>

            <div>
              <strong>Branch:</strong>
              <p>{selectedPayment.branch_name || "-"}</p>
            </div>

            <div>
              <strong>Amount:</strong>
              <p>{formatCurrency(selectedPayment.amount || 0)}</p>
            </div>

            <div>
              <strong>Method:</strong>
              <p>{selectedPayment.payment_method || "-"}</p>
            </div>

            <div>
              <strong>Date:</strong>
              <p>{formatDate(selectedPayment.payment_date)}</p>
            </div>

            <div>
              <strong>Reference:</strong>
              <p>{selectedPayment.reference_no || "-"}</p>
            </div>

            <div>
              <strong>Created By:</strong>
              <p>{selectedPayment.created_by_name || "-"}</p>
            </div>

            <div>
              <strong>Note:</strong>
              <p>{selectedPayment.note || "-"}</p>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={historyModalOpen}
        title="Student Payment History"
        onClose={() => {
          setHistoryModalOpen(false);
          setStudentHistory(null);
        }}
        size="lg"
      >
        {historyLoading ? (
          <Loader text="Loading payment history..." />
        ) : (
          <>
            {studentHistory?.student && (
              <div className="history-summary">
                <div>
                  <span>Student</span>
                  <strong>{studentHistory.student.full_name}</strong>
                </div>

                <div>
                  <span>Total Fee</span>
                  <strong>{formatCurrency(studentHistory.student.total_fee)}</strong>
                </div>

                <div>
                  <span>Paid</span>
                  <strong>{formatCurrency(studentHistory.student.paid_fee)}</strong>
                </div>

                <div>
                  <span>Remaining</span>
                  <strong>{formatCurrency(studentHistory.student.remaining_fee)}</strong>
                </div>
              </div>
            )}

            <Table
              columns={[
                {
                  key: "amount",
                  title: "Amount",
                  render: (row) => formatCurrency(row.amount),
                },
                {
                  key: "payment_method",
                  title: "Method",
                  render: (row) => row.payment_method || "-",
                },
                {
                  key: "payment_date",
                  title: "Date",
                  render: (row) => formatDate(row.payment_date),
                },
                {
                  key: "reference_no",
                  title: "Reference",
                  render: (row) => row.reference_no || "-",
                },
                {
                  key: "note",
                  title: "Note",
                  render: (row) => row.note || "-",
                },
              ]}
              data={studentHistory?.payments || []}
              emptyText="No payment history found"
            />
          </>
        )}
      </Modal>

      <ConfirmDeleteModal
        open={deleteModalOpen}
        title="Delete Payment"
        message={`Are you sure you want to delete this payment of ${formatCurrency(
          selectedPayment?.amount || 0
        )}?`}
        loading={deleting}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default Payments;