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
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, X } from "lucide-react";
import instance from "../apis/AxiosInterceptor";
import { safeRequest } from "@/utils/safeRequest";

export default function ParentStudentPage() {
  const [parents, setParents] = useState([]);
  const [students, setStudents] = useState([]);
  const [matches, setMatches] = useState([]);
  const [newMatch, setNewMatch] = useState({
    parent_id: null,
    parent_name: "",
    parentId: null,
    studentIds: [],
  });
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    matchId: null,
  });
  const [currentStudentID, setCurrentStudentID] = useState("");

  useEffect(() => {
    fetchMatchList();
    fetchStudentList();
    fetchParentList();
  }, []);

  useEffect(() => {
    if (parents.length > 0 && students.length > 0 && matches.length > 0) {
      matchParentStudent();
    }
    console.log("aaaaaaaaaaaaaaaaaaaaa");
  }, [parents, students, matches]);

  const matchParentStudent = () => {
    const updatedParents = parents.map((parent) => ({
      ...parent,
      students:
        matches
          .find((match) => match.parentId === parent.parent_id)
          ?.studentIds.split(",")
          .map((id) =>
            students.find((student) => student.student_id === parseInt(id))
          ) || [],
    }));

    const hasChanges =
      JSON.stringify(parents) !== JSON.stringify(updatedParents);
    if (hasChanges) {
      console.log("Updated parents", updatedParents);
      setParents(updatedParents); // Only update if there are changes
    }
  };

  const fetchMatchList = async () => {
    const response = await safeRequest(
      instance.get("/api/parent-student-match/get")
    );
    setMatches(response.data);
  };

  const fetchParentList = async () => {
    const response = await safeRequest(instance.get("/api/parent/getList"));
    setParents(response.data);
  };

  const fetchStudentList = async () => {
    const response = await safeRequest(instance.get("/api/students"));
    setStudents(response.data);
  };

  const handleParentChange = (value) => {
    const selectedParent = parents.find(
      (parent) => parent.parent_id === parseInt(value)
    );
    console.log("selected parent", selectedParent);
    setNewMatch({ ...newMatch, parentId: selectedParent.parent_id });
  };

  const handleStudentChange = (value) => {
    setCurrentStudentID(value);
  };

  const addStudent = () => {
    if (!newMatch.studentIds.includes(currentStudentID)) {
      console.log("addstudent value", currentStudentID);
      const selectedStudent = students.find(
        (student) => student.student_id === parseInt(currentStudentID)
      );
      setNewMatch({
        ...newMatch,
        studentIds: [...newMatch.studentIds, selectedStudent.student_id],
      });
    }
  };

  const removeStudent = (studentId) => {
    setNewMatch({
      ...newMatch,
      studentIds: newMatch.studentIds.filter((id) => id !== studentId),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMatch.parentId || newMatch.studentIds.length === 0) {
      window.alert("Parent and at least one student are required.");
      return;
    }

    try {
      if (isEditing) {
        await instance.put(
          `${
            import.meta.env.VITE_API_BASE_URL
          }/api/parent-student-match/insert`,
          newMatch
        );
        window.alert("Parent-student match updated successfully.");
      } else {
        await instance.post(
          `${
            import.meta.env.VITE_API_BASE_URL
          }/api/parent-student-match/insert`,
          newMatch
        );
        window.alert("Parent-student match added successfully.");
      }
      // Refresh the list after adding/editing
      fetchMatchList();
      fetchStudentList();
      fetchParentList();
    } catch (error) {
      console.error("Error saving parent-student match:", error);
      window.alert("There was an error saving the parent-student match.");
    }

    setNewMatch({ parentId: "", studentIds: [] });
    setIsEditing(false);
  };

  const handleEdit = (match) => {
    setNewMatch({ parentId: match.parentId, studentIds: match.studentIds });
    setIsEditing(true);

    window.scrollTo(0, 0);
  };

  const handleDeleteConfirmation = (matchId) => {
    setDeleteConfirmation({ isOpen: true, matchId });
  };

  const handleDelete = async () => {
    if (deleteConfirmation.matchId) {
      try {
        await instance.delete(
          `${
            import.meta.env.VITE_API_BASE_URL
          }/api/parent-student-match/delete`,
          {
            data: { parent_id: deleteConfirmation.matchId },
          }
        );
        fetchMatchList();
        fetchStudentList();
        fetchParentList();
        window.alert("Parent-student match deleted successfully.");
      } catch (error) {
        window.alert("There was an error deleting the parent-student match.");
      } finally {
        setDeleteConfirmation({ isOpen: false, matchId: null });
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Parent-Student Matching</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? "Edit Match" : "Add New Match"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="parent">Parent</Label>
                <Select
                  onValueChange={handleParentChange}
                  value={newMatch.parentId}
                >
                  <SelectTrigger>
                    <SelectValue>
                      {newMatch.parentId
                        ? parents.find(
                            (parent) => parent.parent_id === newMatch.parentId
                          )?.parent_name
                        : "Select a name"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {parents
                      .filter(
                        (parent) =>
                          !matches.some(
                            (match) => match.parentId === parent.parent_id
                          )
                      )
                      .map((parent) => (
                        <SelectItem
                          key={parent.parent_id}
                          value={parent.parent_id}
                        >
                          {parent.parent_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="student">Students</Label>
                <div className="flex space-x-2">
                  <Select
                    onValueChange={handleStudentChange}
                    value={parseInt(currentStudentID)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students
                        .filter(
                          (student) =>
                            !matches.some((match) =>
                              match.studentIds
                                .split(",")
                                .includes(student.student_id.toString())
                            )
                        )
                        .map((student) => (
                          <SelectItem
                            key={student.student_id}
                            value={student.student_id}
                          >{`${student.name} (${student.school})`}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" onClick={addStudent}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {newMatch.studentIds.map((studentId) => {
                    const student = students.find(
                      (s) => s.student_id === studentId
                    );
                    console.log("selected student", student);
                    return (
                      <div
                        key={studentId}
                        className="bg-primary text-primary-foreground px-2 py-1 rounded-md flex items-center"
                      >
                        {`${student.name} (${student.school})`}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-2 h-4 w-4 p-0"
                          onClick={() => removeStudent(studentId)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
              <Button type="submit">
                {isEditing ? "Update Match" : "Add Match"}
              </Button>
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setNewMatch({ parentId: "", studentIds: [] });
                    setIsEditing(false);
                  }}
                >
                  Cancel Edit
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Current Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parent</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parents.length > 0 &&
                  parents.map((parent) =>
                    parent.parent_name && parent.students?.length > 0 ? (
                      <TableRow key={parent.parent_id}>
                        <TableCell>{parent.parent_name}</TableCell>
                        <TableCell>
                          {parent.students?.map((student) => (
                            <div
                              key={student.student_id}
                            >{`${student.name} (${student.school})`}</div>
                          ))}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                handleEdit({
                                  parentId: parent.parent_id,
                                  studentIds: parent.students.map(
                                    (s) => s.student_id
                                  ),
                                })
                              }
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                handleDeleteConfirmation(parent.parent_id)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : null
                  )}
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
              Are you sure you want to delete this parent-student match? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setDeleteConfirmation({ isOpen: false, matchId: null })
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
