import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Download, Eye, EyeOff, Plus, Search, Wallet } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import ActionButtons from "../components/common/ActionButtons";
import ConfirmDeleteModal from "../components/common/ConfirmDeleteModal";
import DateRangePicker from "../components/common/DateRangePicker";
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

const capitalizeWords = (value) => {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
};

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
  const [paymentMethods, setPaymentMethods] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [paidDateModalOpen, setPaidDateModalOpen] = useState(false);
  const [paidDateForm, setPaidDateForm] = useState({
    feeDate: "",
    paidDate: "",
  });

  const [markPaidModalOpen, setMarkPaidModalOpen] = useState(false);
  const [markPaidForm, setMarkPaidForm] = useState({
    feeDate: "",
    paidDate: new Date().toISOString().split("T")[0],
    amount: "",
    paymentMethodId: "",
  });
  const [deleting, setDeleting] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    feeStatus: searchParams.get("feeStatus") || "",
    fromDate: "",
    toDate: "",
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
  });
  const [showSummaryAmount, setShowSummaryAmount] = useState(true);
  const [form, setForm] = useState({
    studentCode: "",
    fullName: "",
    fatherName: "",
    phone: "",
    courseId: "",
    shiftId: "",
    admissionDate: "",
    paidFee: "",
    feeStatus: "paid",
  });

  const resetForm = () => {
    setForm({
      studentCode: "",
      fullName: "",
      fatherName: "",
      phone: "",
      courseId: "",
      shiftId: "",
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

  const downloadPaidStudentsReport = async () => {
    try {
      const params = new URLSearchParams();

      if (branchId) params.append("branchId", branchId);
      if (filters.search.trim()) params.append("search", filters.search.trim());

      if (filters.fromDate) params.append("fromDate", filters.fromDate);
      if (filters.toDate) params.append("toDate", filters.toDate);

      if (!filters.fromDate && !filters.toDate) {
        if (filters.month) params.append("month", filters.month);
        if (filters.year) params.append("year", filters.year);
      }

      const response = await axiosInstance.get(
        `/students/reports/paid/pdf?${params.toString()}`,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", "paid-students-report.pdf");
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to generate paid students report");
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (branchId) params.append("branchId", branchId);
      if (filters.search.trim()) params.append("search", filters.search.trim());
      if (filters.feeStatus) params.append("feeStatus", filters.feeStatus);
      if (filters.fromDate) params.append("fromDate", filters.fromDate);
      if (filters.toDate) params.append("toDate", filters.toDate);

      if (isFeeListMode && !filters.fromDate && !filters.toDate) {
        if (filters.month) params.append("month", filters.month);
        if (filters.year) params.append("year", filters.year);
      }

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
      const [coursesRes, teachersRes, paymentMethodsRes] = await Promise.all([
        axiosInstance.get(`/courses?branchId=${branchId || ""}`),
        axiosInstance.get(`/employees?branchId=${branchId || ""}`),
        axiosInstance.get("/payments/methods"),
      ]);

      setCourses(coursesRes.data.data || []);
      setTeachers(teachersRes.data.data || []);
      setPaymentMethods(paymentMethodsRes.data.data || []);
    } catch (error) {
      console.error("Dropdown fetch error:", error.response?.data?.message);
    }
  };

  const fetchShiftsByCourse = async (courseId) => {
    if (!courseId) {
      setShifts([]);
      return;
    }

    try {
      const response = await axiosInstance.get(
        `/shifts?branchId=${branchId || ""}&courseId=${courseId}`
      );

      setShifts(response.data.data || []);
    } catch (error) {
      console.error("Shift fetch error:", error.response?.data?.message);
    }
  };

  useEffect(() => {
    fetchDropdownData();
  }, [branchId]);

  useEffect(() => {
    fetchStudents();
  }, [
    branchId,
    defaultStudentStatus,
    filters.search,
    filters.feeStatus,
    filters.fromDate,
    filters.toDate,
    filters.month,
    filters.year,
  ]);

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

    const finalValue =
      name === "fullName" || name === "fatherName"
        ? capitalizeWords(value)
        : value;

    setForm((prev) => ({
      ...prev,
      [name]: finalValue,
      ...(name === "courseId" ? { shiftId: "" } : {}),
    }));

    if (name === "courseId") {
      fetchShiftsByCourse(value);
    }
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
      studentCode: form.studentCode || null,
      fullName: form.fullName,
      fatherName: form.fatherName,
      phone: form.phone,
      city: "",
      address: "",
      courseIds: form.courseId ? [Number(form.courseId)] : [],
      assignedTeacherId: null,
      shiftId: form.shiftId ? Number(form.shiftId) : null,
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
        studentCode: student.student_code || "",
        fullName: student.full_name || "",
        fatherName: student.father_name || "",
        phone: student.phone || "",
        courseId: student.courses?.[0]?.id || "",
        shiftId: student.shift_id || "",
        admissionDate: student.admission_date?.split("T")[0] || "",
        paidFee: student.total_fee || student.paid_fee || "",
        feeStatus: student.fee_status || "paid",
      });

      if (student.courses?.[0]?.id) {
        fetchShiftsByCourse(student.courses[0].id);
      }
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

  const getCourseNames = (row) => {
    return row.courses?.length
      ? row.courses.map((course) => course.courseName).join(", ")
      : "-";
  };

  const getFeeDate = (row) => {
    if (row.fees_date) return formatDate(row.fees_date);
    if (!row.admission_date) return "-";

    const date = new Date(row.admission_date);
    date.setMonth(date.getMonth() + 1);

    return formatDate(date);
  };

  const getFeeDateValue = (row) => {
    if (row.fees_date) return row.fees_date.split("T")[0];
    if (!row.admission_date) return "";

    const date = new Date(row.admission_date);
    date.setMonth(date.getMonth() + 1);

    return date.toISOString().split("T")[0];
  };

  const getPaidDate = (row) => {
    return row.paid_date ? formatDate(row.paid_date) : "-";
  };

  const openPaidDateModal = (row) => {
    setSelectedRecord(row);
    setPaidDateForm({
      feeDate: getFeeDateValue(row),
      paidDate: row.paid_date ? row.paid_date.split("T")[0] : "",
    });
    setPaidDateModalOpen(true);
  };

  const openMarkPaidModal = (row) => {
    setSelectedRecord(row);
    setMarkPaidForm({
      feeDate: getFeeDateValue(row),
      paidDate: new Date().toISOString().split("T")[0],
      amount: row.cycle_amount || row.total_fee || row.paid_fee || "",
      paymentMethodId: "",
    });
    setMarkPaidModalOpen(true);
  };

  const submitMarkPaid = async (event) => {
    event.preventDefault();

    if (!selectedRecord?.id) return;

    try {
      await axiosInstance.patch(`/students/${selectedRecord.id}/mark-paid`, {
        feeCycleId: selectedRecord.fee_cycle_id,
        feeDate: markPaidForm.feeDate,
        paidDate: markPaidForm.paidDate,
        amount: markPaidForm.amount,
        paymentMethodId: markPaidForm.paymentMethodId || null,
      });

      setMarkPaidModalOpen(false);
      setSelectedRecord(null);
      setMarkPaidForm({
        feeDate: "",
        paidDate: new Date().toISOString().split("T")[0],
        amount: "",
        paymentMethodId: "",
      });

      await fetchStudents();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to mark student as paid");
    }
  };

  const submitPaidDate = async (event) => {
    event.preventDefault();

    if (!selectedRecord?.id) return;

    try {
      await axiosInstance.patch(`/students/${selectedRecord.id}/payment-date`, {
        feeDate: paidDateForm.feeDate,
        paidDate: paidDateForm.paidDate,
      });

      setPaidDateModalOpen(false);
      setSelectedRecord(null);
      setPaidDateForm({
        feeDate: "",
        paidDate: "",
      });

      await fetchStudents();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update paid date");
    }
  };

  const totalCollected = students.reduce((sum, student) => {
    if (filters.feeStatus === "paid") {
      return sum + Number(student.payment_amount || student.paid_fee || 0);
    }

    if (filters.feeStatus === "pending") {
      return sum + Number(student.cycle_amount || student.total_fee || 0);
    }

    return sum + Number(student.paid_fee || 0);
  }, 0);

  const totalBalance = students.reduce(
    (sum, student) => sum + Number(student.remaining_fee || 0),
    0
  );

  const isFeeListMode =
    filters.feeStatus === "paid" || filters.feeStatus === "pending";

  const shouldShowSummaryCard = isFeeListMode;

  const summaryTitle =
    filters.feeStatus === "pending"
      ? "TOTAL PENDING"
      : "TOTAL COLLECTED";

  const compactColumns = [
    {
      key: "full_name",
      title: "Name",
      render: (row) => (
        <div>
          <strong>{row.full_name}</strong>
          <span className="table-subtext">{row.student_code || row.id}</span>
        </div>
      ),
    },
    {
      key: "courses",
      title: "Course Name",
      render: (row) => getCourseNames(row),
    },
    {
      key: "total_fee",
      title: "Fees",
      render: (row) => formatCurrency(row.cycle_amount || row.total_fee || row.paid_fee || 0),
    },
    {
      key: "fees_date",
      title: "Fees Date",
      render: (row) => getFeeDate(row),
    },
    ...(filters.feeStatus === "paid"
      ? [
        {
          key: "paid_date",
          title: "Paid Date",
          render: (row) => getPaidDate(row),
        },
      ]
      : []),
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <div className="fee-list-actions">
          {filters.feeStatus === "pending" ? (
            <Button
              size="sm"
              onClick={() => openMarkPaidModal(row)}
              disabled={!hasPermission("students.update")}
            >
              Mark Paid
            </Button>
          ) : (
            <ActionButtons
              onView={() => handleView(row)}
              onEdit={() => openPaidDateModal(row)}
              onDelete={() => handleDeleteClick(row)}
              canView={hasPermission("students.view")}
              canEdit={hasPermission("students.update")}
              canDelete={hasPermission("students.delete")}
            />
          )}
        </div>
      ),
    },
  ];

  const fullColumns = [
    {
      key: "full_name",
      title: "Name",
      render: (row) => (
        <div>
          <strong>{row.full_name}</strong>
          <span className="table-subtext">{row.student_code || row.id}</span>
        </div>
      ),
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
      render: (row) => getCourseNames(row),
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

  const monthOptions = [
    { label: "January", value: "1" },
    { label: "February", value: "2" },
    { label: "March", value: "3" },
    { label: "April", value: "4" },
    { label: "May", value: "5" },
    { label: "June", value: "6" },
    { label: "July", value: "7" },
    { label: "August", value: "8" },
    { label: "September", value: "9" },
    { label: "October", value: "10" },
    { label: "November", value: "11" },
    { label: "December", value: "12" },
  ];

  const currentYear = new Date().getFullYear();

  const yearOptions = Array.from({ length: 6 }, (_, index) => {
    const year = currentYear - index;

    return {
      label: String(year),
      value: String(year),
    };
  });

  const columns = isFeeListMode ? compactColumns : fullColumns;
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

        {filters.feeStatus === "paid" && (
          <Button onClick={downloadPaidStudentsReport}>
            <Download size={16} /> Generate Report
          </Button>
        )}

        {!isFeeListMode &&
          defaultStudentStatus !== "non_active" &&
          hasPermission("students.create") && (
            <Button onClick={openAddModal}>
              <Plus size={16} /> Add Student
            </Button>
          )}
      </div>

      {shouldShowSummaryCard && (
        <div className="student-summary-card">
          <div className="student-summary-icon">
            <Wallet size={22} />
          </div>

          <div className="student-summary-content">
            <p>{summaryTitle}</p>

            <div className="student-summary-amount">
              <h2>
                {showSummaryAmount
                  ? formatCurrency(totalCollected)
                  : "••••••"}
              </h2>

              <button
                type="button"
                onClick={() => setShowSummaryAmount((prev) => !prev)}
              >
                {showSummaryAmount ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {!isFeeListMode && (
              <span>
                Bal.{" "}
                {showSummaryAmount
                  ? formatCurrency(totalBalance)
                  : "••••••"}
              </span>
            )}
          </div>
        </div>
      )}

      <Card className={`student-card ${isFeeListMode ? "fee-list-card" : ""}`}>

        <div className={`students-toolbar ${isFeeListMode ? "fee-list-toolbar" : ""}`}>
          <div className="students-search">
            <Search size={17} />
            <input
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search by name, father name or phone..."
            />
          </div>

          <div className="filter-actions">

            {isFeeListMode && (
              <>
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

                <Select
                  name="month"
                  value={filters.month}
                  onChange={handleFilterChange}
                  options={monthOptions}
                />

                <Select
                  name="year"
                  value={filters.year}
                  onChange={handleFilterChange}
                  options={yearOptions}
                />
              </>
            )}

            {!isFeeListMode && (
              <Select
                name="feeStatus"
                value={filters.feeStatus}
                onChange={handleFilterChange}
                placeholder="Fee status"
                options={[
                  { label: "Paid", value: "paid" },
                  { label: "Pending", value: "pending" },
                ]}
              />
            )}
          </div>
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
              label="Student ID"
              name="studentCode"
              value={form.studentCode}
              onChange={handleFormChange}
              placeholder="Leave empty for auto ID"
            />
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
            <Select
              label="Shift"
              name="shiftId"
              value={form.shiftId}
              onChange={handleFormChange}
              placeholder={form.courseId ? "Select shift" : "Select course first"}
              options={shifts.map((shift) => ({
                label: shift.shift_label || shift.shift_name,
                value: shift.id,
              }))}
              disabled={!form.courseId}
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
              <strong>Student ID:</strong>
              <p>{selectedRecord.student_code || selectedRecord.id}</p>
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
      <Modal
        open={markPaidModalOpen}
        title={`${selectedRecord?.full_name || "Student"} — Mark as Paid`}
        onClose={() => {
          setMarkPaidModalOpen(false);
          setSelectedRecord(null);
          setMarkPaidForm({
            feeDate: "",
            paidDate: new Date().toISOString().split("T")[0],
            amount: "",
            paymentMethodId: "",
          });
        }}
      >
        <form onSubmit={submitMarkPaid}>
          <div className="student-form-grid">
            <Input
              label="Monthly Fee"
              name="amount"
              type="number"
              value={markPaidForm.amount}
              onChange={(event) =>
                setMarkPaidForm((prev) => ({
                  ...prev,
                  amount: event.target.value,
                }))
              }
              required
            />

            <Select
              label="Payment Method"
              name="paymentMethodId"
              value={markPaidForm.paymentMethodId}
              onChange={(event) =>
                setMarkPaidForm((prev) => ({
                  ...prev,
                  paymentMethodId: event.target.value,
                }))
              }
              options={paymentMethods.map((method) => ({
                label: method.method_name,
                value: method.id,
              }))}
              required
            />

            <Input
              label="Fees Date"
              name="feeDate"
              type="date"
              value={markPaidForm.feeDate}
              disabled
            />

            <Input
              label="Paid At"
              name="paidDate"
              type="date"
              value={markPaidForm.paidDate}
              onChange={(event) =>
                setMarkPaidForm((prev) => ({
                  ...prev,
                  paidDate: event.target.value,
                }))
              }
              required
            />
          </div>

          <div className="modal-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setMarkPaidModalOpen(false)}
            >
              Cancel
            </Button>

            <Button type="submit">
              Mark Paid
            </Button>
          </div>
        </form>
      </Modal>
      <Modal
        open={paidDateModalOpen}
        title="Edit Paid Date"
        onClose={() => {
          setPaidDateModalOpen(false);
          setSelectedRecord(null);
          setPaidDateForm({
            feeDate: "",
            paidDate: "",
          });
        }}
      >
        <form onSubmit={submitPaidDate}>
          <div className="student-form-grid">
            <Input
              label="Fees Date"
              name="feeDate"
              type="date"
              value={paidDateForm.feeDate}
              disabled
            />

            <Input
              label="Paid Date"
              name="paidDate"
              type="date"
              value={paidDateForm.paidDate}
              onChange={(event) =>
                setPaidDateForm((prev) => ({
                  ...prev,
                  paidDate: event.target.value,
                }))
              }
              required
            />
          </div>

          <div className="modal-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPaidDateModalOpen(false)}
            >
              Cancel
            </Button>

            <Button type="submit">
              Save Paid Date
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