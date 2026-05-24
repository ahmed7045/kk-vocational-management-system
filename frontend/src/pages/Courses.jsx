import { useEffect, useState } from "react";
import { BookOpen, Clock, Plus, RefreshCcw, Search } from "lucide-react";

import axiosInstance from "../api/axiosInstance";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Table from "../components/common/Table";
import Badge from "../components/common/Badge";
import Modal from "../components/common/Modal";
import Loader from "../components/common/Loader";
import ActionButtons from "../components/common/ActionButtons";
import ConfirmDeleteModal from "../components/common/ConfirmDeleteModal";
import {
  formatCurrency,
  getSelectedBranchId,
  getSelectedBranchName,
} from "../utils/formatters";

import "./courses.css";

const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true";

const Courses = () => {
  const branchId = getSelectedBranchId();
  const branchName = getSelectedBranchName();

  const [activeTab, setActiveTab] = useState("courses");

  const [courses, setCourses] = useState([]);
  const [shifts, setShifts] = useState([]);

  const [allCourses, setAllCourses] = useState([]);
  const [allShifts, setAllShifts] = useState([]);

  const [filters, setFilters] = useState({
    search: "",
  });

  const [loading, setLoading] = useState(true);
  const [savingCourse, setSavingCourse] = useState(false);
  const [savingShift, setSavingShift] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedType, setSelectedType] = useState("");

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

  const applyFilters = (
    courseRecords = allCourses,
    shiftRecords = allShifts,
    currentFilters = filters
  ) => {
    const searchText = currentFilters.search.toLowerCase().trim();

    if (!searchText) {
      setCourses(courseRecords);
      setShifts(shiftRecords);
      return;
    }

    const filteredCourses = courseRecords.filter((course) =>
      [
        course.course_name,
        course.course_code,
        course.duration,
        course.description,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchText))
    );

    const filteredShifts = shiftRecords.filter((shift) =>
      [shift.shift_name, shift.start_time, shift.end_time]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchText))
    );

    setCourses(filteredCourses);
    setShifts(filteredShifts);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [coursesRes, shiftsRes] = await Promise.all([
        axiosInstance.get(`/courses?branchId=${branchId || ""}`),
        axiosInstance.get(`/shifts?branchId=${branchId || ""}`),
      ]);

      const courseData = coursesRes.data.data || [];
      const shiftData = shiftsRes.data.data || [];

      setAllCourses(courseData);
      setAllShifts(shiftData);
      applyFilters(courseData, shiftData);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to fetch courses and shifts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [branchId]);

  useEffect(() => {
    applyFilters();
  }, [filters.search, allCourses, allShifts]);

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

  const openAddCourseModal = () => {
    setSelectedRecord(null);
    resetCourseForm();
    setCourseModalOpen(true);
  };

  const openAddShiftModal = () => {
    setSelectedRecord(null);
    resetShiftForm();
    setShiftModalOpen(true);
  };

  const saveCourse = async (event) => {
    event.preventDefault();

    if (!branchId) {
      alert("Please select a branch first.");
      return;
    }

    const payload = {
      branchId: Number(branchId),
      courseName: courseForm.courseName,
      courseCode: courseForm.courseCode,
      duration: courseForm.duration,
      fee: Number(courseForm.fee || 0),
      description: courseForm.description,
    };

    try {
      setSavingCourse(true);

      if (selectedRecord?.id) {
        if (!isDemoMode) {
          await axiosInstance.put(`/courses/${selectedRecord.id}`, payload);
          await fetchData();
        } else {
          const updatedCourses = allCourses.map((course) =>
            course.id === selectedRecord.id
              ? {
                  ...course,
                  course_name: payload.courseName,
                  course_code: payload.courseCode,
                  duration: payload.duration,
                  fee: payload.fee,
                  description: payload.description,
                }
              : course
          );

          setAllCourses(updatedCourses);
          applyFilters(updatedCourses, allShifts);
        }
      } else {
        if (!isDemoMode) {
          await axiosInstance.post("/courses", payload);
          await fetchData();
        } else {
          const newCourse = {
            id: Date.now(),
            course_name: payload.courseName,
            course_code: payload.courseCode,
            duration: payload.duration,
            fee: payload.fee,
            description: payload.description,
            is_active: true,
          };

          const updatedCourses = [newCourse, ...allCourses];
          setAllCourses(updatedCourses);
          applyFilters(updatedCourses, allShifts);
        }
      }

      setCourseModalOpen(false);
      setSelectedRecord(null);
      resetCourseForm();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save course");
    } finally {
      setSavingCourse(false);
    }
  };

  const saveShift = async (event) => {
    event.preventDefault();

    if (!branchId) {
      alert("Please select a branch first.");
      return;
    }

    const payload = {
      branchId: Number(branchId),
      shiftName: shiftForm.shiftName,
      startTime: shiftForm.startTime,
      endTime: shiftForm.endTime,
    };

    try {
      setSavingShift(true);

      if (selectedRecord?.id) {
        if (!isDemoMode) {
          await axiosInstance.put(`/shifts/${selectedRecord.id}`, payload);
          await fetchData();
        } else {
          const updatedShifts = allShifts.map((shift) =>
            shift.id === selectedRecord.id
              ? {
                  ...shift,
                  shift_name: payload.shiftName,
                  start_time: payload.startTime,
                  end_time: payload.endTime,
                }
              : shift
          );

          setAllShifts(updatedShifts);
          applyFilters(allCourses, updatedShifts);
        }
      } else {
        if (!isDemoMode) {
          await axiosInstance.post("/shifts", payload);
          await fetchData();
        } else {
          const newShift = {
            id: Date.now(),
            shift_name: payload.shiftName,
            start_time: payload.startTime,
            end_time: payload.endTime,
            is_active: true,
          };

          const updatedShifts = [newShift, ...allShifts];
          setAllShifts(updatedShifts);
          applyFilters(allCourses, updatedShifts);
        }
      }

      setShiftModalOpen(false);
      setSelectedRecord(null);
      resetShiftForm();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save shift");
    } finally {
      setSavingShift(false);
    }
  };

  const handleViewCourse = (course) => {
    setSelectedType("course");
    setSelectedRecord(course);
    setViewModalOpen(true);
  };

  const handleViewShift = (shift) => {
    setSelectedType("shift");
    setSelectedRecord(shift);
    setViewModalOpen(true);
  };

  const handleEditCourse = (course) => {
    setSelectedRecord(course);

    setCourseForm({
      courseName: course.course_name || "",
      courseCode: course.course_code || "",
      duration: course.duration || "",
      fee: course.fee || "",
      description: course.description || "",
    });

    setCourseModalOpen(true);
  };

  const handleEditShift = (shift) => {
    setSelectedRecord(shift);

    setShiftForm({
      shiftName: shift.shift_name || "",
      startTime: shift.start_time || "",
      endTime: shift.end_time || "",
    });

    setShiftModalOpen(true);
  };

  const handleDeleteClick = (record, type) => {
    setSelectedRecord(record);
    setSelectedType(type);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedRecord?.id || !selectedType) return;

    try {
      setDeleting(true);

      if (selectedType === "course") {
        if (!isDemoMode) {
          await axiosInstance.delete(`/courses/${selectedRecord.id}`);
        }

        const updatedCourses = allCourses.filter(
          (course) => course.id !== selectedRecord.id
        );

        setAllCourses(updatedCourses);
        applyFilters(updatedCourses, allShifts);
      }

      if (selectedType === "shift") {
        if (!isDemoMode) {
          await axiosInstance.delete(`/shifts/${selectedRecord.id}`);
        }

        const updatedShifts = allShifts.filter(
          (shift) => shift.id !== selectedRecord.id
        );

        setAllShifts(updatedShifts);
        applyFilters(allCourses, updatedShifts);
      }

      setDeleteModalOpen(false);
      setSelectedRecord(null);
      setSelectedType("");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete record");
    } finally {
      setDeleting(false);
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
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <ActionButtons
          onView={() => handleViewCourse(row)}
          onEdit={() => handleEditCourse(row)}
          onDelete={() => handleDeleteClick(row, "course")}
        />
      ),
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
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <ActionButtons
          onView={() => handleViewShift(row)}
          onEdit={() => handleEditShift(row)}
          onDelete={() => handleDeleteClick(row, "shift")}
        />
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
            <Button onClick={openAddCourseModal}>
              <Plus size={16} /> Add Course
            </Button>
          ) : (
            <Button onClick={openAddShiftModal}>
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
              <h2>{allCourses.length}</h2>
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
              <h2>{allShifts.length}</h2>
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

        <div className="course-filter-bar">
          <div className="course-search">
            <Search size={17} />
            <input
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder={
                activeTab === "courses"
                  ? "Search course name, code, duration..."
                  : "Search shift name or time..."
              }
            />
          </div>

          <Button variant="secondary" onClick={clearFilters}>
            Clear Filters
          </Button>
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
        title={selectedRecord?.id ? "Edit Course" : "Add New Course"}
        onClose={() => {
          setCourseModalOpen(false);
          setSelectedRecord(null);
          resetCourseForm();
        }}
        size="md"
      >
        <form onSubmit={saveCourse}>
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
              onClick={() => {
                setCourseModalOpen(false);
                setSelectedRecord(null);
                resetCourseForm();
              }}
            >
              Cancel
            </Button>

            <Button type="submit" loading={savingCourse}>
              {selectedRecord?.id ? "Update Course" : "Save Course"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={shiftModalOpen}
        title={selectedRecord?.id ? "Edit Shift Timing" : "Add Shift Timing"}
        onClose={() => {
          setShiftModalOpen(false);
          setSelectedRecord(null);
          resetShiftForm();
        }}
        size="md"
      >
        <form onSubmit={saveShift}>
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
              onClick={() => {
                setShiftModalOpen(false);
                setSelectedRecord(null);
                resetShiftForm();
              }}
            >
              Cancel
            </Button>

            <Button type="submit" loading={savingShift}>
              {selectedRecord?.id ? "Update Shift" : "Save Shift"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={viewModalOpen}
        title={selectedType === "course" ? "Course Details" : "Shift Details"}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedRecord(null);
          setSelectedType("");
        }}
        size="md"
      >
        {selectedRecord && selectedType === "course" && (
          <div className="course-detail-grid">
            <div>
              <strong>Course Name:</strong>
              <p>{selectedRecord.course_name || "-"}</p>
            </div>

            <div>
              <strong>Course Code:</strong>
              <p>{selectedRecord.course_code || "-"}</p>
            </div>

            <div>
              <strong>Duration:</strong>
              <p>{selectedRecord.duration || "-"}</p>
            </div>

            <div>
              <strong>Fee:</strong>
              <p>{formatCurrency(selectedRecord.fee || 0)}</p>
            </div>

            <div>
              <strong>Status:</strong>
              <p>{selectedRecord.is_active ? "Active" : "Inactive"}</p>
            </div>

            <div>
              <strong>Description:</strong>
              <p>{selectedRecord.description || "-"}</p>
            </div>
          </div>
        )}

        {selectedRecord && selectedType === "shift" && (
          <div className="course-detail-grid">
            <div>
              <strong>Shift Name:</strong>
              <p>{selectedRecord.shift_name || "-"}</p>
            </div>

            <div>
              <strong>Start Time:</strong>
              <p>{selectedRecord.start_time || "-"}</p>
            </div>

            <div>
              <strong>End Time:</strong>
              <p>{selectedRecord.end_time || "-"}</p>
            </div>

            <div>
              <strong>Status:</strong>
              <p>{selectedRecord.is_active ? "Active" : "Inactive"}</p>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDeleteModal
        open={deleteModalOpen}
        title={selectedType === "course" ? "Delete Course" : "Delete Shift"}
        message={`Are you sure you want to delete ${
          selectedType === "course"
            ? selectedRecord?.course_name || "this course"
            : selectedRecord?.shift_name || "this shift"
        }?`}
        loading={deleting}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default Courses;