import { useEffect, useState } from "react";
import { BookOpen, Clock, Plus, RefreshCcw } from "lucide-react";

import axiosInstance from "../api/axiosInstance";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Table from "../components/common/Table";
import Badge from "../components/common/Badge";
import Modal from "../components/common/Modal";
import Loader from "../components/common/Loader";
import {
  formatCurrency,
  getSelectedBranchId,
  getSelectedBranchName,
} from "../utils/formatters";

import "./courses.css";

const Courses = () => {
  const branchId = getSelectedBranchId();
  const branchName = getSelectedBranchName();

  const [activeTab, setActiveTab] = useState("courses");

  const [courses, setCourses] = useState([]);
  const [shifts, setShifts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [savingCourse, setSavingCourse] = useState(false);
  const [savingShift, setSavingShift] = useState(false);

  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [shiftModalOpen, setShiftModalOpen] = useState(false);

  const [error, setError] = useState("");

  const [courseForm, setCourseForm] = useState({
    courseName: "",
    courseCode: "",
    duration: "",
    fee: "",
    description: "",
  });

  const [shiftForm, setShiftForm] = useState({
    shiftName: "",
    startTime: "",
    endTime: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [coursesRes, shiftsRes] = await Promise.all([
        axiosInstance.get(`/courses?branchId=${branchId || ""}`),
        axiosInstance.get(`/shifts?branchId=${branchId || ""}`),
      ]);

      setCourses(coursesRes.data.data || []);
      setShifts(shiftsRes.data.data || []);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to fetch courses and shifts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCourseChange = (event) => {
    const { name, value } = event.target;

    setCourseForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleShiftChange = (event) => {
    const { name, value } = event.target;

    setShiftForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetCourseForm = () => {
    setCourseForm({
      courseName: "",
      courseCode: "",
      duration: "",
      fee: "",
      description: "",
    });
  };

  const resetShiftForm = () => {
    setShiftForm({
      shiftName: "",
      startTime: "",
      endTime: "",
    });
  };

  const createCourse = async (event) => {
    event.preventDefault();

    if (!branchId) {
      alert("Please select a branch first.");
      return;
    }

    try {
      setSavingCourse(true);

      await axiosInstance.post("/courses", {
        branchId: Number(branchId),
        courseName: courseForm.courseName,
        courseCode: courseForm.courseCode,
        duration: courseForm.duration,
        fee: Number(courseForm.fee || 0),
        description: courseForm.description,
      });

      setCourseModalOpen(false);
      resetCourseForm();
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create course");
    } finally {
      setSavingCourse(false);
    }
  };

  const createShift = async (event) => {
    event.preventDefault();

    if (!branchId) {
      alert("Please select a branch first.");
      return;
    }

    try {
      setSavingShift(true);

      await axiosInstance.post("/shifts", {
        branchId: Number(branchId),
        shiftName: shiftForm.shiftName,
        startTime: shiftForm.startTime,
        endTime: shiftForm.endTime,
      });

      setShiftModalOpen(false);
      resetShiftForm();
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create shift");
    } finally {
      setSavingShift(false);
    }
  };

  const courseColumns = [
    {
      key: "course_name",
      title: "Course",
      render: (row) => (
        <div>
          <strong>{row.course_name}</strong>
          <span className="table-subtext">{row.course_code || "No code"}</span>
        </div>
      ),
    },
    {
      key: "duration",
      title: "Duration",
      render: (row) => row.duration || "-",
    },
    {
      key: "fee",
      title: "Fee",
      render: (row) => formatCurrency(row.fee),
    },
    {
      key: "is_active",
      title: "Status",
      render: (row) => (
        <Badge type={row.is_active ? "success" : "danger"}>
          {row.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "description",
      title: "Description",
      render: (row) => row.description || "-",
    },
  ];

  const shiftColumns = [
    {
      key: "shift_name",
      title: "Shift",
      render: (row) => <strong>{row.shift_name}</strong>,
    },
    {
      key: "start_time",
      title: "Start Time",
      render: (row) => row.start_time || "-",
    },
    {
      key: "end_time",
      title: "End Time",
      render: (row) => row.end_time || "-",
    },
    {
      key: "is_active",
      title: "Status",
      render: (row) => (
        <Badge type={row.is_active ? "success" : "danger"}>
          {row.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="page">
        <Loader text="Loading courses and shifts..." />
      </div>
    );
  }

  return (
    <div className="page courses-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Courses & Shifts</h1>
          <p className="page-subtitle">
            Manage courses and class timings for {branchName || "selected branch"}.
          </p>
        </div>

        <div className="course-header-actions">
          <Button variant="secondary" onClick={fetchData}>
            <RefreshCcw size={16} /> Refresh
          </Button>

          {activeTab === "courses" ? (
            <Button onClick={() => setCourseModalOpen(true)}>
              <Plus size={16} /> Add Course
            </Button>
          ) : (
            <Button onClick={() => setShiftModalOpen(true)}>
              <Plus size={16} /> Add Shift
            </Button>
          )}
        </div>
      </div>

      <div className="course-summary-grid">
        <Card>
          <div className="summary-card">
            <div className="summary-icon">
              <BookOpen size={24} />
            </div>
            <div>
              <p>Total Courses</p>
              <h2>{courses.length}</h2>
            </div>
          </div>
        </Card>

        <Card>
          <div className="summary-card">
            <div className="summary-icon">
              <Clock size={24} />
            </div>
            <div>
              <p>Total Shifts</p>
              <h2>{shifts.length}</h2>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="tabs">
          <button
            className={activeTab === "courses" ? "active" : ""}
            onClick={() => setActiveTab("courses")}
          >
            Courses
          </button>

          <button
            className={activeTab === "shifts" ? "active" : ""}
            onClick={() => setActiveTab("shifts")}
          >
            Shift Timings
          </button>
        </div>

        {error && <div className="courses-error">{error}</div>}

        {activeTab === "courses" ? (
          <Table
            columns={courseColumns}
            data={courses}
            emptyText="No courses found"
          />
        ) : (
          <Table
            columns={shiftColumns}
            data={shifts}
            emptyText="No shifts found"
          />
        )}
      </Card>

      <Modal
        open={courseModalOpen}
        title="Add New Course"
        onClose={() => setCourseModalOpen(false)}
        size="md"
      >
        <form onSubmit={createCourse}>
          <Input
            label="Course Name"
            name="courseName"
            value={courseForm.courseName}
            onChange={handleCourseChange}
            placeholder="e.g. Web Development"
            required
          />

          <Input
            label="Course Code"
            name="courseCode"
            value={courseForm.courseCode}
            onChange={handleCourseChange}
            placeholder="e.g. WD-101"
          />

          <Input
            label="Duration"
            name="duration"
            value={courseForm.duration}
            onChange={handleCourseChange}
            placeholder="e.g. 6 months"
          />

          <Input
            label="Fee"
            name="fee"
            type="number"
            value={courseForm.fee}
            onChange={handleCourseChange}
            placeholder="e.g. 15000"
          />

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={courseForm.description}
              onChange={handleCourseChange}
              rows="3"
              placeholder="Short course description"
            />
          </div>

          <div className="modal-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCourseModalOpen(false)}
            >
              Cancel
            </Button>

            <Button type="submit" loading={savingCourse}>
              Save Course
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={shiftModalOpen}
        title="Add Shift Timing"
        onClose={() => setShiftModalOpen(false)}
        size="md"
      >
        <form onSubmit={createShift}>
          <Input
            label="Shift Name"
            name="shiftName"
            value={shiftForm.shiftName}
            onChange={handleShiftChange}
            placeholder="e.g. Morning"
            required
          />

          <Input
            label="Start Time"
            name="startTime"
            type="time"
            value={shiftForm.startTime}
            onChange={handleShiftChange}
            required
          />

          <Input
            label="End Time"
            name="endTime"
            type="time"
            value={shiftForm.endTime}
            onChange={handleShiftChange}
            required
          />

          <div className="modal-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShiftModalOpen(false)}
            >
              Cancel
            </Button>

            <Button type="submit" loading={savingShift}>
              Save Shift
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Courses;