import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CButton,
  CForm,
  CFormInput,
  CFormSelect,
  CFormTextarea,
  CBadge,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CContainer,
  CNav,
  CNavItem,
  CNavLink,
  CTabContent,
  CTabPane,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CFormCheck,
  CFormLabel,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilPencil, cilTrash, cilFilter, cilFile } from "@coreui/icons";
import instance from "../apis/AxiosInterceptor";

const subjects = [
  "Physics",
  "English A",
  "English B",
  "Math AA",
  "Math AI",
  "CompSci",
  "Economics",
  "Business",
  "Korean LL",
  "Korean Lit",
  "Biology",
  "Chemistry",
  "Pre-Math",
  "Pre-English",
];
const levels = ["SL", "HL"];
const grades = ["pre-IB", "11", "12"];
const types = ["Homework", "Exam"];

const initialHomeworks = [
  {
    id: 1,
    title: "9/20 Homework",
    subject: "Physics",
    createdDate: "2024-09-20",
    dueDate: "2024-10-27",
    grades: ["11"],
    levels: ["SL"],
    type: "Homework",
  },
  {
    id: 2,
    title: "9/22 Exam",
    subject: "Math",
    createdDate: "2023-09-22",
    dueDate: "2023-10-05",
    grades: ["12"],
    levels: ["HL"],
    type: "Exam",
  },
  {
    id: 3,
    title: "9/25 Homework",
    subject: "English",
    createdDate: "2023-09-25",
    dueDate: "2023-10-02",
    grades: ["11"],
    levels: ["SL"],
    type: "Homework",
  },
  {
    id: 4,
    title: "9/28 Physics Lab",
    subject: "Physics",
    createdDate: "2023-09-28",
    dueDate: "2023-10-05",
    grades: ["11"],
    levels: ["HL"],
    type: "Homework",
  },
  {
    id: 5,
    title: "10/1 Chemistry Quiz",
    subject: "Chemistry",
    createdDate: "2023-10-01",
    dueDate: "2023-10-08",
    grades: ["12"],
    levels: ["SL"],
    type: "Exam",
  },
  {
    id: 6,
    title: "10/3 Physics Problem Set",
    subject: "Physics",
    createdDate: "2023-10-03",
    dueDate: "2023-10-10",
    grades: ["11"],
    levels: ["SL"],
    type: "Homework",
  },
  {
    id: 7,
    title: "10/5 Chemistry Lab Report",
    subject: "Chemistry",
    createdDate: "2023-10-05",
    dueDate: "2023-10-12",
    grades: ["12"],
    levels: ["HL"],
    type: "Homework",
  },
  {
    id: 8,
    title: "10/8 Physics Midterm",
    subject: "Physics",
    createdDate: "2023-10-08",
    dueDate: "2023-10-15",
    grades: ["11"],
    levels: ["HL"],
    type: "Exam",
  },
  {
    id: 9,
    title: "10/10 Chemistry Worksheet",
    subject: "Chemistry",
    createdDate: "2023-10-10",
    dueDate: "2023-10-17",
    grades: ["12"],
    levels: ["SL"],
    type: "Homework",
  },
  {
    id: 10,
    title: "10/12 Physics Essay",
    subject: "Physics",
    createdDate: "2023-10-12",
    dueDate: "2023-10-19",
    grades: ["11"],
    levels: ["SL"],
    type: "Homework",
  },
  {
    id: 11,
    title: "10/15 Chemistry Presentation",
    subject: "Chemistry",
    createdDate: "2023-10-15",
    dueDate: "2023-10-22",
    grades: ["12"],
    levels: ["HL"],
    type: "Homework",
  },
  {
    id: 12,
    title: "10/18 Physics Quiz",
    subject: "Physics",
    createdDate: "2023-10-18",
    dueDate: "2023-10-25",
    grades: ["11"],
    levels: ["HL"],
    type: "Exam",
  },
  {
    id: 13,
    title: "10/20 Chemistry Problem Set",
    subject: "Chemistry",
    createdDate: "2023-10-20",
    dueDate: "2023-10-27",
    grades: ["12"],
    levels: ["SL"],
    type: "Homework",
  },
];

const getKSTDate = (daysToAdd = 0) => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const kst = new Date(utc + 9 * 60 * 60000 + daysToAdd * 24 * 60 * 60 * 1000);

  return kst.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

export default function AdminHomeworkCreatePage() {
  const [homeworks, setHomeworks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);
  const [levels, setLevels] = useState([]);
  const [activeTab, setActiveTab] = useState("list");
  const todayDate = getKSTDate().split("-").slice(1).join("/");
  const [newHomework, setNewHomework] = useState({
    title: `${todayDate} Homework`,
    subject_id: 1,
    assignedDate: getKSTDate(),
    dueDate: getKSTDate(7),
    description: "",
    grade_id: [1],
    level_id: [1],
    type: "Homework",
    file: "",
  });
  const [filters, setFilters] = useState({
    subject: "",
    sortBy: "dueDate",
    sortOrder: "dsc",
    grade: "",
    level: "",
    type: "",
  });
  const [editingHomework, setEditingHomework] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    show: false,
    id: null,
  });
  const [file, setFile] = useState("");
  const fileInputRef = useRef("");

  const fetchReferenceData = async () => {
    try {
      const response = await instance.get("/api/reference/");
      console.log("Received reference data response:", response.data);

      setSubjects(response.data.subjects);
      setGrades(response.data.grades);
      setLevels(response.data.levels);

      return response.data;
    } catch (error) {
      console.error("Error fetching reference data:", error);
      return [];
    }
  };

  useEffect(() => {
    fetchHomework();
    fetchReferenceData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log("Input change:", name, value);
    if (name === "grades" || name === "levels") {
      const array = Array.from(
        e.target.selectedOptions,
        (option) => option.value
      );
      setNewHomework((prev) => ({ ...prev, [name]: array }));
    } else {
      setNewHomework((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleFileClick = (filename) => {
    const url = `/api/api/files/${filename}`;
    window.open(url, "_blank");
  };

  const handleCheckboxChange = (e) => {
    const { name, value, checked } = e.target;
    console.log(name, value, checked);
    setNewHomework((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateHomework = async (event) => {
    event.preventDefault();

    const homeworkData = {
      ...newHomework,
    };

    console.log("homework data", homeworkData);

    const formData = new FormData();
    Object.keys(homeworkData).forEach((key) => {
      console.log("key", key, "value", homeworkData[key]);
      formData.append(key, homeworkData[key]);
    });

    if (file) {
      formData.append("file", file);
    }

    console.log("form data", formData);

    if (
      Object.values(formData).every((val) => val !== "") &&
      newHomework.assignedDate &&
      newHomework.assignedDate != "0000-00-00" &&
      newHomework.dueDate &&
      newHomework.dueDate != "0000-00-00" &&
      newHomework.subject_id &&
      newHomework.grade_id &&
      newHomework.level_id
    ) {
      // If editing homework
      if (editingHomework) {
        if (editingHomework.file_name) {
          formData.append("file_name", editingHomework.file_name);
        }
        try {
          const response = await instance.put(
            `/api/homework/${editingHomework.homework_id}`,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );
          setNewHomework({
            title: `${todayDate} Homework`,
            subject_id: "",
            assignedDate: getKSTDate(),
            dueDate: getKSTDate(7),
            description: "",
            grade_id: [1],
            level_id: [1],
            type: "Homework",
            file: "",
          });
          setActiveTab("list");
          setEditingHomework(null);
        } catch (error) {
          if (error.response) {
            alert(
              error.response.data.message || "An unexpected error occurred."
            );
          }
        }
        await fetchHomework();

        //setHomeworks(prev => prev.map(hw => hw.id === editingHomework.id ? { ...homeworkData, id: hw.id, createdDate: hw.createdDate } : hw))
      } else {
        // else creating homework
        try {
          const response = await instance.post("/api/homework/", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            withCredentials: true,
          });
          setNewHomework({
            title: `${todayDate} Homework`,
            subject_id: "",
            assignedDate: getKSTDate(),
            dueDate: getKSTDate(7),
            description: "",
            grade_id: [1],
            level_id: [1],
            type: "Homework",
            file: "",
          });
          setActiveTab("list");
          console.log("create homework response:", response.data);
        } catch (error) {
          if (error.response) {
            // Display the backend error message using alert
            alert(
              error.response.data.message || "An unexpected error occurred."
            );
          } else {
            // Handle client-side or network errors
            alert("Failed to connect to the server. Please try again.");
          }
        }
        await fetchHomework();
      }
    } else {
      alert("Please fill in all fields and select at least one grade or level");
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      subject_id: "",
      sortBy: "dueDate",
      sortOrder: "asc",
      grade_id: "",
      level_id: "",
      type: "",
    });
  };

  const handleEdit = (homework) => {
    console.log("homework to edit", homework);
    setEditingHomework(homework);
    setNewHomework(homework);
    setActiveTab("create");
    setFile("");
    fileInputRef.current.value = "";
  };

  const handleDelete = (id) => {
    setDeleteConfirmation({ show: true, id });
  };

  const confirmDelete = async () => {
    console.log(deleteConfirmation);
    if (deleteConfirmation.id) {
      console.log("deleting.........");
      try {
        await instance.delete(`/api/homework/${deleteConfirmation.id}`);
        setHomeworks((prev) =>
          prev.filter((hw) => hw.id !== deleteConfirmation.id)
        );
        alert("Homework deleted successfully.");
      } catch (error) {
        if (error.response.data.message) {
          alert(error.response.data.message);
        }
        console.error("Error deleting homework:", error);
      } finally {
        setDeleteConfirmation({ show: false, id: null });
        fetchHomework();
      }
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ show: false, id: null });
  };

  const filteredAndSortedHomeworks = useMemo(() => {
    return homeworks
      .filter(
        (hw) =>
          (!filters.subject_id ||
            String(hw.subject_id) === filters.subject_id) &&
          (!filters.grade_id || String(hw.grade_id) === filters.grade_id) &&
          (!filters.level_id || String(hw.level_id) === filters.level_id) &&
          (!filters.type || hw.type === filters.type)
      )
      .sort((a, b) => {
        const dateA = new Date(a[filters.sortBy]);
        const dateB = new Date(b[filters.sortBy]);
        return filters.sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      });
  }, [homeworks, filters]);

  // useEffect(() => {
  //   if (editingHomework) {
  //     setNewHomework(editingHomework)
  //   }
  // }, [editingHomework])

  // get homework data
  const fetchHomework = async () => {
    try {
      const response = await instance.get("/api/homework");
      console.log("received homework response:", response.data);

      const updatedHomeworkList = response.data.map((homework) => {
        // Create a new object with formatted date
        return {
          ...homework,
          createdDate: new Date(homework.created_at.split(" ")[0])
            .toISOString()
            .split("T")[0]
            .replace(/-/g, "-"),
          dueDate: new Date(homework.dueDate)
            .toISOString()
            .split("T")[0]
            .replace(/-/g, "-"),
          assignedDate: new Date(homework.assignedDate)
            .toISOString()
            .split("T")[0]
            .replace(/-/g, "-"),
        };
      });
      console.log("changed created date", updatedHomeworkList);
      setHomeworks(updatedHomeworkList);
    } catch (error) {
      if (error.response.data.message) {
        alert(error.response.data.message);
      }
      console.error("Error fetching homework:", error);
    }
  };

  const handleResetHomework = () => {
    setEditingHomework(null);
    setNewHomework({
      title: `${todayDate} Homework`,
      subject_id: "",
      assignedDate: getKSTDate(),
      dueDate: getKSTDate(7),
      description: "",
      grade_id: [1],
      level_id: [1],
      type: "Homework",
      file: "",
    });
    setActiveTab("list");
    console.log("resetting file name");
    setFile("");
    fileInputRef.current.value = "";
    console.log("file name", file);
  };

  return (
    <CContainer fluid>
      <CRow>
        <CCol xs={12} md={9}>
          <CCard className="mb-4">
            <CCardHeader>
              <CNav variant="tabs" role="tablist">
                <CNavItem>
                  <CNavLink
                    active={activeTab === "list"}
                    onClick={() => setActiveTab("list")}
                  >
                    Homework List
                  </CNavLink>
                </CNavItem>
                <CNavItem>
                  <CNavLink
                    active={activeTab === "create"}
                    onClick={() => setActiveTab("create")}
                  >
                    Create Homework
                  </CNavLink>
                </CNavItem>
              </CNav>
            </CCardHeader>
            <CCardBody>
              <CTabContent>
                <CTabPane
                  role="tabpanel"
                  aria-labelledby="home-tab"
                  visible={activeTab === "list"}
                >
                  {filteredAndSortedHomeworks.map((homework) => {
                    const isDue = new Date(homework.dueDate) < new Date();
                    return (
                      <div
                        key={homework.homework_id}
                        style={{ position: "relative" }}
                      >
                        {/* Overlay */}
                        {isDue && (
                          <div
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              backgroundColor: "rgba(128, 128, 128, 0.5)", // gray color with opacity
                              zIndex: 3, // ensure it covers content
                              pointerEvents: "none", // allow interactions to pass through
                              borderRadius: "0.375rem",
                            }}
                          />
                        )}

                        <CCard
                          key={homework.homework_id}
                          className={`mb-2 `}
                          style={{ position: "relative", zIndex: 2 }}
                        >
                          <CCardBody style={{ padding: "10px 18px" }}>
                            <div className="d-flex justify-content-between align-items-center">
                              <h6>{homework.title}</h6>
                              <div>
                                <CButton
                                  color="primary"
                                  size="sm"
                                  className="me-2"
                                  disabled={!homework.file_name}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFileClick(homework.file_name);
                                  }}
                                  style={{ "--cui-btn-font-size": "0.8rem" }}
                                >
                                  <CIcon icon={cilFile} /> View File
                                </CButton>
                                <CButton
                                  color="info"
                                  size="sm"
                                  className="me-2"
                                  onClick={() => handleEdit(homework)}
                                >
                                  <CIcon icon={cilPencil} />
                                </CButton>
                                <CButton
                                  color="danger"
                                  size="sm"
                                  onClick={() =>
                                    handleDelete(homework.homework_id)
                                  }
                                >
                                  <CIcon icon={cilTrash} />
                                </CButton>
                              </div>
                            </div>
                            <div>
                              <CBadge color="info" className="me-1">
                                Subject: {homework.subject_name}
                              </CBadge>
                              <CBadge color="secondary" className="me-1">
                                Created: {homework.createdDate}
                              </CBadge>
                              <CBadge color="success" className="me-1">
                                Assigned: {homework.assignedDate}
                              </CBadge>
                              <CBadge color="warning" className="me-1">
                                Due: {homework.dueDate}
                              </CBadge>
                              <CBadge color="dark" className="me-1">
                                Grade: {homework.grade_name}
                              </CBadge>
                              <CBadge color="primary" className="me-1">
                                Level: {homework.level_name}
                              </CBadge>
                              <CBadge
                                color={
                                  homework.type === "Homework"
                                    ? "success"
                                    : "danger"
                                }
                                className="me-1"
                              >
                                Type: {homework.type}
                              </CBadge>
                            </div>
                          </CCardBody>
                        </CCard>
                      </div>
                    );
                  })}
                </CTabPane>
                <CTabPane
                  role="tabpanel"
                  aria-labelledby="profile-tab"
                  visible={activeTab === "create"}
                >
                  <h4 className="mb-3">Create New Homework</h4>
                  <CForm>
                    <CRow>
                      <CCol md={6}>
                        <CFormInput
                          type="text"
                          id="title"
                          label="Title"
                          name="title"
                          value={newHomework.title}
                          onChange={handleInputChange}
                          className="mb-3"
                        />
                      </CCol>
                      <CCol md={6}>
                        <CFormSelect
                          id="subject"
                          label="Subject"
                          name="subject_id"
                          value={newHomework.subject_id}
                          onChange={handleInputChange}
                          className="mb-3"
                        >
                          <option value="">Select a subject</option>
                          {subjects.map((subject) => (
                            <option
                              key={subject.subject_id}
                              value={subject.subject_id}
                            >
                              {subject.subject_name}
                            </option>
                          ))}
                        </CFormSelect>
                      </CCol>
                    </CRow>
                    <CRow>
                      <CCol md={6}>
                        <CFormInput
                          type="date"
                          id="assignedDate"
                          label="Assigned Date"
                          name="assignedDate"
                          value={newHomework.assignedDate}
                          onChange={handleInputChange}
                          className="mb-3"
                        />
                      </CCol>
                      <CCol md={6}>
                        <CFormInput
                          type="date"
                          id="dueDate"
                          label="Due Date"
                          name="dueDate"
                          value={newHomework.dueDate}
                          onChange={handleInputChange}
                          className="mb-3"
                        />
                      </CCol>
                    </CRow>
                    <CRow>
                      <CCol md={6}>
                        <CFormSelect
                          key={newHomework.grade_id}
                          inline
                          id={`grade-${newHomework.grade_id}`}
                          label="Grade"
                          name="grade_id"
                          value={newHomework.grade_id}
                          onChange={handleInputChange}
                          className="mb-3"
                        >
                          {grades.map((g) => (
                            <option key={g.grade_id} value={g.grade_id}>
                              {g.grade_name}
                            </option>
                          ))}
                        </CFormSelect>
                      </CCol>
                      <CCol md={6}>
                        <CFormSelect
                          key={newHomework.level_id}
                          inline
                          id={`level-${newHomework.level_id}`}
                          label="Level"
                          name="level_id"
                          value={newHomework.level_id}
                          onChange={handleInputChange}
                          className="mb-3"
                        >
                          {levels.map((l) => (
                            <option key={l.level_id} value={l.level_id}>
                              {l.level_name}
                            </option>
                          ))}
                        </CFormSelect>
                      </CCol>
                    </CRow>
                    <CRow>
                      <CCol md={6}>
                        <CFormSelect
                          id="type"
                          label="Type"
                          name="type"
                          value={newHomework.type}
                          onChange={handleInputChange}
                          className="mb-3"
                        >
                          {types.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </CFormSelect>
                      </CCol>
                      <CCol md={4}>
                        <CFormInput
                          type="file"
                          id="file"
                          label="Upload File"
                          name="file"
                          onChange={handleFileChange}
                          className="mb-3"
                          ref={fileInputRef}
                        />
                      </CCol>
                    </CRow>
                    <CRow>
                      <CCol>
                        <div className="mb-3">
                          <span>Existing File: </span>
                          <span className="text-red-500">
                            {editingHomework?.file_name}
                          </span>
                        </div>
                      </CCol>
                    </CRow>
                    <CFormTextarea
                      id="description"
                      label="Description"
                      name="description"
                      value={newHomework.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="mb-3"
                    />
                    <CButton
                      color="primary"
                      onClick={handleCreateHomework}
                      className="me-2"
                    >
                      {editingHomework ? "Update Homework" : "Create Homework"}
                    </CButton>
                    {editingHomework && (
                      <CButton
                        color="secondary"
                        onClick={() => {
                          handleResetHomework();
                        }}
                      >
                        Cancel
                      </CButton>
                    )}
                  </CForm>
                </CTabPane>
              </CTabContent>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol xs={12} md={3}>
          <CCard className="mb-4">
            <CCardHeader>
              <h5 className="mb-0">Filters</h5>
            </CCardHeader>
            <CCardBody>
              <CForm>
                <div className="mb-2">
                  <CFormSelect
                    id="sortBy"
                    label="Sort By"
                    value={filters.sortBy}
                    onChange={(e) =>
                      handleFilterChange("sortBy", e.target.value)
                    }
                  >
                    <option value="dueDate">Due Date</option>
                    <option value="createdDate">Created Date</option>
                  </CFormSelect>
                </div>
                <div className="mb-2">
                  <CFormSelect
                    id="sortOrder"
                    label="Sort Order"
                    value={filters.sortOrder}
                    onChange={(e) =>
                      handleFilterChange("sortOrder", e.target.value)
                    }
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </CFormSelect>
                </div>
                <div className="mb-2">
                  <CFormSelect
                    id="subject"
                    label="Subject"
                    value={filters.subject_id}
                    onChange={(e) =>
                      handleFilterChange("subject_id", e.target.value)
                    }
                  >
                    <option value="">All Subjects</option>
                    {subjects.map((subject) => (
                      <option
                        key={subject.subject_id}
                        value={subject.subject_id}
                      >
                        {subject.subject_name}
                      </option>
                    ))}
                  </CFormSelect>
                </div>
                <div className="mb-2">
                  <CFormSelect
                    id="grade"
                    label="Grade"
                    value={filters.grade_id}
                    onChange={(e) =>
                      handleFilterChange("grade_id", e.target.value)
                    }
                  >
                    <option value="">All Grades</option>
                    {grades.map((grade) => (
                      <option key={grade.grade_id} value={grade.grade_id}>
                        {grade.grade_name}
                      </option>
                    ))}
                  </CFormSelect>
                </div>
                <div className="mb-2">
                  <CFormSelect
                    id="level"
                    label="Level"
                    value={filters.level_id}
                    onChange={(e) =>
                      handleFilterChange("level_id", e.target.value)
                    }
                  >
                    <option value="">All Levels</option>
                    {levels.map((level) => (
                      <option key={level.level_id} value={level.level_id}>
                        {level.level_name}
                      </option>
                    ))}
                  </CFormSelect>
                </div>
                <div className="mb-2">
                  <CFormSelect
                    id="type"
                    label="Type"
                    value={filters.type.toLowerCase()}
                    onChange={(e) => handleFilterChange("type", e.target.value)}
                  >
                    <option value="">All Types</option>
                    {types.map((type) => (
                      <option
                        key={type.toLowerCase()}
                        value={type.toLowerCase()}
                      >
                        {type}
                      </option>
                    ))}
                  </CFormSelect>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CButton color="danger" onClick={resetFilters}>
                    Reset
                  </CButton>
                </div>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
      <CModal visible={deleteConfirmation.show} onClose={cancelDelete}>
        <CModalHeader closeButton>
          <CModalTitle>Confirm Deletion</CModalTitle>
        </CModalHeader>
        <CModalBody>
          Are you sure you want to delete this homework assignment?
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={cancelDelete}>
            Cancel
          </CButton>
          <CButton color="danger" onClick={confirmDelete}>
            Delete
          </CButton>
        </CModalFooter>
      </CModal>
    </CContainer>
  );
}
