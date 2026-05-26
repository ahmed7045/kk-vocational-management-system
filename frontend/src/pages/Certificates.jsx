import { useEffect, useState } from "react";
import {
  Award,
  Download,
  Plus,
  Search,
} from "lucide-react";

import axiosInstance from "../api/axiosInstance";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Table from "../components/common/Table";
import Badge from "../components/common/Badge";
import Modal from "../components/common/Modal";
import Loader from "../components/common/Loader";

import {
  formatDate,
  getSelectedBranchId,
  getSelectedBranchName,
} from "../utils/formatters";

import "./certificates.css";

const getTodayDate = () => {
  return new Date().toISOString().split("T")[0];
};

const Certificates = () => {
  const branchId = getSelectedBranchId();
  const branchName = getSelectedBranchName();

  const [certificates, setCertificates] = useState([]);
  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [certificateEditMode, setCertificateEditMode] = useState(false);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    search: "",
  });

  const [form, setForm] = useState({
    studentId: "",
    issueDate: getTodayDate(),
    certificateTitle: "Certificate of Achievement",
    associationName: "KUTCHI KUMBHAR KHIDMAT-E-KHALQ WELFARE ASSOCIATION",
    registrationText: "(Regd)",
    instituteName: "Khidmat-e-Khalq Vocational IT Center",
    studentName: "",
    courseName: "",
    courseDuration: "",
    achievementText:
      "Furthermore, the student has achieved a Distinguished Position in recognition of outstanding performance, dedication, and hard work. This certificate is proudly awarded in appreciation of their commitment and excellence.",
    secretaryName: "Aftab Ahmed",
    presidentName: "Muhammad Rafiq Mara",
  });

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (branchId) params.append("branchId", branchId);

      if (filters.search.trim()) {
        params.append("search", filters.search.trim());
      }

      params.append("page", "1");
      params.append("limit", "50");

      const response = await axiosInstance.get(
        `/certificates?${params.toString()}`
      );

      setCertificates(response.data.data || []);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to fetch certificates");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await axiosInstance.get(
        `/students?branchId=${branchId || ""}&page=1&limit=200`
      );

      setStudents(response.data.data || []);
    } catch (error) {
      console.error("Student fetch error:", error.response?.data?.message);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [branchId]);

  useEffect(() => {
    fetchCertificates();
  }, [branchId, filters.search]);

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
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStudentNameChange = (event) => {
    const studentName = event.target.value;

    const selectedStudent = students.find(
      (student) =>
        student.full_name?.toLowerCase().trim() ===
        studentName.toLowerCase().trim()
    );

    let courseName = "";
    let courseDuration = "";

    if (selectedStudent?.courses?.length) {
      const firstCourse = selectedStudent.courses[0];

      courseName =
        firstCourse.courseName ||
        firstCourse.course_name ||
        firstCourse.name ||
        "";

      courseDuration =
        firstCourse.duration ||
        selectedStudent.duration ||
        "";
    }

    setForm((prev) => ({
      ...prev,
      studentName,
      studentId: selectedStudent?.id || "",
      courseName: selectedStudent ? courseName : prev.courseName,
      courseDuration: selectedStudent ? courseDuration : prev.courseDuration,
    }));
  };

  const resetForm = () => {
    setForm({
      studentId: "",
      issueDate: getTodayDate(),
      certificateTitle: "Certificate of Achievement",
      associationName: "KUTCHI KUMBHAR KHIDMAT-E-KHALQ WELFARE ASSOCIATION",
      registrationText: "(Regd)",
      instituteName: "Khidmat-e-Khalq Vocational IT Center",
      studentName: "",
      courseName: "",
      courseDuration: "",
      achievementText:
        "Furthermore, the student has achieved a Distinguished Position in recognition of outstanding performance, dedication, and hard work. This certificate is proudly awarded in appreciation of their commitment and excellence.",
      secretaryName: "Aftab Ahmed",
      presidentName: "Muhammad Rafiq Mara",
    });
  };

  const openGenerateModal = () => {
    resetForm();
    setCertificateEditMode(false);
    setModalOpen(true);
  };

  const generateCertificate = async (event) => {
    event.preventDefault();

    const matchedStudent = students.find(
      (student) =>
        student.full_name?.toLowerCase().trim() ===
        form.studentName.toLowerCase().trim()
    );

    const finalStudentId = form.studentId || matchedStudent?.id;

    if (!finalStudentId) {
      alert("Please enter an existing student name.");
      return;
    }

    if (!form.studentName.trim()) {
      alert("Student name is required.");
      return;
    }

    if (!form.courseName.trim()) {
      alert("Course name is required.");
      return;
    }

    try {
      setSaving(true);

      await axiosInstance.post("/certificates/generate", {
        studentId: Number(finalStudentId),
        issueDate: form.issueDate || null,
        certificateTitle: form.certificateTitle,
        associationName: form.associationName,
        registrationText: form.registrationText,
        instituteName: form.instituteName,
        studentName: form.studentName,
        courseName: form.courseName,
        courseDuration: form.courseDuration,
        achievementText: form.achievementText,
        secretaryName: form.secretaryName,
        presidentName: form.presidentName,
      });

      setModalOpen(false);
      resetForm();
      fetchCertificates();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to generate certificate");
    } finally {
      setSaving(false);
    }
  };

  const downloadCertificate = async (certificate) => {
    try {
      const response = await axiosInstance.get(
        `/certificates/${certificate.id}/download`,
        {
          responseType: "blob",
        }
      );

      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");

      link.href = blobUrl;
      link.setAttribute(
        "download",
        `${certificate.certificate_no || "certificate"}.pdf`
      );

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to download certificate");
    }
  };

  const columns = [
    {
      key: "certificate_no",
      title: "Certificate No",
      render: (row) => (
        <div>
          <strong>{row.certificate_no}</strong>
          <span className="table-subtext">{row.branch_name || "-"}</span>
        </div>
      ),
    },
    {
      key: "student_name",
      title: "Student",
      render: (row) => row.student_name || "-",
    },
    {
      key: "course_name",
      title: "Course",
      render: (row) => (
        <div>
          <strong>{row.course_name || "-"}</strong>
          <span className="table-subtext">
            {row.course_duration || "No duration"}
          </span>
        </div>
      ),
    },
    {
      key: "issue_date",
      title: "Issue Date",
      render: (row) => formatDate(row.issue_date),
    },
    {
      key: "generated_by_name",
      title: "Generated By",
      render: (row) => row.generated_by_name || "-",
    },
    {
      key: "created_at",
      title: "Created",
      render: (row) => formatDate(row.created_at),
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => downloadCertificate(row)}
        >
          <Download size={14} /> Download
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="page">
        <Loader text="Loading certificates..." />
      </div>
    );
  }

  return (
    <div className="page certificates-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Certificates</h1>
          <p className="page-subtitle">
            Generate and download student certificates for{" "}
            {branchName || "selected branch"}.
          </p>
        </div>

        <Button onClick={openGenerateModal}>
          <Plus size={16} /> Generate Certificate
        </Button>
      </div>

      <Card className="certificates-card">
        <div className="certificates-toolbar">
          <div className="certificates-search">
            <Search size={17} />
            <input
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search by student, course or certificate no..."
            />
          </div>

          {/* <Button variant="secondary" onClick={clearFilters}>
            Clear Filters
          </Button> */}

          {/* <Button variant="secondary" onClick={fetchCertificates}>
            <RefreshCcw size={16} /> Refresh
          </Button> */}
        </div>

        {error && <div className="certificates-error">{error}</div>}

        <Table
          columns={columns}
          data={certificates}
          emptyText="No certificates found"
        />
      </Card>

      <Modal
        open={modalOpen}
        title="Generate Certificate"
        onClose={() => {
          setModalOpen(false);
          setCertificateEditMode(false);
          resetForm();
        }}
        size="lg"
      >
        <form onSubmit={generateCertificate}>
          <div className="certificate-form-section">
            <h4>Student Information</h4>

            <div className="certificate-form-grid">
              <Input
                label="Student Name"
                name="studentName"
                value={form.studentName}
                onChange={handleStudentNameChange}
                required
              />

              <Input
                label="Issue Date"
                name="issueDate"
                type="date"
                value={form.issueDate}
                onChange={handleChange}
                disabled={!certificateEditMode}
              />

              <Input
                label="Course Name"
                name="courseName"
                value={form.courseName}
                onChange={handleChange}
                disabled={!certificateEditMode}
                required
              />

              <Input
                label="Course Duration"
                name="courseDuration"
                value={form.courseDuration}
                onChange={handleChange}
                placeholder="e.g. 6 months"
                disabled={!certificateEditMode}
              />

              <Input
                label="Certificate Title"
                name="certificateTitle"
                value={form.certificateTitle}
                onChange={handleChange}
                disabled={!certificateEditMode}
              />
            </div>
          </div>

          <div className="certificate-form-section">
            <h4>Certificate Header</h4>

            <div className="certificate-form-grid">
              <Input
                label="Association Name"
                name="associationName"
                value={form.associationName}
                onChange={handleChange}
                disabled={!certificateEditMode}
              />

              <Input
                label="Registration Text"
                name="registrationText"
                value={form.registrationText}
                onChange={handleChange}
                disabled={!certificateEditMode}
              />

              <Input
                label="Institute Name"
                name="instituteName"
                value={form.instituteName}
                onChange={handleChange}
                disabled={!certificateEditMode}
              />
            </div>
          </div>

          <div className="certificate-form-section">
            <h4>Achievement Text</h4>

            <div className="form-group">
              <label>Achievement Text</label>
              <textarea
                name="achievementText"
                value={form.achievementText}
                onChange={handleChange}
                rows="4"
                disabled={!certificateEditMode}
              />
            </div>
          </div>

          <div className="certificate-form-section">
            <h4>Signatures</h4>

            <div className="certificate-form-grid">
              <Input
                label="Secretary Name"
                name="secretaryName"
                value={form.secretaryName}
                onChange={handleChange}
                disabled={!certificateEditMode}
              />

              <Input
                label="President Name"
                name="presidentName"
                value={form.presidentName}
                onChange={handleChange}
                disabled={!certificateEditMode}
              />
            </div>
          </div>

          <div className="certificate-preview-note">
            <Badge type="info">Template Fixed</Badge>
            <span>
              The certificate design stays fixed. Only the fields above are
              editable.
            </span>
          </div>

          <div className="modal-actions certificate-modal-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCertificateEditMode((prev) => !prev)}
            >
              {certificateEditMode ? "Lock Fields" : "Edit Fields"}
            </Button>

            <div className="certificate-action-right">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setModalOpen(false);
                  setCertificateEditMode(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>

              <Button type="submit" loading={saving}>
                Generate Certificate
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Certificates;