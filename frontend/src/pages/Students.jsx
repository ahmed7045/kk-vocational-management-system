import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Search } from "lucide-react";

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

const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true";

const Students = ({
  defaultStudentStatus = "active",
  pageTitle = "Students",
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    feeStatus: searchParams.get("feeStatus") || "",
  });

  const [form, setForm] = useState({
    fullName: "",
    fatherName: "",
    phone: "",
    courseId: "",
    admissionDate: "",
    paidFee: "",
    feeStatus: "paid",
  });

  const resetForm = () => {
    setForm({
      fullName: "",
      fatherName: "",
      phone: "",
      courseId: "",
      admissionDate: "",
      paidFee: "",
      feeStatus: "paid",
    });
  };

  const openAddModal = () => {
    setSelectedRecord(null);
    resetForm();
    setModalOpen(true);
  };

  useEffect(() => {
    const urlFeeStatus = searchParams.get("feeStatus") || "";

    setFilters((prev) => {
      if (prev.feeStatus === urlFeeStatus) return prev;

      return {
        ...prev,
        feeStatus: urlFeeStatus,
      };
    });
  }, [searchParams]);

  useEffect(() => {
    const shouldOpenAddModal = searchParams.get("openAdd") === "true";

    if (
      shouldOpenAddModal &&
      defaultStudentStatus !== "non_active" &&
      hasPermission("students.create")
    ) {
      openAddModal();

      const params = new URLSearchParams(searchParams);
      params.delete("openAdd");
      setSearchParams(params, { replace: true });
    }
  }, [searchParams, defaultStudentStatus, hasPermission, setSearchParams]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (branchId) params.append("branchId", branchId);
      if (filters.search.trim()) params.append("search", filters.search.trim());
      if (filters.feeStatus) params.append("feeStatus", filters.feeStatus);

      params.append("studentStatus", defaultStudentStatus);
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
    fetchDropdownData();
  }, [branchId]);

  useEffect(() => {
    fetchStudents();
  }, [branchId, defaultStudentStatus, filters.search, filters.feeStatus]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "feeStatus") {
      const params = new URLSearchParams(searchParams);

      if (value) {
        params.set("feeStatus", value);
      } else {
        params.delete("feeStatus");
      }

      setSearchParams(params);
    }
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      feeStatus: "",
    });

    setSearchParams({});
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitStudent = async (event) => {
    event.preventDefault();

    if (!branchId) {
      alert("Please select a branch first.");
      return;
    }

    const feeAmount = Number(form.paidFee || 0);
    const payload = {
      branchId: Number(branchId),
      fullName: form.fullName,
      fatherName: form.fatherName,
      phone: form.phone,
      city: "",
      address: "",
      courseIds: form.courseId ? [Number(form.courseId)] : [],
      assignedTeacherId: null,
      shiftId: null,
      admissionDate: form.admissionDate || null,
      admissionStatus: "confirmed",
      studentStatus: "active",

      totalFee: feeAmount,
      paidFee: form.feeStatus === "paid" ? feeAmount : 0,
      remainingFee: form.feeStatus === "paid" ? 0 : feeAmount,
      feeStatus: form.feeStatus,
    };

    try {
      setSaving(true);

      if (selectedRecord?.id) {
        if (!isDemoMode) {
          await axiosInstance.put(`/students/${selectedRecord.id}`, payload);
          await fetchStudents();
        } else {
          setStudents((prev) =>
            prev
              .map((student) =>
                student.id === selectedRecord.id
                  ? {
                    ...student,
                    full_name: payload.fullName,
                    father_name: payload.fatherName,
                    phone: payload.phone,
                    courses: courses
                      .filter((course) => Number(course.id) === Number(form.courseId))
                      .map((course) => ({
                        id: course.id,
                        courseName: course.course_name,
                      })),
                    total_fee: payload.totalFee,
                    paid_fee: payload.paidFee,
                    remaining_fee: payload.remainingFee,
                    fee_status: payload.feeStatus,
                    student_status: "active",
                    admission_status: payload.admissionStatus,
                    admission_date: payload.admissionDate,
                  }
                  : student
              )
              .filter((student) => student.student_status === defaultStudentStatus)
          );
        }
      } else {
        if (!isDemoMode) {
          await axiosInstance.post("/students", payload);
          await fetchStudents();
        } else {
          const newStudent = {
            id: Date.now(),
            full_name: payload.fullName,
            father_name: payload.fatherName,
            phone: payload.phone,
            city: "",
            address: "",
            courses: courses
              .filter((course) => Number(course.id) === Number(form.courseId))
              .map((course) => ({
                id: course.id,
                courseName: course.course_name,
              })),
            total_fee: payload.totalFee,
            paid_fee: payload.paidFee,
            remaining_fee: payload.remainingFee,
            fee_status: payload.feeStatus,
            student_status: "active",
            admission_status: payload.admissionStatus,
            admission_date: payload.admissionDate,
          };

          setStudents((prev) => {
            if (newStudent.student_status !== defaultStudentStatus) {
              return prev;
            }

            return [newStudent, ...prev];
          });
        }
      }

      setModalOpen(false);
      setSelectedRecord(null);
      resetForm();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save student");
    } finally {
      setSaving(false);
    }
  };

  const handleView = async (row) => {
    try {
      setError("");

      if (isDemoMode) {
        setSelectedRecord(row);
        setViewModalOpen(true);
        return;
      }

      const response = await axiosInstance.get(`/students/${row.id}`);
      setSelectedRecord(response.data.data);
      setViewModalOpen(true);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to fetch student details");
    }
  };

  const handleEdit = async (row) => {
    try {
      setError("");

      let student = row;

      if (!isDemoMode) {
        const response = await axiosInstance.get(`/students/${row.id}`);
        student = response.data.data;
      }

      setSelectedRecord(student);

      setForm({
        fullName: student.full_name || "",
        fatherName: student.father_name || "",
        phone: student.phone || "",
        courseId: student.courses?.[0]?.id || "",
        admissionDate: student.admission_date?.split("T")[0] || "",
        paidFee: student.total_fee || student.paid_fee || "",
        feeStatus: student.fee_status || "paid",
      });

      setModalOpen(true);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load student for edit");
    }
  };

  const handleDeleteClick = (row) => {
    setSelectedRecord(row);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedRecord?.id) return;

    try {
      setDeleting(true);

      if (!isDemoMode) {
        await axiosInstance.delete(`/students/${selectedRecord.id}`);
      }

      setStudents((prev) =>
        prev.filter((student) => student.id !== selectedRecord.id)
      );

      setDeleteModalOpen(false);
      setSelectedRecord(null);
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
    if (status === "non_active") return "danger";
    return "warning";
  };

  const displayTitle =
    filters.feeStatus === "paid"
      ? "Paid List"
      : filters.feeStatus === "pending"
        ? "Pending List"
        : pageTitle;

  const displaySubtitle =
    filters.feeStatus === "paid"
      ? `${students.length} records`
      : filters.feeStatus === "pending"
        ? `${students.length} records`
        : defaultStudentStatus === "non_active"
          ? `View non-active students for ${branchName || "selected branch"}.`
          : `Manage student admissions for ${branchName || "selected branch"}.`;

  const columns = [
    {
      key: "full_name",
      title: "Name",
      render: (row) => <strong>{row.full_name}</strong>,
    },
    {
      key: "father_name",
      title: "Father Name",
      render: (row) => row.father_name || "-",
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
      key: "admission_date",
      title: "Joining Date",
      render: (row) => formatDate(row.admission_date),
    },
    {
      key: "total_fee",
      title: "Fees",
      render: (row) => formatCurrency(row.total_fee || row.paid_fee || 0),
    },
    {
      key: "fee_status",
      title: "Fees Status",
      render: (row) => (
        <Badge type={getFeeBadgeType(row.fee_status)}>
          {row.fee_status || "pending"}
        </Badge>
      ),
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
          <h1 className="page-title">{displayTitle}</h1>
          <p className="page-subtitle">{displaySubtitle}</p>
        </div>

        {defaultStudentStatus !== "non_active" &&
          hasPermission("students.create") && (
            <Button onClick={openAddModal}>
              <Plus size={16} /> Add Student
            </Button>
          )}
      </div>

      <Card className="student-card">
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
              { label: "All Fee Status", value: "" },
              { label: "Paid", value: "paid" },
              { label: "Pending", value: "pending" },
              { label: "Partial", value: "partial" },
            ]}
          />

          {/* <Button variant="secondary" onClick={clearFilters}>
            Clear Filters
          </Button> */}

          {/* <Button variant="secondary" onClick={fetchStudents}>
            <RefreshCcw size={16} /> Refresh
          </Button> */}
        </div>

        {error && <div className="students-error">{error}</div>}

        <Table columns={columns} data={students} emptyText="No students found" />
      </Card>

      <Modal
        open={modalOpen}
        title={selectedRecord?.id ? "Edit Student" : "Add New Student"}
        onClose={() => {
          setModalOpen(false);
          setSelectedRecord(null);
          resetForm();
        }}
        size="lg"
      >
        <form onSubmit={handleSubmitStudent}>
          <div className="student-form-grid">
            <Input
              label="Student Name"
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

            <Input
              label="Joining Date"
              name="admissionDate"
              type="date"
              value={form.admissionDate}
              onChange={handleFormChange}
            />

            <Input
              label="Fees"
              name="paidFee"
              type="number"
              value={form.paidFee}
              onChange={handleFormChange}
              required
            />

            <Select
              label="Fees Status"
              name="feeStatus"
              value={form.feeStatus}
              onChange={handleFormChange}
              options={[
                { label: "Paid", value: "paid" },
                { label: "Pending", value: "pending" },
              ]}
            />
          </div>


          <div className="modal-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setModalOpen(false);
                setSelectedRecord(null);
                resetForm();
              }}
            >
              Cancel
            </Button>

            <Button type="submit" loading={saving}>
              {selectedRecord?.id ? "Update Student" : "Save Student"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={viewModalOpen}
        title="Student Details"
        onClose={() => setViewModalOpen(false)}
        size="lg"
      >
        {selectedRecord && (
          <div className="student-detail-grid">
            <div>
              <strong>Name:</strong>
              <p>{selectedRecord.full_name}</p>
            </div>

            <div>
              <strong>Father Name:</strong>
              <p>{selectedRecord.father_name || "-"}</p>
            </div>

            <div>
              <strong>Phone:</strong>
              <p>{selectedRecord.phone || "-"}</p>
            </div>

            <div>
              <strong>Courses:</strong>
              <p>
                {selectedRecord.courses?.length
                  ? selectedRecord.courses.map((course) => course.courseName).join(", ")
                  : "-"}
              </p>
            </div>

            <div>
              <strong>Joining Date:</strong>
              <p>{formatDate(selectedRecord.admission_date)}</p>
            </div>

            <div>
              <strong>Fees:</strong>
              <p>
                {formatCurrency(selectedRecord.total_fee || selectedRecord.paid_fee || 0)}
              </p>
            </div>

            <div>
              <strong>Fees Status:</strong>
              <p>{selectedRecord.fee_status || "-"}</p>
            </div>
          </div>
        )}
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