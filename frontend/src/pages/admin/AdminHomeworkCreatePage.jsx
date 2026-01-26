import React, { useState, useEffect, useMemo, useRef } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pencil,
  Trash2,
  FileText,
  Calendar,
  Clock,
  BookOpen,
  GraduationCap,
  Layers,
  Filter,
  AlertCircle,
  Download,
} from "lucide-react";
import instance from "@/apis/axiosInstance";

// --- Helper for Badge Colors ---
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

const formatDateDisplay = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const types = ["Homework", "Exam"];

export default function AdminHomeworkCreatePage() {
  const [homeworks, setHomeworks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);
  const [levels, setLevels] = useState([]);
  const [activeTab, setActiveTab] = useState("list");
  const todayDate = getKSTDate().split("-").slice(1).join("/");

  const [newHomework, setNewHomework] = useState({
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

  const [filters, setFilters] = useState({
    subject_id: "",
    sortBy: "dueDate",
    sortOrder: "desc",
    grade_id: "",
    level_id: "",
    type: "",
  });

  const [editingHomework, setEditingHomework] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    show: false,
    id: null,
  });
  const [file, setFile] = useState("");
  const fileInputRef = useRef("");

  // --- API Functions (Kept exactly as provided) ---
  const fetchReferenceData = async () => {
    try {
      const response = await instance.get("/api/reference/");
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
    if (name === "grades" || name === "levels") {
      const array = Array.from(
        e.target.selectedOptions,
        (option) => option.value
      );
      setNewHomework((prev) => ({ ...prev, [name]: array }));
    } else {
      if (
        name === "subject_id" ||
        name === "grade_id" ||
        name === "level_id"
      ) {
        setNewHomework((prev) => ({
          ...prev,
          [name]: value ? Number(value) : "",
        }));
      } else {
        setNewHomework((prev) => ({ ...prev, [name]: value }));
      }
    }
  };

  const handleSelectChange = (name, value) => {
    if (name === "subject_id" || name === "grade_id" || name === "level_id") {
      setNewHomework((prev) => ({
        ...prev,
        [name]: value ? Number(value) : "",
      }));
    } else {
      setNewHomework((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleFileClick = (filename) => {
    if (!filename) {
      console.error("File name is missing");
      return;
    }
    const encodedFilename = encodeURIComponent(filename);
    const url = `${window.location.origin}/api/files/?file=${encodedFilename}`;
    window.open(url, "_blank");
  };

  const handleCreateHomework = async (event) => {
    event.preventDefault();

    if (!newHomework.subject_id) {
      alert("Please select a subject before creating the homework.");
      return;
    }

    const homeworkData = { ...newHomework };
    const formData = new FormData();
    Object.keys(homeworkData).forEach((key) => {
      formData.append(key, homeworkData[key]);
    });

    if (file) {
      formData.append("file", file);
    }

    if (
      Object.values(formData).every((val) => val !== "") &&
      newHomework.assignedDate &&
      newHomework.dueDate &&
      newHomework.subject_id &&
      newHomework.grade_id &&
      newHomework.level_id
    ) {
      if (editingHomework) {
        if (editingHomework.file_name) {
          formData.append("file_name", editingHomework.file_name);
        }
        try {
          await instance.put(
            `/api/homework/${editingHomework.homework_id}`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
          );
          handleResetHomework(); // Helper to reset state
        } catch (error) {
          if (error.response) {
            alert(
              error.response.data.message || "An unexpected error occurred."
            );
          }
        }
        await fetchHomework();
      } else {
        try {
          await instance.post("/api/homework/", formData, {
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: true,
          });
          handleResetHomework();
        } catch (error) {
          if (error.response) {
            alert(
              error.response.data.message || "An unexpected error occurred."
            );
          } else {
            alert("Failed to connect to the server. Please try again.");
          }
        }
        await fetchHomework();
      }
    } else {
      alert("Please fill in all fields.");
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      subject_id: "",
      sortBy: "dueDate",
      sortOrder: "desc",
      grade_id: "",
      level_id: "",
      type: "",
    });
  };

  const handleEdit = (homework) => {
    setEditingHomework(homework);
    setNewHomework(homework);
    setActiveTab("create");
    setFile("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = (id) => {
    setDeleteConfirmation({ show: true, id });
  };

  const confirmDelete = async () => {
    if (deleteConfirmation.id) {
      try {
        await instance.delete(`/api/homework/${deleteConfirmation.id}`);
        setHomeworks((prev) =>
          prev.filter((hw) => hw.id !== deleteConfirmation.id)
        );
      } catch (error) {
        if (error.response && error.response.data.message) {
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
          (!filters.subject_id || String(hw.subject_id) === filters.subject_id) &&
          (!filters.grade_id || String(hw.grade_id) === filters.grade_id) &&
          (!filters.level_id || String(hw.level_id) === filters.level_id) &&
          (!filters.type || hw.type.toLowerCase() === filters.type.toLowerCase())
      )
      .sort((a, b) => {
        const dateA = new Date(a[filters.sortBy]);
        const dateB = new Date(b[filters.sortBy]);
        return filters.sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      });
  }, [homeworks, filters]);

  const fetchHomework = async () => {
    try {
      const response = await instance.get("/api/homework");
      const updatedHomeworkList = response.data.map((homework) => {
        return {
          ...homework,
          createdDate: new Date(homework.created_at.split(" ")[0])
            .toISOString()
            .split("T")[0],
          dueDate: new Date(homework.dueDate).toISOString().split("T")[0],
          assignedDate: new Date(homework.assignedDate)
            .toISOString()
            .split("T")[0],
        };
      });
      setHomeworks(updatedHomeworkList);
    } catch (error) {
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
    setFile("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 bg-slate-50/50 min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-9">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Homework Management
                </h1>
                <p className="text-slate-500 text-sm">
                  Manage assignments, exams, and files.
                </p>
              </div>
              <TabsList className="grid w-[300px] grid-cols-2">
                <TabsTrigger value="list">Assignments</TabsTrigger>
                <TabsTrigger value="create">
                  {editingHomework ? "Edit Mode" : "Create New"}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="list" className="space-y-4">
              {filteredAndSortedHomeworks.length === 0 && (
                <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed">
                  <Layers className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>No homework found matching criteria.</p>
                </div>
              )}
              {filteredAndSortedHomeworks.map((homework) => {
                const isDue = new Date(homework.dueDate) < new Date();
                const isExam = homework.type === "Exam";

                return (
                  <Card
                    key={homework.homework_id}
                    className={`group transition-all duration-200 hover:shadow-md border-l-4 ${
                      isDue
                        ? "border-l-red-500 bg-red-50/30"
                        : isExam
                        ? "border-l-red-400"
                        : "border-l-blue-400"
                    }`}
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row justify-between gap-4">
                        {/* Left Side: Content */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    <Badge
                                    variant="outline"
                                    className={`${getBadgeStyle(
                                        "Subject"
                                    )} px-2 py-0.5 text-xs font-medium border`}
                                    >
                                    <BookOpen className="w-3 h-3 mr-1" />
                                    {homework.subject_name}
                                    </Badge>
                                    <Badge
                                    variant="outline"
                                    className={`${getBadgeStyle(
                                        homework.type
                                    )} px-2 py-0.5 text-xs font-medium border`}
                                    >
                                    {homework.type}
                                    </Badge>
                                    {isDue && (
                                    <Badge className="bg-red-600 hover:bg-red-700 text-white border-none px-2 py-0.5 text-xs">
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                        Past Due
                                    </Badge>
                                    )}
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 leading-tight">
                                    {homework.title}
                                </h3>
                                {homework.description && (
                                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                                    {homework.description}
                                    </p>
                                )}
                            </div>
                          </div>

                          {/* Metadata Row */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                            <div className="flex items-center gap-1.5" title="Due Date">
                              <Calendar className={`w-4 h-4 ${isDue ? "text-red-500" : "text-slate-400"}`} />
                              <span className={isDue ? "text-red-600 font-medium" : ""}>
                                Due: {formatDateDisplay(homework.dueDate)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5" title="Assigned Date">
                                <Clock className="w-4 h-4 text-slate-400" />
                                <span>Assigned: {formatDateDisplay(homework.assignedDate)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="h-1 w-1 rounded-full bg-slate-300" />
                                <div className="flex gap-1">
                                    <Badge variant="outline" className={`${getBadgeStyle("Grade")} text-[10px] h-5`}>
                                        <GraduationCap className="w-3 h-3 mr-1" />
                                        {homework.grade_name}
                                    </Badge>
                                    <Badge variant="outline" className={`${getBadgeStyle("Level")} text-[10px] h-5`}>
                                        {homework.level_name}
                                    </Badge>
                                </div>
                            </div>
                          </div>
                        </div>

                        {/* Right Side: Actions */}
                        <div className="flex sm:flex-col gap-2 items-end justify-start min-w-[100px]">
                          {homework.file_name && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full justify-start text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFileClick(homework.file_name);
                              }}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          )}
                          <div className="flex gap-1 w-full">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                              onClick={() => handleEdit(homework)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex-1 text-red-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleDelete(homework.homework_id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>

            <TabsContent value="create">
              <Card>
                <CardHeader>
                  <CardTitle>{editingHomework ? "Edit Assignment" : "Create Assignment"}</CardTitle>
                  <CardDescription>
                    Fill in the details below to publish a new {newHomework.type.toLowerCase()}.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateHomework} className="space-y-6">
                    {/* Basic Info Section */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                            id="title"
                            name="title"
                            value={newHomework.title}
                            onChange={handleInputChange}
                            placeholder="e.g. Physics Chapter 3 Quiz"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="subject">Subject</Label>
                            <Select
                            name="subject_id"
                            value={String(newHomework.subject_id || "")}
                            onValueChange={(value) => handleSelectChange("subject_id", value)}
                            >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a subject" />
                            </SelectTrigger>
                            <SelectContent>
                                {subjects.map((subject) => (
                                <SelectItem key={subject.subject_id} value={String(subject.subject_id)}>
                                    {subject.subject_name}
                                </SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                        </div>
                        </div>

                        <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            name="description"
                            value={newHomework.description}
                            onChange={handleInputChange}
                            rows={3}
                            placeholder="Add instructions or details..."
                            className="resize-none"
                        />
                        </div>
                    </div>

                    <div className="border-t border-slate-100 my-4"></div>

                    {/* Metadata Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Assigned Date</Label>
                        <div className="relative">
                            <Input
                                type="date"
                                name="assignedDate"
                                value={newHomework.assignedDate}
                                onChange={handleInputChange}
                            />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Due Date</Label>
                        <Input
                          type="date"
                          name="dueDate"
                          value={newHomework.dueDate}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                          name="type"
                          value={newHomework.type}
                          onValueChange={(value) => handleSelectChange("type", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {types.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Grade</Label>
                        <Select
                          name="grade_id"
                          value={String(newHomework.grade_id || "")}
                          onValueChange={(value) => handleSelectChange("grade_id", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Target Grade" />
                          </SelectTrigger>
                          <SelectContent>
                            {grades.map((g) => (
                              <SelectItem key={g.grade_id} value={String(g.grade_id)}>
                                {g.grade_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Level</Label>
                        <Select
                          name="level_id"
                          value={String(newHomework.level_id || "")}
                          onValueChange={(value) => handleSelectChange("level_id", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Difficulty Level" />
                          </SelectTrigger>
                          <SelectContent>
                            {levels.map((l) => (
                              <SelectItem key={l.level_id} value={String(l.level_id)}>
                                {l.level_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="file">Attachment</Label>
                        <div className="flex gap-4 items-center">
                            <Input
                            type="file"
                            id="file"
                            name="file"
                            onChange={handleFileChange}
                            ref={fileInputRef}
                            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                            />
                        </div>
                        {editingHomework?.file_name && (
                            <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 p-2 rounded mt-2">
                                <FileText className="w-4 h-4" />
                                <span>Current: {editingHomework.file_name}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button type="submit" className="flex-1 bg-slate-900 hover:bg-slate-800">
                        {editingHomework ? "Update Assignment" : "Create Assignment"}
                      </Button>
                      {editingHomework && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleResetHomework}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar Filters */}
        <div className="lg:col-span-3">
          <div className="sticky top-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-4 h-4" /> Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-500 uppercase">Sort By</Label>
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value) => handleFilterChange("sortBy", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dueDate">Due Date</SelectItem>
                      <SelectItem value="createdDate">Created Date</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={filters.sortOrder}
                    onValueChange={(value) => handleFilterChange("sortOrder", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Oldest First</SelectItem>
                      <SelectItem value="desc">Newest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-t border-slate-100"></div>

                <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-500 uppercase">Attributes</Label>
                  <Select
                    value={filters.subject_id || "all"}
                    onValueChange={(value) =>
                      handleFilterChange("subject_id", value === "all" ? "" : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Subjects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.subject_id} value={String(subject.subject_id)}>
                          {subject.subject_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.grade_id || "all"}
                    onValueChange={(value) =>
                      handleFilterChange("grade_id", value === "all" ? "" : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Grades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Grades</SelectItem>
                      {grades.map((grade) => (
                        <SelectItem key={grade.grade_id} value={String(grade.grade_id)}>
                          {grade.grade_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.type.toLowerCase() || "all"}
                    onValueChange={(value) =>
                      handleFilterChange("type", value === "all" ? "" : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {types.map((type) => (
                        <SelectItem key={type.toLowerCase()} value={type.toLowerCase()}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button variant="outline" className="w-full mt-4" onClick={resetFilters}>
                  Reset Filters
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog
        open={deleteConfirmation.show}
        onOpenChange={(open) => {
          if (!open) cancelDelete();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Assignment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this assignment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelDelete}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}