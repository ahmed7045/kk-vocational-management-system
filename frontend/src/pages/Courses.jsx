import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";

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
import {
  formatCurrency,
  getSelectedBranchId,
  getSelectedBranchName,
} from "../utils/formatters";

import "./courses.css";

const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true";

const formatTime12Hour = (time) => {
  if (!time) return "-";

  const [hourPart, minutePart] = String(time).split(":");
  let hour = Number(hourPart);
  const minute = minutePart || "00";

  if (Number.isNaN(hour)) return time;

  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;

  return `${String(hour).padStart(2, "0")}:${minute} ${period}`;
};

const Courses = () => {
  const branchId = getSelectedBranchId();
  const branchName = getSelectedBranchName();

  const [activeTab, setActiveTab] = useState("courses");

  const [courses, setCourses] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [teacherShifts, setTeacherShifts] = useState([]);

  const [allCourses, setAllCourses] = useState([]);
  const [allShifts, setAllShifts] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);

  const [filters, setFilters] = useState({
    search: "",
  });

  const [loading, setLoading] = useState(true);
  const [savingCourse, setSavingCourse] = useState(false);
  const [savingShift, setSavingShift] = useState(false);
  const [savingTeacher, setSavingTeacher] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [teacherModalOpen, setTeacherModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedType, setSelectedType] = useState("");

  const [error, setError] = useState("");

  const [courseForm, setCourseForm] = useState({
    courseName: "",
    duration: "",
    fee: "",
  });

  const [shiftForm, setShiftForm] = useState({
    courseId: "",
    shiftName: "",
    startTime: "",
    endTime: "",
  });

  const [teacherForm, setTeacherForm] = useState({
    teacherName: "",
    courseId: "",
    shiftId: "",
  });
  const applyFilters = (
    courseRecords = allCourses,
    shiftRecords = allShifts,
    teacherRecords = allTeachers,
    currentFilters = filters
  ) => {
    const searchText = currentFilters.search.toLowerCase().trim();

    if (!searchText) {
      setCourses(courseRecords);
      setShifts(shiftRecords);
      setTeachers(teacherRecords);
      return;
    }

    const filteredCourses = courseRecords.filter((course) =>
      [course.course_name, course.duration]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchText))
    );

    const filteredShifts = shiftRecords.filter((shift) =>
      [shift.shift_name, shift.start_time, shift.end_time]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchText))
    );

    const filteredTeachers = teacherRecords.filter((teacher) =>
      [teacher.teacher_name, teacher.course_name, teacher.shift_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchText))
    );

    setCourses(filteredCourses);
    setShifts(filteredShifts);
    setTeachers(filteredTeachers);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [coursesRes, shiftsRes, teachersRes] = await Promise.all([
        axiosInstance.get(`/courses?branchId=${branchId || ""}`),
        axiosInstance.get(`/shifts?branchId=${branchId || ""}`),
        axiosInstance.get(`/courses/teachers?branchId=${branchId || ""}`),
      ]);

      const courseData = coursesRes.data.data || [];
      const shiftData = shiftsRes.data.data || [];
      const teacherData = teachersRes.data.data || [];

      setAllCourses(courseData);
      setAllShifts(shiftData);
      setAllTeachers(teacherData);
      applyFilters(courseData, shiftData, teacherData);
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
  }, [filters.search, allCourses, allShifts, allTeachers]);

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

  const handleTeacherChange = (event) => {
    const { name, value } = event.target;

    setTeacherForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "courseId" ? { shiftId: "" } : {}),
    }));

    if (name === "courseId") {
      fetchTeacherShifts(value);
    }
  };

  const fetchTeacherShifts = async (courseId) => {
    if (!courseId) {
      setTeacherShifts([]);
      return;
    }

    try {
      const response = await axiosInstance.get(
        `/shifts?branchId=${branchId || ""}&courseId=${courseId}`
      );

      setTeacherShifts(response.data.data || []);
    } catch (error) {
      console.error("Teacher shift fetch error:", error.response?.data?.message);
    }
  };

  const resetCourseForm = () => {
    setCourseForm({
      courseName: "",
      duration: "",
      fee: "",
    });
  };

  const resetShiftForm = () => {
    setShiftForm({
      courseId: "",
      shiftName: "",
      startTime: "",
      endTime: "",
    });
  };

  const resetTeacherForm = () => {
    setTeacherForm({
      teacherName: "",
      courseId: "",
      shiftId: "",
    });
    setTeacherShifts([]);
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

  const openAddTeacherModal = () => {
    setSelectedRecord(null);
    resetTeacherForm();
    setTeacherModalOpen(true);
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
      duration: courseForm.duration,
      fee: Number(courseForm.fee || 0),
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
                duration: payload.duration,
                fee: payload.fee,
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
            duration: payload.duration,
            fee: payload.fee,
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
      courseId: Number(shiftForm.courseId),
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

  const saveTeacher = async (event) => {
    event.preventDefault();

    if (!branchId) {
      alert("Please select a branch first.");
      return;
    }

    const payload = {
      branchId: Number(branchId),
      teacherName: teacherForm.teacherName,
      courseId: Number(teacherForm.courseId),
      shiftId: Number(teacherForm.shiftId),
    };

    try {
      setSavingTeacher(true);

      if (selectedRecord?.id) {
        if (!isDemoMode) {
          await axiosInstance.put(`/courses/teachers/${selectedRecord.id}`, payload);
          await fetchData();
        }
      } else {
        if (!isDemoMode) {
          await axiosInstance.post("/courses/teachers", payload);
          await fetchData();
        }
      }

      setTeacherModalOpen(false);
      setSelectedRecord(null);
      resetTeacherForm();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save teacher");
    } finally {
      setSavingTeacher(false);
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

  const handleViewTeacher = (teacher) => {
    setSelectedType("teacher");
    setSelectedRecord(teacher);
    setViewModalOpen(true);
  };

  const handleEditCourse = (course) => {
    setSelectedRecord(course);

    setCourseForm({
      courseName: course.course_name || "",
      duration: course.duration || "",
      fee: course.fee || "",
    });

    setCourseModalOpen(true);
  };

  const handleEditShift = (shift) => {
    setSelectedRecord(shift);

    setShiftForm({
      courseId: shift.course_id || "",
      shiftName: shift.shift_name || "",
      startTime: shift.start_time || "",
      endTime: shift.end_time || "",
    });

    setShiftModalOpen(true);
  };

  const handleEditTeacher = (teacher) => {
    setSelectedRecord(teacher);

    setTeacherForm({
      teacherName: teacher.teacher_name || "",
      courseId: teacher.course_id || "",
      shiftId: teacher.shift_id || "",
    });

    fetchTeacherShifts(teacher.course_id);
    setTeacherModalOpen(true);
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
        applyFilters(updatedCourses, allShifts, allTeachers);
      }

      if (selectedType === "teacher") {
        if (!isDemoMode) {
          await axiosInstance.delete(`/courses/teachers/${selectedRecord.id}`);
        }

        const updatedTeachers = allTeachers.filter(
          (teacher) => teacher.id !== selectedRecord.id
        );

        setAllTeachers(updatedTeachers);
        applyFilters(allCourses, allShifts, updatedTeachers);
      }

      if (selectedType === "shift") {
        if (!isDemoMode) {
          await axiosInstance.delete(`/shifts/${selectedRecord.id}`);
        }

        const updatedShifts = allShifts.filter(
          (shift) => shift.id !== selectedRecord.id
        );

        setAllShifts(updatedShifts);
        applyFilters(allCourses, updatedShifts, allTeachers);
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
      render: (row) => <strong>{row.course_name}</strong>,
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
      render: (row) => formatTime12Hour(row.start_time),
    },
    {
      key: "end_time",
      title: "End Time",
      render: (row) => formatTime12Hour(row.end_time),
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

  const teacherColumns = [
    {
      key: "teacher_name",
      title: "Name",
      render: (row) => <strong>{row.teacher_name}</strong>,
    },
    {
      key: "course_name",
      title: "Course Name",
      render: (row) => row.course_name || "-",
    },
    {
      key: "shift_timing",
      title: "Shift Timing",
      render: (row) =>
        `${row.shift_name || "-"} (${formatTime12Hour(row.start_time)} - ${formatTime12Hour(row.end_time)})`,
    },
    {
      key: "actions",
      title: "Actions",
      render: (row) => (
        <ActionButtons
          onView={() => handleViewTeacher(row)}
          onEdit={() => handleEditTeacher(row)}
          onDelete={() => handleDeleteClick(row, "teacher")}
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
    <>
      <div className="page courses-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Courses & Shifts</h1>
            <p className="page-subtitle">
              Manage courses and class timings for {branchName || "selected branch"}.
            </p>
          </div>

          <div className="course-header-actions">
            {/* <Button variant="secondary" onClick={fetchData}>
            <RefreshCcw size={16} /> Refresh
          </Button> */}

            {activeTab === "courses" && (
              <Button onClick={openAddCourseModal}>
                <Plus size={16} /> Add Course
              </Button>
            )}

            {activeTab === "teachers" && (
              <Button onClick={openAddTeacherModal}>
                <Plus size={16} /> Add Teacher
              </Button>
            )}

            {activeTab === "shifts" && (
              <Button onClick={openAddShiftModal}>
                <Plus size={16} /> Add Shift
              </Button>
            )}
          </div>
        </div>



        <Card className="course-card">
          <div className="tabs">
            <div>
              <div className="course-search">
                <Search size={17} />
                <input
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder={
                    activeTab === "courses"
                      ? "Search course name, duration..."
                      : activeTab === "teachers"
                        ? "Search teacher, course or shift..."
                        : "Search shift name or time..."
                  }
                />
              </div>
            </div>

            <div>
              <button
                className={activeTab === "courses" ? "active" : ""}
                onClick={() => setActiveTab("courses")}
              >
                Courses
              </button>
              <button
                className={activeTab === "teachers" ? "active" : ""}
                onClick={() => setActiveTab("teachers")}
              >
                Teachers
              </button>
              <button
                className={activeTab === "shifts" ? "active" : ""}
                onClick={() => setActiveTab("shifts")}
              >
                Shift Timings
              </button>
            </div>
          </div>


          {error && <div className="courses-error">{error}</div>}

          {activeTab === "courses" && (
            <Table
              columns={courseColumns}
              data={courses}
              emptyText="No courses found"
            />
          )}

          {activeTab === "teachers" && (
            <Table
              columns={teacherColumns}
              data={teachers}
              emptyText="No teachers found"
            />
          )}

          {activeTab === "shifts" && (
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
            <Select
              label="Course"
              name="courseId"
              value={shiftForm.courseId}
              onChange={handleShiftChange}
              placeholder="Select Course"
              options={allCourses.map((course) => ({
                label: course.course_name,
                value: course.id,
              }))}
              required
            />
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
          open={teacherModalOpen}
          title={selectedRecord?.id ? "Edit Teacher" : "Add Teacher"}
          onClose={() => {
            setTeacherModalOpen(false);
            setSelectedRecord(null);
            resetTeacherForm();
          }}
          size="md"
        >
          <form onSubmit={saveTeacher}>
            <Input
              label="Teacher Name"
              name="teacherName"
              value={teacherForm.teacherName}
              onChange={handleTeacherChange}
              placeholder="e.g. Ahmed Ali"
              required
            />

            <Select
              label="Course"
              name="courseId"
              value={teacherForm.courseId}
              onChange={handleTeacherChange}
              placeholder="Select Course"
              options={allCourses.map((course) => ({
                label: course.course_name,
                value: course.id,
              }))}
              required
            />

            <Select
              label="Shift Timing"
              name="shiftId"
              value={teacherForm.shiftId}
              onChange={handleTeacherChange}
              placeholder={teacherForm.courseId ? "Select Shift" : "Select course first"}
              options={teacherShifts.map((shift) => ({
                label: `${shift.shift_name} (${formatTime12Hour(shift.start_time)} - ${formatTime12Hour(shift.end_time)})`,
                value: shift.id,
              }))}
              disabled={!teacherForm.courseId}
              required
            />

            <div className="modal-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setTeacherModalOpen(false);
                  setSelectedRecord(null);
                  resetTeacherForm();
                }}
              >
                Cancel
              </Button>

              <Button type="submit" loading={savingTeacher}>
                {selectedRecord?.id ? "Update Teacher" : "Save Teacher"}
              </Button>
            </div>
          </form>
        </Modal>

        <Modal
          open={viewModalOpen}
          title={
            selectedType === "course"
              ? "Course Details"
              : selectedType === "teacher"
                ? "Teacher Details"
                : "Shift Details"
          }
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

          {selectedRecord && selectedType === "teacher" && (
            <div className="course-detail-grid">
              <div>
                <strong>Teacher Name:</strong>
                <p>{selectedRecord.teacher_name || "-"}</p>
              </div>

              <div>
                <strong>Course Name:</strong>
                <p>{selectedRecord.course_name || "-"}</p>
              </div>

              <div>
                <strong>Shift:</strong>
                <p>{selectedRecord.shift_name || "-"}</p>
              </div>

              <div>
                <strong>Timing:</strong>
                <p>
                  {formatTime12Hour(selectedRecord.start_time)} -{" "}
                  {formatTime12Hour(selectedRecord.end_time)}
                </p>
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
                <p>{formatTime12Hour(selectedRecord.start_time)}</p>
              </div>

              <div>
                <strong>End Time:</strong>
                <p>{formatTime12Hour(selectedRecord.end_time)}</p>
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
          title={
            selectedType === "course"
              ? "Delete Course"
              : selectedType === "teacher"
                ? "Delete Teacher"
                : "Delete Shift"
          }
          message={`Are you sure you want to delete ${selectedType === "course"
            ? selectedRecord?.course_name || "this course"
            : selectedType === "teacher"
              ? selectedRecord?.teacher_name || "this teacher"
              : selectedRecord?.shift_name || "this shift"
            }?`}
          loading={deleting}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={confirmDelete}
        />
      </div>
    </>
  );
};

export default Courses;