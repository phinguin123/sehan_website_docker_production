import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Trash2,
  UploadCloud,
  X,
  User,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Download,
  BookOpen,
  GraduationCap,
  Layers,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import instance from "@/apis/axiosInstance";

const types = ["Homework", "Exam"];

const gradeBoundaries = [
  { min: 80, max: 100, score: 7 },
  { min: 70, max: 80, score: 6 },
  { min: 50, max: 70, score: 5 },
  { min: 40, max: 50, score: 4 },
  { min: 30, max: 40, score: 3 },
  { min: 20, max: 30, score: 2 },
  { min: 0, max: 20, score: 1 },
];

// --- Helper for Badge Colors (Shared Style) ---
const getBadgeStyle = (type) => {
  switch (type) {
    case "Exam":
      return "bg-red-100 text-red-700 hover:bg-red-200 border-red-200";
    case "Homework":
      return "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200";
    case "Subject":
      return "bg-violet-100 text-violet-700 hover:bg-violet-200 border-violet-200";
    case "Level":
      return "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200";
    case "Grade":
      return "bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200";
    default:
      return "bg-slate-100 text-slate-700 hover:bg-slate-200";
  }
};

const formatDateDisplay = (dateString) => {
  if (!dateString || dateString === "N/A") return "-";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

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
  const [comment, setComment] = useState("");
  const [selectedHomework, setSelectedHomework] = useState(null);
  const [rawScore, setRawScore] = useState("");
  const [totalScore, setTotalScore] = useState("");
  const [calculatedScore, setCalculatedScore] = useState(0);
  const [activeTab, setActiveTab] = useState("graded");
  // NEW: Track the starting values to compare against
  const [initialValues, setInitialValues] = useState({
    raw: "",
    total: "",
    comment: "",
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    show: false,
    id: null,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingCurrentPage, setPendingCurrentPage] = useState(1);
  const [gradedCurrentPage, setGradedCurrentPage] = useState(1);
  const [pendingTotalPages, setPendingTotalPages] = useState(0);
  const [gradedTotalPages, setGradedTotalPages] = useState(0);
  const [gradedMatchingCounts, setGradedMatchingCounts] = useState(0);
  const [pendingMatchingCounts, setPendingMatchingCounts] = useState(0);
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);
  const [levels, setLevels] = useState([]);

  // PDF upload
  const [commentPdfFile, setCommentPdfFile] = useState(null);
  const [commentPdfPreview, setCommentPdfPreview] = useState(null);
  const [uploadError, setUploadError] = useState("");

  const getBackendSortKey = (key) => {
    const map = {
      submittedDate: "submission_date",
      dueDate: "due_date",
      assignedDate: "assigned_date",
    };
    return map[key] || key;
  };

  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const response = await instance.get("/api/reference/");
        setSubjects(response.data.subjects);
        setGrades(response.data.grades);
        setLevels(response.data.levels);
      } catch (error) {
        console.error("Error fetching reference data:", error);
      }
    };
    fetchReferenceData();
  }, []);

  useEffect(() => {
    if (activeTab === "graded") {
      fetchGradedHomework(gradedCurrentPage);
    } else if (activeTab === "pending") {
      fetchPendingHomework(pendingCurrentPage);
    }
  }, [activeTab, gradedCurrentPage, pendingCurrentPage]);

  const fetchPendingHomework = async (page = 1) => {
    try {
      const response = await instance.get("/api/submissions/", {
        params: {
          subject_id: filters.subject_id,
          grade_id: filters.grade_id,
          level_id: filters.level_id,
          type: filters.type,
          graded_by: filters.gradedBy,
          searchQuery: searchQuery,
          sortBy: getBackendSortKey(filters.sortBy),
          sortOrder: filters.sortOrder,
          page: page,
          itemsPerPage: 50,
          graded_status: "pending",
        },
        withCredentials: true,
      });

      const { data, totalPages, totalCount } = response.data;
      setPendingMatchingCounts(totalCount);
      setPendingHomeworks(processHomeworkData(data));
      setPendingTotalPages(totalPages);
      setPendingCurrentPage(page);
    } catch (error) {
      console.error("Error fetching pending homework:", error);
    }
  };

  const fetchGradedHomework = async (page = 1) => {
    try {
      const response = await instance.get("/api/submissions/", {
        params: {
          subject_id: filters.subject_id,
          grade_id: filters.grade_id,
          level_id: filters.level_id,
          type: filters.type,
          graded_by: filters.gradedBy,
          searchQuery: searchQuery,
          sortBy: getBackendSortKey(filters.sortBy),
          sortOrder: filters.sortOrder,
          page: page,
          itemsPerPage: 50,
          graded_status: "graded",
        },
        withCredentials: true,
      });

      const { data, totalPages, totalCount } = response.data;
      setGradedMatchingCounts(totalCount);
      setGradedHomeworks(processHomeworkData(data));
      setGradedTotalPages(totalPages);
      setGradedCurrentPage(page);
    } catch (error) {
      console.error("Error fetching graded homework:", error);
    }
  };

  const processHomeworkData = (data) => {
    return data.map((homework) => ({
      ...homework,
      submittedDate: homework.submission_date
        ? new Date(homework.submission_date)
            .toISOString()
            .replace("T", " ")
            .slice(0, 19)
            .split("-")
            .join("/")
        : "N/A",
      dueDate: homework.dueDate
        ? new Date(homework.dueDate).toLocaleDateString("en-CA").split("-").join("/")
        : homework.due_date
        ? new Date(homework.due_date).toLocaleDateString("en-CA").split("-").join("/")
        : "N/A",
      assignedDate: homework.assignedDate
        ? new Date(homework.assignedDate).toLocaleDateString("en-CA").split("-").join("/")
        : homework.assigned_date
        ? new Date(homework.assigned_date).toLocaleDateString("en-CA").split("-").join("/")
        : "N/A",
      gradedBy: homework.graded_by,
      studentName: homework.student_name,
    }));
  };

  const handleDelete = (id) => {
    setDeleteConfirmation({ show: true, id });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.id) return;
    try {
      await instance.delete(`/api/submissions/${deleteConfirmation.id}`);
      setGradedHomeworks((prev) => prev.filter((hw) => hw.id !== deleteConfirmation.id));
      setPendingHomeworks((prev) => prev.filter((hw) => hw.id !== deleteConfirmation.id));
      
      if (activeTab === "graded") fetchGradedHomework(gradedCurrentPage);
      else fetchPendingHomework(pendingCurrentPage);
    } catch (error) {
      console.error("Error deleting homework submission:", error);
      alert(error.response?.data?.message || "Error deleting submission.");
    } finally {
      setDeleteConfirmation({ show: false, id: null });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ show: false, id: null });
  };

  const handleFilterChange = (name, value) => {
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
    setSearchQuery("");
  };

  const submitFilters = () => {
    if (activeTab === "graded") fetchGradedHomework(1);
    else fetchPendingHomework(1);
  };

  const handleCommentChange = (e) => setComment(e.target.value);

  const handleFileClick = (filename) => {
    if (!filename) return;
    const encodedFilename = encodeURIComponent(filename);
    const url = `${window.location.origin}/api/files/?file=${encodedFilename}`;
    window.open(url, "_blank");
  };

  const handleHomeworkClick = (homework) => {
    setSelectedHomework(homework);
    const initialComment = homework.comment || "";
    const initialRaw = homework.raw_score || "";
    const initialTotal = homework.total_score || "";

    setComment(initialComment);
    setRawScore(initialRaw);
    setTotalScore(initialTotal);
    calculateScore(initialRaw, initialTotal);

    // Reset the PDF file upload
    setCommentPdfFile(null);
    setCommentPdfPreview(null);
    setUploadError("");

    // NEW: Save the snapshot
    setInitialValues({
      raw: initialRaw,
      total: initialTotal,
      comment: initialComment,
    });
  };

  // NEW: Check if form is dirty and handle closing
  const handleSafeClose = (e) => {
    // 1. Check if values have changed
    const isDirty = 
      rawScore !== initialValues.raw ||
      totalScore !== initialValues.total ||
      comment !== initialValues.comment ||
      commentPdfFile !== null; // A new file always counts as a change

    if (isDirty) {
      // 2. If triggered by an event (like clicking background), prevent the default close
      if (e) e.preventDefault();

      // 3. Ask for confirmation
      const confirmDiscard = window.confirm(
        "You have unsaved changes. Are you sure you want to discard them?"
      );

      // 4. If they confirm, close. If they cancel, do nothing (stay open).
      if (confirmDiscard) {
        setSelectedHomework(null);
      }
    } else {
      // Not dirty? Just close immediately.
      setSelectedHomework(null);
    }
  };

  const handlePdfFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setUploadError("Please select a PDF file only.");
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
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

  const removePdfFile = () => {
    setCommentPdfFile(null);
    setCommentPdfPreview(null);
    setUploadError("");
    const fileInput = document.getElementById("commentPdfInput");
    if (fileInput) fileInput.value = "";
  };

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
      const formData = new FormData();
      formData.append("raw_score", rawScore);
      formData.append("total_score", totalScore);
      formData.append("marks", calculatedScore.toString());
      formData.append("comment", comment);
      if (commentPdfFile) {
        formData.append("teacher_comment_file", commentPdfFile);
      }

      await instance.put(`/api/submissions/${selectedHomework["id"]}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSelectedHomework(null);
      setCommentPdfFile(null);
      setCommentPdfPreview(null);

      if (activeTab === "graded") fetchGradedHomework(gradedCurrentPage);
      else fetchPendingHomework(pendingCurrentPage);
    } catch (error) {
      setUploadError(error.response?.data?.message || "Failed to submit grade.");
    }
  };

  const handleRawScoreChange = (e) => {
    setRawScore(e.target.value);
    calculateScore(e.target.value, totalScore);
  };

  const handleTotalScoreChange = (e) => {
    setTotalScore(e.target.value);
    calculateScore(rawScore, e.target.value);
  };

  const calculateScore = (raw, total) => {
    if (raw && total) {
      const percentage = (parseFloat(raw) / parseFloat(total)) * 100;
      const score = gradeBoundaries.find(
          (boundary) => percentage >= boundary.min && percentage <= boundary.max
        )?.score || 0;
      setCalculatedScore(score);
    } else {
      setCalculatedScore(0);
    }
  };

  const maxVisiblePages = 5;
  const currentTabPage = activeTab === "graded" ? gradedCurrentPage : pendingCurrentPage;
  const totalTabPages = activeTab === "graded" ? gradedTotalPages : pendingTotalPages;
  const startPage = Math.max(1, currentTabPage - Math.floor(maxVisiblePages / 2));
  const endPage = Math.min(totalTabPages, startPage + maxVisiblePages - 1);
  const visiblePages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  const HomeworkCard = ({ homework, isGraded }) => (
    <Card
      className={`group mb-3 cursor-pointer transition-all duration-200 hover:shadow-md border-l-4 ${
        isGraded ? "border-l-emerald-500" : "border-l-amber-500"
      }`}
      onClick={() => handleHomeworkClick(homework)}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex-1 space-y-3">
            {/* Header Badges */}
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant="outline" className={`${getBadgeStyle("Subject")} px-2 py-0.5 text-xs font-medium border`}>
                <BookOpen className="w-3 h-3 mr-1" />
                {homework.subject_name}
              </Badge>
              <Badge variant="outline" className={`${getBadgeStyle(homework.type)} px-2 py-0.5 text-xs font-medium border`}>
                {homework.type}
              </Badge>
              {homework.duplicate && (
                <Badge variant="destructive" className="px-2 py-0.5 text-xs">
                  <AlertCircle className="w-3 h-3 mr-1" /> Duplicate
                </Badge>
              )}
            </div>

            {/* Title & Student */}
            <div>
              <h3 className="text-lg font-bold text-slate-800 leading-tight mb-1">
                {homework.title}
              </h3>
              <div className="flex items-center text-sm text-slate-600">
                <User className="w-4 h-4 mr-1.5 text-slate-400" />
                <span className="font-medium">{homework.studentName}</span>
                <span className="mx-2 text-slate-300">|</span>
                <Badge variant="secondary" className="text-[10px] h-5 bg-slate-100 text-slate-600">
                   {homework.grade_name} - {homework.level_name}
                </Badge>
              </div>
            </div>

            {/* Dates */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 mt-1">
              <div className="flex items-center gap-1.5" title="Submitted Date">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Submitted: {formatDateDisplay(homework.submittedDate)}</span>
              </div>
              <div className="flex items-center gap-1.5" title="Due Date">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Due: {formatDateDisplay(homework.dueDate)}</span>
              </div>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex flex-row sm:flex-col gap-2 items-center sm:items-end justify-between min-w-[140px]">
             <div className="text-right">
                {homework.gradedBy ? (
                    <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none">
                        <CheckCircle className="w-3 h-3 mr-1" /> Graded
                    </Badge>
                ) : (
                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-none">
                        <Clock className="w-3 h-3 mr-1" /> Pending
                    </Badge>
                )}
                {homework.gradedBy && (
                    <div className="text-xs text-slate-400 mt-1">by {homework.gradedBy}</div>
                )}
             </div>

             <div className="flex gap-1 w-full sm:w-auto">
                 {homework.file_name && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                        onClick={(e) => { e.stopPropagation(); handleFileClick(homework.file_name); }}
                        title="Download Student File"
                    >
                        <Download className="h-4 w-4" />
                    </Button>
                 )}
                 <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-500 hover:text-red-600 hover:bg-red-50"
                    onClick={(e) => { e.stopPropagation(); handleDelete(homework.id); }}
                    title="Delete Submission"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
             </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 bg-slate-50/50 min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Content Area */}
        <div className="lg:col-span-9">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Submission Grading
                </h1>
                <p className="text-slate-500 text-sm">
                  Review student submissions and assign grades.
                </p>
              </div>
            </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-4">
              <TabsTrigger value="graded">Graded ({gradedMatchingCounts})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({pendingMatchingCounts})</TabsTrigger>
            </TabsList>

            <TabsContent value="graded" className="space-y-4">
              {gradedHomeworks.length === 0 && (
                 <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed">
                    <Layers className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No graded submissions found.</p>
                 </div>
              )}
              {gradedHomeworks.map((homework) => (
                <HomeworkCard key={homework.id} homework={homework} isGraded={true} />
              ))}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              {pendingHomeworks.length === 0 && (
                 <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed">
                    <Layers className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No pending submissions found.</p>
                 </div>
              )}
              {pendingHomeworks.map((homework) => (
                <HomeworkCard key={homework.id} homework={homework} isGraded={false} />
              ))}
            </TabsContent>

            {/* Pagination */}
            {totalTabPages > 1 && (
              <div className="flex justify-center items-center mt-8 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentTabPage === 1}
                  onClick={() => activeTab === "graded" ? setGradedCurrentPage(p => p - 1) : setPendingCurrentPage(p => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                {visiblePages.map((index) => (
                  <Button
                    key={index}
                    variant={currentTabPage === index ? "default" : "outline"}
                    size="sm"
                    className="w-9"
                    onClick={() => activeTab === "graded" ? setGradedCurrentPage(index) : setPendingCurrentPage(index)}
                  >
                    {index}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentTabPage >= totalTabPages}
                  onClick={() => activeTab === "graded" ? setGradedCurrentPage(p => p + 1) : setPendingCurrentPage(p => p + 1)}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </Tabs>
        </div>

        {/* Sticky Filters Sidebar */}
        <div className="lg:col-span-3">
          <div className="sticky top-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-4 h-4" /> Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); submitFilters(); }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="searchQuery" className="text-xs font-semibold text-slate-500 uppercase">
                    Search
                  </Label>
                  <div className="relative">
                    <Input
                      id="searchQuery"
                      placeholder="Student name or title..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10" 
                    />
                  </div>
                </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-500 uppercase">Sort By</Label>
                    <div className="grid grid-cols-2 gap-2">
                        <Select
                            value={filters.sortBy}
                            onValueChange={(value) => handleFilterChange("sortBy", value)}
                        >
                            <SelectTrigger> <SelectValue /> </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="submittedDate">Submitted</SelectItem>
                                <SelectItem value="dueDate">Due Date</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={filters.sortOrder}
                            onValueChange={(value) => handleFilterChange("sortOrder", value)}
                        >
                            <SelectTrigger> <SelectValue /> </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="asc">Asc</SelectItem>
                                <SelectItem value="desc">Desc</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-500 uppercase">Attributes</Label>
                    <Select
                      value={filters.subject_id || "all"}
                      onValueChange={(value) => handleFilterChange("subject_id", value === "all" ? "" : value)}
                    >
                      <SelectTrigger><SelectValue placeholder="All Subjects" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Subjects</SelectItem>
                        {subjects.map((sub) => (
                          <SelectItem key={sub.subject_id} value={String(sub.subject_id)}>{sub.subject_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={filters.grade_id || "all"}
                      onValueChange={(value) => handleFilterChange("grade_id", value === "all" ? "" : value)}
                    >
                      <SelectTrigger><SelectValue placeholder="All Grades" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Grades</SelectItem>
                        {grades.map((g) => (
                          <SelectItem key={g.grade_id} value={String(g.grade_id)}>{g.grade_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={filters.type || "all"}
                      onValueChange={(value) => handleFilterChange("type", value === "all" ? "" : value)}
                    >
                      <SelectTrigger><SelectValue placeholder="All Types" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {types.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={resetFilters}>
                      Reset
                    </Button>
                    <Button type="submit" className="flex-1 bg-slate-900 hover:bg-slate-800">
                      Apply
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Grading Dialog */}
      <Dialog
        open={selectedHomework !== null}
        onOpenChange={(open) => {
          if (!open) handleSafeClose();
        }}
      >
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 sm:rounded-xl shadow-2xl"
          onPointerDownOutside={(e) => handleSafeClose(e)}
          onEscapeKeyDown={(e) => handleSafeClose(e)}
        >
          {selectedHomework && (
            <>
              {/* HEADER */}
              <DialogHeader className="px-6 py-5 border-b border-slate-100 bg-white sticky top-0 z-10">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 text-xs font-medium text-slate-500 uppercase tracking-wide">
                      <span>{selectedHomework.subject_name}</span>
                      <span className="text-slate-300">•</span>
                      <span>{selectedHomework.type}</span>
                    </div>
                    <DialogTitle className="text-xl font-semibold text-slate-900 leading-none">
                      {selectedHomework.title}
                    </DialogTitle>
                  </div>
                  
                  {/* Student Badge */}
                  <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">
                      {selectedHomework.student_name}
                    </span>
                  </div>
                </div>
              </DialogHeader>

              <div className="p-6 bg-slate-50/50 min-h-[400px]">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* LEFT COLUMN: Metadata & Files */}
                  <div className="lg:col-span-1 space-y-6">
                    
                    {/* Timeline */}
                    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                        Timeline
                      </h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-500">Assigned</span>
                          <span className="text-sm font-medium text-slate-900">
                            {formatDateDisplay(selectedHomework.assignedDate)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-500">Due Date</span>
                          <span className="text-sm font-medium text-slate-900">
                            {formatDateDisplay(selectedHomework.dueDate)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                          <span className="text-sm text-slate-500">Submitted</span>
                          <div className="flex items-center text-emerald-700 text-sm font-medium bg-emerald-50 px-2 py-0.5 rounded">
                             <CheckCircle className="w-3 h-3 mr-1.5" />
                             {formatDateDisplay(selectedHomework.submittedDate)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Files */}
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/50">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                          <FileText className="w-3 h-3" /> Submission
                        </h4>
                      </div>
                      
                      {selectedHomework.file_name ? (
                        <div 
                          onClick={() => handleFileClick(selectedHomework.file_name)}
                          className="group p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                          <div className="h-10 w-10 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                            <Download className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                             <p className="text-sm font-medium text-slate-900 truncate">Download PDF</p>
                             <p className="text-xs text-slate-400 truncate">{selectedHomework.file_name}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 text-center text-sm text-slate-400 italic">
                          No file attached
                        </div>
                      )}

                      {selectedHomework.text_attachment && selectedHomework.text_attachment !== "null" && (
                        <div className="border-t border-slate-100 p-4">
                          <p className="text-xs text-slate-400 mb-2 font-medium">TEXT ANSWER</p>
                          <div className="bg-slate-50 rounded p-3 text-sm font-mono text-slate-700 max-h-32 overflow-y-auto">
                            {selectedHomework.text_attachment}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Grading & Feedback */}
                  <div className="lg:col-span-2 space-y-6">
                    
                    {/* Grading Section - SIMPLE 3 COLUMN GRID */}
                    <Card className="border-slate-200 shadow-sm bg-white">
                      <CardContent className="p-6">
                        
                        {/* The Grid: Raw | Total | Grade */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                               <Label htmlFor="raw_score" className="text-xs font-semibold text-slate-500 uppercase">
                                 Raw Score
                               </Label>
                               <Input
                                 id="raw_score"
                                 type="number"
                                 placeholder="0"
                                 value={rawScore}
                                 onChange={handleRawScoreChange}
                                 className="h-11 text-lg font-medium"
                               />
                             </div>
                             
                             <div className="space-y-2">
                               <Label htmlFor="total_score" className="text-xs font-semibold text-slate-500 uppercase">
                                 Total
                               </Label>
                               <Input
                                 id="total_score"
                                 type="number"
                                 placeholder="0"
                                 value={totalScore}
                                 onChange={handleTotalScoreChange}
                                 className="h-11 text-lg font-medium bg-slate-50"
                               />
                             </div>

                             <div className="space-y-2">
                               <Label className="text-xs font-semibold text-slate-500 uppercase">
                                 IB Grade
                               </Label>
                               <div className="h-11 w-full rounded-md border border-slate-200 bg-slate-100 flex items-center justify-center text-lg font-bold text-slate-900">
                                  {calculatedScore}
                               </div>
                             </div>
                        </div>
                        
                        {/* Percentage Progress */}
                        {rawScore && totalScore && (
                          <div className="mt-5 pt-4 border-t border-slate-50">
                             <div className="flex items-center gap-3">
                               <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-slate-900 transition-all duration-500 ease-out"
                                    style={{ width: `${Math.min(((parseFloat(rawScore) / parseFloat(totalScore)) * 100), 100)}%` }}
                                  />
                               </div>
                               <span className="text-xs font-medium text-slate-600 w-12 text-right">
                                 {((parseFloat(rawScore) / parseFloat(totalScore)) * 100).toFixed(0)}%
                               </span>
                             </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Feedback Composer */}
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col">
                      <div className="p-3 border-b border-slate-100 bg-slate-50/30">
                        <Label htmlFor="comment" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Feedback
                        </Label>
                      </div>
                      
                      <Textarea
                        id="comment"
                        value={comment}
                        onChange={handleCommentChange}
                        rows={6}
                        placeholder="Provide detailed feedback here..."
                        className="border-0 focus-visible:ring-0 resize-none p-4 text-slate-700 text-sm leading-relaxed"
                      />

                      {/* Attachment Bar */}
                      <div className="p-3 border-t border-slate-100 flex items-center justify-between bg-white rounded-b-lg">
                         <div>
                            {uploadError && (
                              <span className="text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> {uploadError}
                              </span>
                            )}
                         </div>
                         
                         <div>
                            <input
                              id="commentPdfInput"
                              type="file"
                              className="hidden"
                              accept=".pdf"
                              onChange={handlePdfFileChange}
                            />
                            
                            {!commentPdfPreview ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-8 border-dashed border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-700 hover:bg-slate-50"
                                onClick={() => document.getElementById('commentPdfInput').click()}
                              >
                                <UploadCloud className="w-3 h-3 mr-2" />
                                Attach PDF
                              </Button>
                            ) : (
                              <div className="flex items-center gap-2 bg-slate-100 text-slate-700 pl-3 pr-2 py-1 rounded text-xs font-medium border border-slate-200">
                                <span className="max-w-[120px] truncate">{commentPdfPreview.name}</span>
                                <button 
                                  onClick={removePdfFile}
                                  className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                         </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* Footer */}
              <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-white flex flex-row gap-3">
                <Button
                  variant="ghost"
                  onClick={() => handleSafeClose()}
                  className="flex-1 sm:flex-none text-slate-500 hover:text-slate-900"
                >
                  Cancel
                </Button>
                <Button
                  className="bg-slate-900 hover:bg-slate-800 text-white flex-1 sm:flex-none shadow-sm px-8"
                  onClick={handleGradeSubmit}
                >
                  Confirm Grade
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={deleteConfirmation.show}
        onOpenChange={(open) => { if (!open) cancelDelete(); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Submission</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this submission? This will remove the student's file and any associated grades.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelDelete}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}