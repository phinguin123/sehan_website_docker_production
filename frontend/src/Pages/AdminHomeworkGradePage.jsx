import React, { useState, useEffect } from "react";
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
  CListGroup,
  CListGroupItem,
  CPagination,
  CPaginationItem,
  CAlert,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import {
  cilPencil,
  cilFile,
  cilCalendar,
  cilUser,
  cilBookmark,
  cilLevelUp,
  cilTag,
  cilPaperclip,
  cilTrash,
  cilCloudUpload,
  cilX,
} from "@coreui/icons";
import instance from "../apis/AxiosInterceptor";
import { jwtDecode } from "jwt-decode";
import { getCookie } from "../components/Cookie";

const types = ["Homework", "Exam"];
const teachers = ["Eve", "Adam", "Sarah", "John"]; // This should be fetched from the admin page in a real application

const initialHomeworks = [
  {
    id: 1,
    title: "Algebra Quiz",
    subject: "Math",
    student: "Adam",
    createdDate: "2023-10-26",
    submittedDate: "2023-10-28",
    grades: ["11"],
    levels: ["HL"],
    type: "Exam",
    gradedBy: "Eve",
    comment: "",
    fileUrl: "https://example.com/algebra-quiz.pdf",
  },
  {
    id: 2,
    title: "Physics Lab Report",
    subject: "Physics",
    student: "Sarah",
    createdDate: "2023-10-27",
    submittedDate: "2023-10-29",
    grades: ["12"],
    levels: ["SL", "HL"],
    type: "Homework",
    gradedBy: null,
    comment: "",
    fileUrl: "https://example.com/physics-lab.pdf",
  },
  {
    id: 3,
    title: "English Essay",
    subject: "English",
    student: "John",
    createdDate: "2023-10-25",
    submittedDate: "2023-10-27",
    grades: ["pre-IB"],
    levels: ["SL"],
    type: "Homework",
    gradedBy: "Adam",
    comment: "Good work, but needs improvement in structure.",
    fileUrl: "https://example.com/english-essay.pdf",
  },
];

const gradeBoundaries = [
  { min: 80, max: 100, score: 7 },
  { min: 70, max: 80, score: 6 },
  { min: 50, max: 70, score: 5 },
  { min: 40, max: 50, score: 4 },
  { min: 30, max: 40, score: 3 },
  { min: 20, max: 30, score: 2 },
  { min: 0, max: 20, score: 1 },
];

export default function AdminHomeworkGradePage() {
  const [pendingHomeworks, setPendingHomeworks] = useState([]);
  const [gradedHomeworks, setGradedHomeworks] = useState([]);
  const [filters, setFilters] = useState({
    sortBy: "submittedDate",
    sortOrder: "desc",
    subject_id: "",
    grade_id: "",
    level_id: "",
    type: "",
    gradedBy: "",
    studentName: "",
  });
  const [currentUser, setCurrentUser] = useState("");
  const [comment, setComment] = useState("");
  const [selectedHomework, setSelectedHomework] = useState(null); // Update 1: Added selectedHomework state
  const [rawScore, setRawScore] = useState("");
  const [totalScore, setTotalScore] = useState("");
  const [calculatedScore, setCalculatedScore] = useState(0);
  const [activeTab, setActiveTab] = useState("graded");
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    show: false,
    id: null,
  });
  const [studentNames, setStudentNames] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingCurrentPage, setPendingCurrentPage] = useState(1);
  const [gradedCurrentPage, setGradedCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pendingTotalPages, setPendingTotalPages] = useState(0);
  const [gradedTotalPages, setGradedTotalPages] = useState(0);
  const [gradedMatchingCounts, setGradedMatchingCounts] = useState(0);
  const [pendingMatchingCounts, setPendingMatchingCounts] = useState(0);
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);
  const [levels, setLevels] = useState([]);

  // States for PDF upload functionality
  const [commentPdfFile, setCommentPdfFile] = useState(null);
  const [commentPdfPreview, setCommentPdfPreview] = useState(null);
  // const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
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
    // fetchGradedHomework(currentPage); // Call the async function
    // fetchPendingHomework(currentPage);
    fetchStudentNames();
    fetchReferenceData();
  }, []);

  useEffect(() => {
    if (activeTab === "graded") {
      fetchGradedHomework(gradedCurrentPage);
    } else if (activeTab === "pending") {
      fetchPendingHomework(pendingCurrentPage);
    }
  }, [activeTab, gradedCurrentPage, pendingCurrentPage]);

  const fetchStudentNames = async (page = 1) => {
    try {
      const response = await instance.get("/api/student/getAllNames", {
        withCredentials: true,
      });
      console.log("received student names response:", response.data);

      const updatedStudentNamesList = response.data.map((studentName) => {
        // Create a new object with formatted date
        return {
          ...studentName,
          id: studentName.student_id,
          name: studentName.duplicate
            ? `${studentName.name}${studentName.duplicate}`
            : studentName.name,
        };
      });
      setStudentNames(updatedStudentNamesList);
    } catch (error) {
      console.error("Error fetching student names:", error);
    }
  };

  const fetchPendingHomework = async (page = 1, pageSize = 10) => {
    console.log("filters", filters);
    try {
      const response = await instance.get("/api/get-submitted-homework", {
        params: {
          subject_id: filters.subject_id,
          grade_id: filters.grade_id,
          level_id: filters.level_id,
          type: filters.type,
          graded_by: filters.gradedBy,
          searchQuery: searchQuery,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
          page: page,
          itemsPerPage: 50,
          graded_status: "pending",
        },
        withCredentials: true,
      });

      const { data, totalPages, totalCount } = response.data;
      console.log("received homework response:", data);
      setPendingMatchingCounts(totalCount);

      const updatedHomeworkList = data.map((homework) => {
        // Create a new object with formatted date
        return {
          ...homework,
          submittedDate: new Date(homework.submission_date)
            .toISOString()
            .replace("T", " ")
            .slice(0, 19) // Keeps the date and time part, removing the milliseconds and 'Z'
            .split("-")
            .join("/")
            .replace(" ", " "),
          dueDate: new Date(homework.dueDate)
            .toLocaleDateString("en-CA", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })
            .split("-")
            .join("/"),
          assignedDate: new Date(homework.assignedDate)
            .toLocaleDateString("en-CA", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })
            .split("-")
            .join("/"),
          gradedBy: homework.graded_by,
          text_attachment: homework.text_attachment,
          raw_score: homework.raw_score,
          total_score: homework.total_score,
          studentName: homework.student_name,
        };
      });
      console.log("updatred homeowkr", updatedHomeworkList);
      console.log("total pages", totalPages);
      setPendingHomeworks(updatedHomeworkList);
      setPendingTotalPages(totalPages); // Update state with total pages
      setPendingCurrentPage(page); // Update state with current page
    } catch (error) {
      console.error("Error fetching homework:", error);
    }
  };

  const fetchGradedHomework = async (page = 1, pageSize = 10) => {
    console.log("filters", filters);
    try {
      const response = await instance.get("/api/get-submitted-homework", {
        params: {
          subject_id: filters.subject_id,
          grade_id: filters.grade_id,
          level_id: filters.level_id,
          type: filters.type,
          graded_by: filters.gradedBy,
          searchQuery: searchQuery,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
          page: page,
          itemsPerPage: 50,
          graded_status: "graded",
        },
        withCredentials: true,
      });

      const { data, totalPages, totalCount } = response.data;
      console.log("received homework response:", data);
      console.log("totla count received", totalCount);
      setGradedMatchingCounts(totalCount);

      const updatedHomeworkList = data.map((homework) => {
        // Create a new object with formatted date
        return {
          ...homework,
          submittedDate: new Date(homework.submission_date)
            .toISOString()
            .replace("T", " ")
            .slice(0, 19) // Keeps the date and time part, removing the milliseconds and 'Z'
            .split("-")
            .join("/")
            .replace(" ", " "),
          dueDate: new Date(homework.dueDate)
            .toLocaleDateString("en-CA", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })
            .split("-")
            .join("/"),
          assignedDate: new Date(homework.assignedDate)
            .toLocaleDateString("en-CA", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })
            .split("-")
            .join("/"),
          gradedBy: homework.graded_by,
          text_attachment: homework.text_attachment,
          raw_score: homework.raw_score,
          total_score: homework.total_score,
          studentName: homework.student_name,
        };
      });
      console.log("updatred homeowkr", updatedHomeworkList);
      console.log("total pages", totalPages);
      setGradedHomeworks(updatedHomeworkList);
      setGradedTotalPages(totalPages); // Update state with total pages
      setGradedCurrentPage(page); // Update state with current page
    } catch (error) {
      console.error("Error fetching homework:", error);
    }
  };

  const handleDelete = (id) => {
    setDeleteConfirmation({ show: true, id });
  };

  // const handlePageChange = (page) => {
  //   setCurrentPage(page);
  //   fetchHomework(page);
  // };

  const confirmDelete = async () => {
    if (deleteConfirmation.id) {
      try {
        await instance.delete(
          `${import.meta.env.VITE_API_BASE_URL}/api/homework-submission/delete`,
          {
            headers: { "Content-Type": "application/json" },
            data: { submission_id: deleteConfirmation.id },
          }
        );
        setGradedHomeworks((prev) =>
          prev.filter((hw) => hw.id !== deleteConfirmation.id)
        );
        setPendingHomeworks((prev) =>
          prev.filter((hw) => hw.id !== deleteConfirmation.id)
        );
        window.alert("Homework submission deleted successfully.");
      } catch (error) {
        console.error("Error deleting homework submission:", error);
        window.alert("There was an error deleting the homework submission.");
      } finally {
        setDeleteConfirmation({ show: false, id: null });
      }
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ show: false, id: null });
  };

  const handleFilterChange = (name, value) => {
    console.log("inside handle filter", name, value);
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      sortBy: "submittedDate",
      sortOrder: "desc",
      subject_id: "",
      grade_id: "",
      level_id: "",
      type: "",
      gradedBy: "",
      studentName: "",
    });
  };

  const submitFilters = () => {
    if (activeTab == "graded") {
      fetchGradedHomework();
    } else {
      fetchPendingHomework();
    }
  };

  const handleCommentChange = (e) => {
    setComment(e.target.value);
  };

  const handleFileClick = (filename) => {
    const url = `${import.meta.env.VITE_API_BASE_URL}/api/files/${filename}`;
    window.open(url, "_blank");
  };

  // const filteredAndSortedHomeworks = homeworks
  // .filter(hw =>
  //   (!filters.subject || hw.subject.toLowerCase() === filters.subject.toLowerCase()) &&
  //   (!filters.grade ||
  //     (hw.grades.length === 1 && hw.grades[0] === filters.grade) ||
  //     (filters.grade === '11+12' && hw.grades.length === 2 && hw.grades.includes('11') && hw.grades.includes('12'))
  //   ) &&
  //   (!filters.level ||
  //     (hw.levels.length === 1 && hw.levels[0] === filters.level) ||
  //     (filters.level === 'SL+HL' && hw.levels.length === 2 && hw.levels.includes('SL') && hw.levels.includes('HL'))
  //   ) &&
  //   (!filters.type || hw.type === filters.type) &&
  //   (!filters.gradedBy || hw.gradedBy === filters.gradedBy) &&
  //   (!filters.studentName || hw.studentName === filters.studentName) &&
  //   (!searchQuery ||
  //     hw.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //     hw.gradedBy?.toLowerCase().includes(searchQuery.toLowerCase())
  //   )
  // )
  // .sort((a, b) => {
  //   const dateA = new Date(a[filters.sortBy])
  //   const dateB = new Date(b[filters.sortBy])
  //   return filters.sortOrder === 'asc' ? dateA - dateB : dateB - dateA
  // })

  const handleHomeworkClick = (homework) => {
    setSelectedHomework(homework);
    setComment(homework.comment || "");
    setRawScore(homework.raw_score || "");
    setTotalScore(homework.total_score || "");
    const newCalculatedScore = calculateScore(
      homework.raw_score,
      homework.total_score
    );

    // Reset PDF upload states when opening a new homework
    setCommentPdfFile(null);
    setCommentPdfPreview(null);
    setUploadError("");
    // setUploadProgress(0);
  };

  // New function to handle PDF file selection
  const handlePdfFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (file.type !== "application/pdf") {
        setUploadError("Please select a PDF file only.");
        return;
      }

      // Validate file size (e.g., max 10MB)
      const maxSize = 100 * 1024 * 1024; // 100MB in bytes
      if (file.size > maxSize) {
        setUploadError("File size must be less than 100MB.");
        return;
      }

      setCommentPdfFile(file);
      setCommentPdfPreview({
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + " MB",
      });
      setUploadError("");
    }
  };

  // Function to remove selected PDF
  const removePdfFile = () => {
    setCommentPdfFile(null);
    setCommentPdfPreview(null);
    setUploadError("");
    // setUploadProgress(0);
    // Reset the file input
    const fileInput = document.getElementById("commentPdfInput");
    if (fileInput) {
      fileInput.value = "";
    }
  };

  // Function to upload PDF file
  // const uploadPdfFile = async (submittedHomeworkId) => {
  //   if (!commentPdfFile) return null;

  //   const formData = new FormData();
  //   formData.append("pdf", commentPdfFile);
  //   formData.append("submitted_homework_id", submittedHomeworkId);

  //   try {
  //     setIsUploading(true);
  //     const response = await instance.post(
  //       "/api/upload-comment-pdf",
  //       formData,
  //       {
  //         headers: {
  //           "Content-Type": "multipart/form-data",
  //         },
  //         withCredentials: true,
  //         onUploadProgress: (progressEvent) => {
  //           const percentCompleted = Math.round(
  //             (progressEvent.loaded * 100) / progressEvent.total
  //           );
  //           setUploadProgress(percentCompleted);
  //         },
  //       }
  //     );

  //     return response.data.filename; // Return the uploaded filename
  //   } catch (error) {
  //     console.error("Error uploading PDF:", error);
  //     setUploadError("Failed to upload PDF file.");
  //     throw error;
  //   } finally {
  //     setIsUploading(false);
  //   }
  // };

  // const handleGradeSubmit = () => { // Update 4: Updated handleGradeSubmit
  //   if (selectedHomework) {
  //     const updatedHomeworks = homeworks.map(hw =>
  //       hw.id === selectedHomework.id
  //         ? { ...hw, comment: comment, gradedBy: currentUser }
  //         : hw
  //     )
  //     setHomeworks(updatedHomeworks)
  //     setSelectedHomework(null)
  //   }
  // }

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    setUploadError("");

    if (!rawScore || !totalScore) {
      setUploadError("Raw score and total score are required.");
      return;
    }

    const raw = parseFloat(rawScore);
    const total = parseFloat(totalScore);

    if (isNaN(raw) || isNaN(total)) {
      setUploadError("Scores must be valid numbers.");
      return;
    }

    if (raw > total) {
      setUploadError("Raw score cannot be greater than total score.");
      return;
    }

    try {
      // Create FormData to handle both regular data and file upload
      const formData = new FormData();
      formData.append("raw_score", rawScore);
      formData.append("total_score", totalScore);
      formData.append("marks", calculatedScore.toString());
      formData.append("comment", comment);

      // Add PDF file if selected
      if (commentPdfFile) {
        formData.append("teacher_comment_file", commentPdfFile);
      }

      const response = await instance.post(
        `/api/submissions/${selectedHomework["id"]}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status !== 200) {
        throw new Error("Failed to submit name");
      }
      console.log("graded");
      setSelectedHomework(null);

      // Reset PDF upload states
      setCommentPdfFile(null);
      setCommentPdfPreview(null);

      if (activeTab == "graded") {
        fetchGradedHomework(gradedCurrentPage);
      } else {
        fetchPendingHomework(pendingCurrentPage);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleRawScoreChange = (e) => {
    setRawScore(e.target.value);
    calculateScore(e.target.value, totalScore);
    console.log("selected homework", selectedHomework);
  };

  const handleTotalScoreChange = (e) => {
    setTotalScore(e.target.value);
    calculateScore(rawScore, e.target.value);
  };

  const calculateScore = (raw, total) => {
    if (raw && total) {
      const percentage = (parseFloat(raw) / parseFloat(total)) * 100;
      const score =
        gradeBoundaries.find(
          (boundary) => percentage >= boundary.min && percentage <= boundary.max
        )?.score || 0;
      console.log("score value", score);
      setCalculatedScore(score);
    } else {
      setCalculatedScore(0);
    }
  };

  const maxVisiblePages = 10; // Max pages to display in the pagination bar
  const currentTabPage =
    activeTab === "graded" ? gradedCurrentPage : pendingCurrentPage;
  const totalTabPages =
    activeTab === "graded" ? gradedTotalPages : pendingTotalPages;

  const startPage = Math.max(
    1,
    currentTabPage - Math.floor(maxVisiblePages / 2)
  );
  const endPage = Math.min(totalTabPages, startPage + maxVisiblePages - 1);

  const visiblePages = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  );

  return (
    <CContainer fluid>
      <CRow>
        <CCol xs={12} md={9}>
          <CCard className="mb-4">
            <CCardHeader>
              <CNav variant="tabs" role="tablist">
                <CNavItem>
                  <CNavLink
                    active={activeTab === "graded"}
                    onClick={() => setActiveTab("graded")}
                  >
                    Graded
                  </CNavLink>
                </CNavItem>
                <CNavItem>
                  <CNavLink
                    active={activeTab === "pending"}
                    onClick={() => setActiveTab("pending")}
                  >
                    Pending
                  </CNavLink>
                </CNavItem>
              </CNav>
            </CCardHeader>
            <CCardBody>
              <CTabContent>
                <CTabPane
                  role="tabpanel"
                  aria-labelledby="home-tab"
                  visible={activeTab === "graded"}
                >
                  {gradedHomeworks.map((homework) => (
                    <CCard
                      key={homework.id}
                      className="mb-2 cursor-pointer"
                      onClick={() => handleHomeworkClick(homework)}
                    >
                      <CCardBody style={{ padding: "10px 18px" }}>
                        <div className="d-flex justify-content-between align-items-center">
                          <h6>{homework.title}</h6>
                          <div>
                            <CButton
                              color="primary"
                              size="sm"
                              className="me-2"
                              disabled={!homework.teacher_comment_file_name}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFileClick(
                                  homework.teacher_comment_file_name
                                );
                              }}
                              style={{ "--cui-btn-font-size": "0.8rem" }}
                            >
                              <CIcon icon={cilFile} /> View Comment File
                            </CButton>
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
                              color="danger"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(homework.id);
                              }}
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
                            Student: {homework.student_name}
                            {homework.duplicate}
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
                            color={homework.type === "Exam" ? "danger" : "info"}
                            className="me-1"
                          >
                            Type: {homework.type}
                          </CBadge>
                          <CBadge
                            color={homework.gradedBy ? "success" : "secondary"}
                            className="me-1"
                          >
                            {homework.gradedBy
                              ? `Graded by: ${homework.gradedBy}`
                              : "Not graded"}
                          </CBadge>
                        </div>
                      </CCardBody>
                    </CCard>
                  ))}
                </CTabPane>
                <CTabPane
                  role="tabpanel"
                  aria-labelledby="profile-tab"
                  visible={activeTab === "pending"}
                >
                  {pendingHomeworks.map((homework) => (
                    <CCard
                      key={homework.id}
                      className="mb-2 cursor-pointer"
                      onClick={() => handleHomeworkClick(homework)}
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
                              color="danger"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(homework.id);
                              }}
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
                            Student: {homework.student_name}
                            {homework.duplicate}
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
                            color={homework.type === "Exam" ? "danger" : "info"}
                            className="me-1"
                          >
                            Type: {homework.type}
                          </CBadge>
                          <CBadge
                            color={homework.gradedBy ? "success" : "secondary"}
                            className="me-1"
                          >
                            {homework.gradedBy
                              ? `Graded by: ${homework.gradedBy}`
                              : "Not graded"}
                          </CBadge>
                        </div>
                      </CCardBody>
                    </CCard>
                  ))}
                </CTabPane>
              </CTabContent>
              <CPagination align="center" aria-label="Page navigation example">
                <CPaginationItem
                  disabled={
                    activeTab === "graded"
                      ? gradedCurrentPage === 1
                      : pendingCurrentPage === 1
                  }
                  onClick={() =>
                    activeTab === "graded"
                      ? setGradedCurrentPage(gradedCurrentPage - 1)
                      : setPendingCurrentPage(pendingCurrentPage - 1)
                  }
                >
                  Previous
                </CPaginationItem>
                {visiblePages.map((index) => (
                  <CPaginationItem
                    key={index}
                    active={
                      activeTab === "graded"
                        ? gradedCurrentPage === index
                        : pendingCurrentPage === index
                    }
                    onClick={() =>
                      activeTab === "graded"
                        ? setGradedCurrentPage(index)
                        : setPendingCurrentPage(index)
                    }
                  >
                    {index}
                  </CPaginationItem>
                ))}
                <CPaginationItem
                  disabled={
                    activeTab === "graded"
                      ? gradedCurrentPage === gradedTotalPages
                      : pendingCurrentPage === pendingTotalPages
                  }
                  onClick={() =>
                    activeTab === "graded"
                      ? setGradedCurrentPage(gradedCurrentPage + 1)
                      : setPendingCurrentPage(pendingCurrentPage + 1)
                  }
                >
                  Next
                </CPaginationItem>
                {/* <CPaginationItem onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                  Previous
                </CPaginationItem>
                {[...Array(totalPages).keys()].map((page) => (
                  <CPaginationItem key={page} onClick={() => handlePageChange(page + 1)}>
                    {page + 1}
                  </CPaginationItem>
                ))}
                <CPaginationItem onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                  Next
                </CPaginationItem> */}
              </CPagination>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol xs={12} md={3}>
          <CCard className="mb-4">
            <CCardHeader>
              <h5 className="mb-0">
                Filters (
                {activeTab === "graded"
                  ? gradedMatchingCounts
                  : pendingMatchingCounts}
                )
              </h5>
            </CCardHeader>
            <CCardBody>
              <CForm
                onSubmit={(e) => {
                  e.preventDefault();
                  submitFilters();
                }}
              >
                <div className="mb-3">
                  <CFormInput
                    type="text"
                    id="searchQuery"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="mb-2">
                  <CFormSelect
                    id="sortBy"
                    label="Sort By"
                    value={filters.sortBy}
                    onChange={(e) =>
                      handleFilterChange("sortBy", e.target.value)
                    }
                  >
                    <option value="submittedDate">Submitted Date</option>
                    <option value="dueDate">Due Date</option>
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
                    id="subject_id"
                    label="Subject"
                    value={filters.subject_id}
                    onChange={(e) =>
                      handleFilterChange("subject_id", e.target.value)
                    }
                  >
                    <option value="">All Subjects</option>
                    {subjects.map((sub) => (
                      <option key={sub.subject_id} value={sub.subject_id}>
                        {sub.subject_name}
                      </option>
                    ))}
                  </CFormSelect>
                </div>
                <div className="mb-2">
                  <CFormSelect
                    id="grade_id"
                    label="Grade"
                    value={filters.grade_id}
                    onChange={(e) =>
                      handleFilterChange("grade_id", e.target.value)
                    }
                  >
                    <option value="">All Grades</option>
                    {grades.map((g) => (
                      <option key={g.grade_id} value={g.grade_id}>
                        {g.grade_name}
                      </option>
                    ))}
                  </CFormSelect>
                </div>
                <div className="mb-2">
                  <CFormSelect
                    id="level_id"
                    label="Level"
                    value={filters.level}
                    onChange={(e) =>
                      handleFilterChange("level_id", e.target.value)
                    }
                  >
                    <option value="">All Levels</option>
                    {levels.map((l) => (
                      <option key={l.level_id} value={l.level_id}>
                        {l.level_name}
                      </option>
                    ))}
                  </CFormSelect>
                </div>
                <div className="mb-2">
                  <CFormSelect
                    id="type"
                    label="Type"
                    value={filters.type}
                    onChange={(e) => handleFilterChange("type", e.target.value)}
                  >
                    <option value="">All Types</option>
                    {types.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </CFormSelect>
                </div>
                {/* <div className="mb-2">
                  <CFormSelect
                    id="gradedBy"
                    label="Graded By"
                    value={filters.gradedBy}
                    onChange={(e) => handleFilterChange('gradedBy', e.target.value)}
                  >
                    <option value="">All Teachers</option>
                    {teachers.map(teacher => (
                      <option key={teacher} value={teacher}>{teacher}</option>
                    ))}
                  </CFormSelect>
                </div> */}
                {/* <div className="mb-2">
                  <CFormSelect
                    id="studentName"
                    label="Student Name"
                    value={filters.studentName}
                    onChange={(e) => handleFilterChange('studentName', e.target.value)}
                  >
                    <option value="">All Students</option>
                    {studentNames.map(studentName => (
                      <option key={studentName.id} value={studentName.name}>{studentName.name}</option>
                    ))}
                  </CFormSelect>
                </div> */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CButton
                    className="me-2"
                    color="danger"
                    onClick={resetFilters}
                  >
                    Reset
                  </CButton>
                  <CButton color="info" onClick={submitFilters}>
                    Submit
                  </CButton>
                </div>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CModal
        visible={selectedHomework !== null}
        onClose={() => setSelectedHomework(null)}
        size="xl"
      >
        <CModalHeader closeButton>
          <CModalTitle>{selectedHomework?.title}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {selectedHomework && (
            <CRow>
              <CCol lg={4}>
                <CCard>
                  <CCardHeader>
                    <h5 className="mb-0">Assignment Details</h5>
                  </CCardHeader>
                  <CCardBody>
                    <CListGroup flush>
                      <CListGroupItem className="d-flex justify-content-between align-items-center">
                        <div>
                          <CIcon icon={cilUser} className="me-2" />
                          Student
                        </div>
                        <span>{selectedHomework.student_name}</span>
                      </CListGroupItem>
                      <CListGroupItem className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <CIcon icon={cilCalendar} className="me-2" />
                          Submitted
                        </div>
                        <span className="text-end">
                          {selectedHomework.submittedDate}
                        </span>
                      </CListGroupItem>
                      <CListGroupItem className="d-flex justify-content-between align-items-center">
                        <div>
                          <CIcon icon={cilCalendar} className="me-2" />
                          Due
                        </div>
                        <span>{selectedHomework.dueDate}</span>
                      </CListGroupItem>
                      <CListGroupItem className="d-flex justify-content-between align-items-center">
                        <div>
                          <CIcon icon={cilBookmark} className="me-2" />
                          Subject
                        </div>
                        <span>{selectedHomework.subject_name}</span>
                      </CListGroupItem>
                      <CListGroupItem className="d-flex justify-content-between align-items-center">
                        <div>
                          <CIcon icon={cilLevelUp} className="me-2" />
                          Grade & Level
                        </div>
                        <span>
                          {selectedHomework.grade_name} -{" "}
                          {selectedHomework.level_name}
                        </span>
                      </CListGroupItem>
                      <CListGroupItem className="d-flex justify-content-between align-items-center">
                        <div>
                          <CIcon icon={cilTag} className="me-2" />
                          Type
                        </div>
                        <span>{selectedHomework.type}</span>
                      </CListGroupItem>
                    </CListGroup>
                  </CCardBody>
                </CCard>
                <CCard className="mt-3">
                  <CCardBody>
                    <CButton
                      color="primary"
                      className="w-100"
                      disabled={!selectedHomework.file_name}
                      onClick={() =>
                        handleFileClick(selectedHomework.file_name)
                      }
                    >
                      <CIcon icon={cilFile} className="me-2" /> View Submitted
                      File
                    </CButton>
                    {selectedHomework.text_attachment && (
                      <CCard>
                        <CCardHeader>
                          <h6 className="mb-0">
                            <CIcon icon={cilPaperclip} className="me-2" />
                            Text Attachment
                          </h6>
                        </CCardHeader>
                        <CCardBody>
                          <div
                            style={{ maxHeight: "200px", overflowY: "auto" }}
                          >
                            {selectedHomework.text_attachment === "null" ||
                            selectedHomework.text_attachment === "" || // Also check for empty string
                            selectedHomework.text_attachment === null || // Also check for actual null
                            selectedHomework.text_attachment === undefined ? ( // Also check for undefined
                              <p
                                style={{
                                  fontStyle: "italic", // Make it italic
                                  color: "#888", // Use a lighter gray color
                                  textAlign: "center", // Center the text
                                  padding: "20px", // Add some padding
                                }}
                              >
                                No text attachment available.
                              </p>
                            ) : (
                              selectedHomework.text_attachment
                            )}
                          </div>
                        </CCardBody>
                      </CCard>
                    )}
                  </CCardBody>
                </CCard>
              </CCol>
              <CCol lg={8}>
                <CCard>
                  <CCardHeader>
                    <h5 className="mb-0">Grading</h5>
                  </CCardHeader>
                  <CCardBody>
                    <div className="mb-3">
                      <strong>Graded By:</strong>{" "}
                      {selectedHomework.gradedBy || "Not graded yet"}
                    </div>
                    <div className="mb-3 d-flex align-items-center">
                      <CFormInput
                        type="number"
                        id="raw_score"
                        placeholder="Raw"
                        value={rawScore}
                        onChange={handleRawScoreChange}
                        style={{ width: "80px" }}
                      />
                      <span className="mx-2">/</span>
                      <CFormInput
                        type="number"
                        id="total_score"
                        placeholder="Total"
                        value={totalScore}
                        onChange={handleTotalScoreChange}
                        style={{ width: "80px" }}
                      />
                      <span className="ms-3">Score: {calculatedScore}/7</span>
                    </div>

                    {/* Error Alert */}
                    {uploadError && (
                      <CAlert color="danger" className="mb-3">
                        {uploadError}
                      </CAlert>
                    )}

                    <CFormTextarea
                      id="comment"
                      label="Grading Comment"
                      value={comment}
                      onChange={handleCommentChange}
                      rows={10}
                      style={{ minHeight: "300px" }}
                    />

                    {/* PDF Upload Section */}
                    <div className="mt-3">
                      <label className="form-label">
                        <CIcon icon={cilCloudUpload} className="me-2" />
                        Attach PDF Comment (Optional)
                      </label>

                      {!commentPdfPreview ? (
                        <div>
                          <CFormInput
                            type="file"
                            id="commentPdfInput"
                            accept=".pdf"
                            onChange={handlePdfFileChange}
                            className="mb-2"
                          />
                          <small className="text-muted">
                            Maximum file size: 100MB. PDF files only.
                          </small>
                        </div>
                      ) : (
                        <div className="border rounded p-3 bg-light">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <CIcon
                                icon={cilFile}
                                className="me-2 text-danger"
                              />
                              <strong>{commentPdfPreview.name}</strong>
                              <br />
                              <small className="text-muted">
                                Size: {commentPdfPreview.size}
                              </small>
                            </div>
                            <CButton
                              color="danger"
                              size="sm"
                              onClick={removePdfFile}
                              // disabled={isUploading}
                            >
                              <CIcon icon={cilX} />
                            </CButton>
                          </div>

                          {/* Upload Progress */}
                          {/* {isUploading && (
                            <div className="mt-2">
                              <div className="progress">
                                <div
                                  className="progress-bar"
                                  role="progressbar"
                                  style={{ width: `${uploadProgress}%` }}
                                  aria-valuenow={uploadProgress}
                                  aria-valuemin="0"
                                  aria-valuemax="100"
                                >
                                  {uploadProgress}%
                                </div>
                              </div>
                            </div>
                          )} */}
                        </div>
                      )}
                    </div>
                  </CCardBody>
                </CCard>
              </CCol>
            </CRow>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setSelectedHomework(null)}>
            Close
          </CButton>
          <CButton color="primary" onClick={handleGradeSubmit}>
            Submit Grade
          </CButton>
        </CModalFooter>
      </CModal>
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
