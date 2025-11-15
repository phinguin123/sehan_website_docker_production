"use client";

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
import { toast, useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, X, Minus } from "lucide-react";
import instance from "@/apis/AxiosInterceptor";

export default function AdminTeacherSettingsPage() {
  const [teachers, setTeachers] = useState([]);
  const [newTeacher, setNewTeacher] = useState({
    teacher_id: null,
    teacher_name: "",
    zoom_user_id: "",
    subjects: [],
    username: "",
    password: "",
    teacher_type: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    teacherId: null,
  });
  const [subjects, setSubjects] = useState([]);
  const [currentSubject, setCurrentSubject] = useState("");
  const { toast } = useToast();
  const teacherTypes = ["teacher", "TA"];

  useEffect(() => {
    fetchTeacherList();
    fetchSubjectList();
  }, []);

  const fetchSubjectList = async () => {
    try {
      const response = await instance.get("/api/subjects", {
        params: { fields: ["subject_id", "subject_name"] },
      });
      console.log("received subject list response:", response.data);
      setSubjects(response.data);
    } catch (error) {
      console.error("Error fetching subject list:", error);
    }
  };

  const fetchTeacherList = async () => {
    try {
      const response = await instance.get("/api/teachers");
      console.log("received teacher list response:", response.data);
      setTeachers(response.data);
    } catch (error) {
      console.error("Error fetching teacher list:", error);
    }
  };

  const handleInputChange = (e) => {
    setNewTeacher({ ...newTeacher, [e.target.name]: e.target.value });
  };

  const handleSubjectChange = (index, field, value) => {
    const updatedSubjects = [...newTeacher.subjects];
    updatedSubjects[index] = { ...updatedSubjects[index], [field]: value };
    setNewTeacher({ ...newTeacher, subjects: updatedSubjects });
  };

  // const addSubject = () => {
  //   if (currentSubject && !newTeacher.subjects.includes(currentSubject)) {
  //     setNewTeacher({
  //       ...newTeacher,
  //       subjects: [...newTeacher.subjects, currentSubject],
  //     });
  //     setCurrentSubject("");
  //   }
  // };

  const addSubject = () => {
    setNewTeacher({
      ...newTeacher,
      subjects: [...newTeacher.subjects, { subject_id: "" }],
    });
  };

  const removeSubject = (index) => {
    const updatedSubjects = newTeacher.subjects.filter((_, i) => i !== index);
    setNewTeacher({ ...newTeacher, subjects: updatedSubjects });
  };

  const handleTeacherTypeChange = (value) => {
    setNewTeacher({ ...newTeacher, teacher_type: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !newTeacher.teacher_name ||
      newTeacher.subjects.length === 0 ||
      !newTeacher.teacher_type ||
      !newTeacher.username ||
      !newTeacher.password
    ) {
      console.log("newTeacher value", newTeacher);
      window.alert(
        "Name, type, subject, username, password are required fields."
      );
      return;
    }

    try {
      const teacherData = {
        ...newTeacher,
        subject: newTeacher.subjects.join(","),
      };
      if (isEditing) {
        console.log("newly updated teacher", teacherData);
        await instance.put("/api/teachers", teacherData);
        setTeachers(
          teachers.map((teacher) =>
            teacher.teacher_id === teacherData.teacher_id
              ? { ...teacher, ...teacherData }
              : teacher
          )
        );
        window.alert("Teacher updated successfully.");
      } else {
        await instance.post("/api/teachers", teacherData);
        window.alert("New teacher added successfully.");
        fetchTeacherList();
      }
    } catch (error) {
      if (error.response) {
        alert(error.response.data.message);
      }
      console.error(error);
    }

    resetNewTeacher();
  };

  const resetNewTeacher = () => {
    setNewTeacher({
      teacher_id: null,
      teacher_name: "",
      zoom_user_id: "",
      subjects: [],
      username: "",
      password: "",
      teacher_type: "",
    });
    setIsEditing(false);
  };

  const handleEdit = (teacher) => {
    const updatedTeacher = { ...teacher, subjects: teacher.subjects };
    setNewTeacher(updatedTeacher);
    console.log("pressed edit button with teacher data", updatedTeacher);
    setIsEditing(true);

    window.scrollTo(0, 0);
  };

  const handleDeleteConfirmation = (id) => {
    setDeleteConfirmation({ isOpen: true, teacherId: id });
  };

  const handleDelete = async () => {
    if (deleteConfirmation.teacherId) {
      try {
        await instance.delete("/api/admin/delete", {
          headers: { "Content-Type": "application/json" },
          data: { id: deleteConfirmation.teacherId },
        });
        setTeachers(
          teachers.filter(
            (teacher) => teacher.id !== deleteConfirmation.teacherId
          )
        );
        window.alert("Teacher deleted successfully.");
      } catch (error) {
        console.error("Error deleting teacher:", error);
        window.alert("There was an error deleting the teacher.");
      } finally {
        setDeleteConfirmation({ isOpen: false, teacherId: null });
        fetchTeacherList();
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Teacher Management</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>
              {isEditing ? "Edit Teacher" : "Add New Teacher"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="teacher_name"
                  value={newTeacher.teacher_name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="teacher_type">Teacher Type</Label>
                <Select
                  onValueChange={handleTeacherTypeChange}
                  value={newTeacher.teacher_type}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {teacherTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subject">Subjects</Label>
                {newTeacher.subjects.map((subject, index) => (
                  <div className="flex items-center space-x-2 space-y-2">
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
                        {subjects.map((subject) => (
                          <SelectItem
                            key={subject.subject_id}
                            value={String(subject.subject_id)}
                          >
                            {subject.subject_name}
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
                    {/* <Button type="button" onClick={addSubject}>
                      <Plus className="h-4 w-4" />
                    </Button> */}
                  </div>
                ))}
                <Button type="button" onClick={addSubject} className="w-full">
                  <Plus className="h-4 w-4 mr-2" /> Add Subject
                </Button>
                {/* <div className="mt-2 flex flex-wrap gap-2">
                  {newTeacher.subjects.map((subject) => (
                    <div
                      key={subject.subject_id}
                      className="bg-primary text-primary-foreground px-2 py-1 rounded-md flex items-center"
                    >
                      {subject.subject_name}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ml-2 h-4 w-4 p-0"
                        onClick={() => removeSubject(subject.subject_id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div> */}
              </div>
              <div>
                <Label htmlFor="zoom_user_id">Zoom User ID</Label>
                <Input
                  id="zoom_user_id"
                  name="zoom_user_id"
                  value={newTeacher.zoom_user_id}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  value={newTeacher.username}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={newTeacher.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <Button type="submit">
                {isEditing ? "Update Teacher" : "Add Teacher"}
              </Button>
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetNewTeacher}
                >
                  Cancel Edit
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Current Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Subjects</TableHead>
                  <TableHead>Zoom User ID</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map((teacher) => (
                  <TableRow key={teacher.teacher_id}>
                    <TableCell>{teacher.teacher_name}</TableCell>
                    <TableCell>{teacher.teacher_type}</TableCell>
                    <TableCell>
                      {teacher.subjects.map((subject) => (
                        <div
                          key={subject.subject_id}
                          style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {subject.subject_name}
                        </div>
                      ))}
                    </TableCell>
                    <TableCell>
                      {teacher.zoom_user_id ? teacher.zoom_user_id : "-"}
                    </TableCell>
                    <TableCell>{teacher.username}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(teacher)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            handleDeleteConfirmation(teacher.teacher_id)
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
              Are you sure you want to delete this teacher? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setDeleteConfirmation({ isOpen: false, teacherId: null })
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
