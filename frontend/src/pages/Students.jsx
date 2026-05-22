import { useEffect, useState } from "react";
import { Plus, RefreshCcw, Search } from "lucide-react";

import { useAuth } from "../auth/AuthContext";
import ActionButtons from "../components/common/ActionButtons";
import ConfirmDeleteModal from "../components/common/ConfirmDeleteModal";
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

import "./students.css";

const Students = ({
  defaultStudentStatus = "",
  pageTitle = "Students",
}) => {

  const { hasPermission } = useAuth();
  const branchId = getSelectedBranchId();
  const branchName = getSelectedBranchName();

  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    feeStatus: "",
    studentStatus: defaultStudentStatus,
  });

  const [form, setForm] = useState({
    fullName: "",
    fatherName: "",
    phone: "",
    city: "",
    address: "",
    courseId: "",
    assignedTeacherId: "",
    shiftId: "",
    admissionDate: "",
    admissionStatus: "confirmed",
    totalFee: "",
    paidFee: "",
  });

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (branchId) params.append("branchId", branchId);
      if (filters.search) params.append("search", filters.search);
      if (filters.feeStatus) params.append("feeStatus", filters.feeStatus);
      if (filters.studentStatus) params.append("studentStatus", filters.studentStatus);

      params.append("page", "1");
      params.append("limit", "50");

      const response = await axiosInstance.get(`/students?${params.toString()}`);
      setStudents(response.data.data || []);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [coursesRes, shiftsRes, teachersRes] = await Promise.all([
        axiosInstance.get(`/courses?branchId=${branchId || ""}`),
        axiosInstance.get(`/shifts?branchId=${branchId || ""}`),
        axiosInstance.get(`/employees?branchId=${branchId || ""}`),
      ]);

      setCourses(coursesRes.data.data || []);
      setShifts(shiftsRes.data.data || []);
      setTeachers(teachersRes.data.data || []);
    } catch (error) {
      console.error("Dropdown fetch error:", error.response?.data?.message);
    }
  };

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      studentStatus: defaultStudentStatus,
    }));
  }, [defaultStudentStatus]);

  useEffect(() => {
    fetchStudents();
    fetchDropdownData();
  }, [defaultStudentStatus]);

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
      fullName: "",
      fatherName: "",
      phone: "",
      city: "",
      address: "",
      courseId: "",
      assignedTeacherId: "",
      shiftId: "",
      admissionDate: "",
      admissionStatus: "confirmed",
      totalFee: "",
      paidFee: "",
    });
  };

  const handleCreateStudent = async (event) => {
    event.preventDefault();

    if (!branchId) {
      alert("Please select a branch first.");
      return;
    }

    try {
      setSaving(true);

      await axiosInstance.post("/students", {
        branchId: Number(branchId),
        fullName: form.fullName,
        fatherName: form.fatherName,
        phone: form.phone,
        city: form.city,
        address: form.address,
        courseIds: form.courseId ? [Number(form.courseId)] : [],
        assignedTeacherId: form.assignedTeacherId
          ? Number(form.assignedTeacherId)
          : null,
        shiftId: form.shiftId ? Number(form.shiftId) : null,
        admissionDate: form.admissionDate || null,
        admissionStatus: form.admissionStatus,
        totalFee: Number(form.totalFee || 0),
        paidFee: Number(form.paidFee || 0),
      });

      setModalOpen(false);
      resetForm();
      fetchStudents();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create student");
    } finally {
      setSaving(false);
    }
  };

  const handleView = (row) => {
    setSelectedRecord(row);
    setViewModalOpen(true);
  };

  const handleEdit = (row) => {
    setSelectedRecord(row);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (row) => {
    setSelectedRecord(row);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setDeleting(true);

      await axiosInstance.delete(`/students/${selectedRecord.id}`);

      setDeleteModalOpen(false);
      setSelectedRecord(null);
      fetchStudents();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete student");
    } finally {
      setDeleting(false);
    }
  };

  const getFeeBadgeType = (status) => {
    if (status === "paid") return "success";
    if (status === "partial") return "warning";
    return "danger";
  };

  const getStudentBadgeType = (status) => {
    if (status === "active") return "success";
    if (status === "completed") return "info";
    return "warning";
  };

  const canUseStudentActions =
  hasPermission("students.view") ||
  hasPermission("students.update") ||
  hasPermission("students.delete");

  const columns = [
    {
      key: "full_name",
      title: "Student",
      render: (row) => (
        <div>
          <strong>{row.full_name}</strong>
          <span className="table-subtext">{row.father_name || "-"}</span>
        </div>
      ),
    },
    {
      key: "phone",
      title: "Phone",
      render: (row) => row.phone || "-",
    },
    {
      key: "courses",
      title: "Course",
      render: (row) =>
        row.courses?.length
          ? row.courses.map((course) => course.courseName).join(", ")
          : "-",
    },
    {
      key: "fee_status",
      title: "Fee Status",
      render: (row) => (
        <Badge type={getFeeBadgeType(row.fee_status)}>
          {row.fee_status}
        </Badge>
      ),
    },
    {
      key: "student_status",
      title: "Status",
      render: (row) => (
        <Badge type={getStudentBadgeType(row.student_status)}>
          {row.student_status}
        </Badge>
      ),
    },
    {
      key: "total_fee",
      title: "Total Fee",
      render: (row) => formatCurrency(row.total_fee),
    },
    {
      key: "paid_fee",
      title: "Paid",
      render: (row) => formatCurrency(row.paid_fee),
    },
    {
      key: "remaining_fee",
      title: "Remaining",
      render: (row) => formatCurrency(row.remaining_fee),
    },
    {
      key: "admission_date",
      title: "Admission",
      render: (row) => formatDate(row.admission_date),
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <ActionButtons
          onView={() => handleView(row)}
          onEdit={() => handleEdit(row)}
          onDelete={() => handleDeleteClick(row)}
          canView={hasPermission("students.view")}
          canEdit={hasPermission("students.update")}
          canDelete={hasPermission("students.delete")}
        />
      ),
    },
  ];

  

  if (loading) {
    return (
      <div className="page">
        <Loader text="Loading students..." />
      </div>
    );
  }

  return (
    <div className="page students-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{pageTitle}</h1>
          <p className="page-subtitle">
            {defaultStudentStatus === "non_active"
              ? `View non-active students for ${branchName || "selected branch"}.`
              : `Manage student admissions for ${branchName || "selected branch"}.`}
          </p>
        </div>

        {defaultStudentStatus !== "non_active" &&
          hasPermission("students.create") && (
            <Button onClick={() => setModalOpen(true)}>
              <Plus size={16} /> Add Student
            </Button>
          )}
      </div>

      <Card>
        <div className="students-toolbar">
          <div className="students-search">
            <Search size={17} />
            <input
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search by name, father name or phone..."
            />
          </div>

          <Select
            name="feeStatus"
            value={filters.feeStatus}
            onChange={handleFilterChange}
            placeholder="Fee status"
            options={[
              { label: "Paid", value: "paid" },
              { label: "Pending", value: "pending" },
              { label: "Partial", value: "partial" },
            ]}
          />

          {defaultStudentStatus !== "non_active" && (
            <Select
              name="studentStatus"
              value={filters.studentStatus}
              onChange={handleFilterChange}
              placeholder="Student status"
              options={[
                { label: "Active", value: "active" },
                { label: "Non Active", value: "non_active" },
                { label: "Completed", value: "completed" },
                { label: "Dropped", value: "dropped" },
              ]}
            />
          )}

          <Button variant="secondary" onClick={fetchStudents}>
            <RefreshCcw size={16} /> Apply
          </Button>
        </div>

        {error && <div className="students-error">{error}</div>}

        <Table
          columns={columns}
          data={students}
          emptyText="No students found"
        />
      </Card>

      <Modal
        open={modalOpen}
        title="Add New Student"
        onClose={() => setModalOpen(false)}
        size="lg"
      >
        <form onSubmit={handleCreateStudent}>
          <div className="student-form-grid">
            <Input
              label="Student Full Name"
              name="fullName"
              value={form.fullName}
              onChange={handleFormChange}
              required
            />

            <Input
              label="Father Name"
              name="fatherName"
              value={form.fatherName}
              onChange={handleFormChange}
            />

            <Input
              label="Phone Number"
              name="phone"
              value={form.phone}
              onChange={handleFormChange}
            />

            <Input
              label="City"
              name="city"
              value={form.city}
              onChange={handleFormChange}
            />

            <Select
              label="Course"
              name="courseId"
              value={form.courseId}
              onChange={handleFormChange}
              options={courses.map((course) => ({
                label: course.course_name,
                value: course.id,
              }))}
            />

            <Select
              label="Assign Teacher"
              name="assignedTeacherId"
              value={form.assignedTeacherId}
              onChange={handleFormChange}
              options={teachers.map((teacher) => ({
                label: teacher.full_name,
                value: teacher.id,
              }))}
            />

            <Select
              label="Shift Timing"
              name="shiftId"
              value={form.shiftId}
              onChange={handleFormChange}
              options={shifts.map((shift) => ({
                label: `${shift.shift_name} (${shift.start_time} - ${shift.end_time})`,
                value: shift.id,
              }))}
            />

            <Input
              label="Admission Date"
              name="admissionDate"
              type="date"
              value={form.admissionDate}
              onChange={handleFormChange}
            />

            <Input
              label="Total Fee"
              name="totalFee"
              type="number"
              value={form.totalFee}
              onChange={handleFormChange}
            />

            <Input
              label="Paid Fee"
              name="paidFee"
              type="number"
              value={form.paidFee}
              onChange={handleFormChange}
            />
          </div>

          <div className="form-group">
            <label>Full Address</label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleFormChange}
              placeholder="Enter residential address"
              rows="3"
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
              Save Student
            </Button>
          </div>
        </form>
      </Modal>
      <ConfirmDeleteModal
        open={deleteModalOpen}
        title="Delete Student"
        message={`Are you sure you want to delete ${selectedRecord?.full_name || "this student"
          }?`}
        loading={deleting}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default Students;