import { useState, useEffect } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Plus, Minus } from "lucide-react";
import instance from "@/apis/axiosInstance";

const levels = [
  { level_id: 1, level_name: "SL" },
  { level_id: 2, level_name: "HL" },
];
const grades = ["11", "12", "pre-IB", "MYP"];
const modes = [
  { mode_id: 1, mode_name: "Online" },
  { mode_id: 2, mode_name: "Offline" },
];

export default function AdminStudentSettingsPage() {
  const [students, setStudents] = useState([]);
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    school: "",
    grade: "",
    subjects: [],
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    studentId: null,
  });
  const [subjectNames, setSubjectNames] = useState([]);

  useEffect(() => {
    fetchStudentList();
    fetchSubjectList();
  }, []);

  const fetchSubjectList = async () => {
    try {
      const response = await instance.get("/api/subjects", {
        params: { fields: "subject_id,subject_name" },
      });
      console.log("received subject list response:", response.data);
      setSubjectNames(response.data);
    } catch (error) {
      console.error("Error fetching subject list:", error);
    }
  };

  const fetchStudentList = async () => {
    try {
      const response = await instance.get("/api/students");
      console.log("received student list response:", response.data);
      setStudents(response.data);
    } catch (error) {
      console.error("Error fetching student list:", error);
    }
  };

  // const handleInputChange = (value) => {
  //   console.log("input change name and value", value);
  //   const selectedStudent = studentNames.find(
  //     (student) => student.student_id === value
  //   );
  //   console.log("selectedstudent", selectedStudent);
  //   if (selectedStudent) {
  //     setNewStudent({
  //       ...newStudent,
  //       name: selectedStudent.name,
  //       student_id: selectedStudent.student_id,
  //     });
  //     console.log("new student info", newStudent);
  //   }
  // };

  const handleInputChange = (e) => {
    setNewStudent({ ...newStudent, [e.target.name]: e.target.value });
  };

  const handleGradeChange = (value) => {
    setNewStudent({ ...newStudent, grade: value });
  };

  const handleSubjectChange = (index, field, value) => {
    const updatedSubjects = [...newStudent.subjects];
    updatedSubjects[index] = { ...updatedSubjects[index], [field]: value };
    setNewStudent({ ...newStudent, subjects: updatedSubjects });
  };

  const addSubject = () => {
    setNewStudent({
      ...newStudent,
      subjects: [
        ...newStudent.subjects,
        { subject_id: "", level_id: "", mode_id: "" },
      ],
    });
  };

  const removeSubject = (index) => {
    const updatedSubjects = newStudent.subjects.filter((_, i) => i !== index);
    setNewStudent({ ...newStudent, subjects: updatedSubjects });
  };

  // Validate form
  const validateForm = () => {
    const { name, school, email, subjects } = newStudent;

    // fields validation
    if (!name || !school || !email) {
      alert("All fields are required.");
      return false;
    }

    // Subjects validation
    if (
      !Array.isArray(subjects) ||
      subjects.length === 0 ||
      !subjects.every(
        (subj) => subj.subject_id && subj.level_id && subj.mode_id
      )
    ) {
      alert("Please fill in all subject fields.");
      return false;
    }

    return true;
  };

  // Add or update student
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Convert subject IDs to integers
    const formattedSubjects = newStudent.subjects.map((s) => ({
      subject_id: parseInt(s.subject_id),
      level_id: parseInt(s.level_id),
      mode_id: parseInt(s.mode_id),
    }));

    const studentToSubmit = {
      ...newStudent,
      subjects: formattedSubjects,
    };

    try {
      if (isEditing) {
        await instance.put(`/api/students/${editingId}`, studentToSubmit);
        window.alert("Student updated successfully.");
        setIsEditing(false);
      } else {
        await instance.post("/api/students/", studentToSubmit);
        window.alert("New student added successfully.");
      }
      // Reset form
      await fetchStudentList();
      handleResetStudent();
    } catch (error) {
      if (error.response) {
        alert(error.response.data.message);
      }
    }
  };

  const handleEdit = (student) => {
    setIsEditing(true);
    setEditingId(student.student_id);
    setNewStudent({
      name: student.name,
      email: student.email,
      school: student.school,
      grade: student.grade,
      subjects: student.subjects,
    });

    window.scrollTo(0, 0);
  };

  const handleDeleteConfirmation = (id) => {
    setDeleteConfirmation({ isOpen: true, studentId: id });
  };

  const handleDelete = async () => {
    if (deleteConfirmation.studentId) {
      try {
        await instance.delete(`/api/students/${deleteConfirmation.studentId}`);
        setStudents(
          students.filter(
            (student) => student.student_id !== deleteConfirmation.studentId
          )
        );
        window.alert("Student deleted successfully.");
      } catch (error) {
        const serverMsg = error.response?.data?.msg || error.response?.data?.message;
        if (serverMsg) {
          window.alert(serverMsg);
        } else {
          window.alert("There was an error deleting the student.");
        }
      } finally {
        setDeleteConfirmation({ isOpen: false, studentId: null });
      }
    }
  };

  const handleResetStudent = () => {
    setIsEditing(false);
    setNewStudent({
      name: "",
      email: "",
      school: "",
      grade: "",
      subjects: [],
    });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Student Management</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>
              {isEditing ? "Edit Student" : "Add New Student"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={newStudent.name}
                  onChange={handleInputChange}
                  placeholder="Enter student name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="school">School</Label>
                <Input
                  id="school"
                  name="school"
                  value={newStudent.school}
                  onChange={handleInputChange}
                  placeholder="Enter school name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={newStudent.email}
                  onChange={handleInputChange}
                  placeholder="Enter student email"
                  required
                />
              </div>
              <div>
                <Label htmlFor="grade">Grade</Label>
                <Select
                  name="grade"
                  id="grade"
                  onValueChange={handleGradeChange}
                  value={newStudent.grade}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {newStudent.subjects.map((subject, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Select
                      onValueChange={(value) =>
                        handleSubjectChange(index, "subject_id", value)
                      }
                      value={String(subject.subject_id)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjectNames.map((subj) => (
                          <SelectItem
                            key={subj.subject_id}
                            value={String(subj.subject_id)}
                          >
                            {subj.subject_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      onValueChange={(value) =>
                        handleSubjectChange(index, "level_id", value)
                      }
                      value={String(subject.level_id)}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Level" />
                      </SelectTrigger>
                      <SelectContent>
                        {levels.map((level) => (
                          <SelectItem
                            key={level.level_id}
                            value={String(level.level_id)}
                          >
                            {level.level_name.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      onValueChange={(value) =>
                        handleSubjectChange(index, "mode_id", value)
                      }
                      value={String(subject.mode_id)}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Mode" />
                      </SelectTrigger>
                      <SelectContent>
                        {modes.map((mode) => (
                          <SelectItem
                            key={mode.mode_id}
                            value={String(mode.mode_id)}
                          >
                            {mode.mode_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSubject(index)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button type="button" onClick={addSubject} className="w-full">
                <Plus className="h-4 w-4 mr-2" /> Add Subject
              </Button>
              <Button type="submit">
                {isEditing ? "Update Student" : "Add Student"}
              </Button>
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetStudent}
                >
                  Cancel Edit
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Current Students</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Subjects</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students?.filter(student => student && student.student_id).map((student) => (
                  <TableRow key={student.student_id}>
                    <TableCell>{student.student_id}</TableCell>
                    <TableCell>{student.name || 'N/A'}</TableCell>
                    <TableCell>{student.grade || 'N/A'}</TableCell>
                    <TableCell>{student.email || 'N/A'}</TableCell>
                    <TableCell>{student.school || 'N/A'}</TableCell>

                    <TableCell>
                      {student.subjects?.filter(subject => subject && subject.subject_name).map((subject, index) => (
                        <div
                          key={index}
                          style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {subject.subject_name} -{" "}
                          {subject.level_name?.toUpperCase() || 'N/A'}({subject.mode_name || 'N/A'}
                          )
                        </div>
                      ))}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(student)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            handleDeleteConfirmation(student.student_id)
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <Dialog
        open={deleteConfirmation.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteConfirmation({ ...deleteConfirmation, isOpen })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this student? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setDeleteConfirmation({ isOpen: false, studentId: null })
              }
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
