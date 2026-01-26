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
import { toast } from "@/hooks/useToast";
import { Pencil, Trash2, Plus, X } from "lucide-react";
import instance from "@/apis/axiosInstance";
import { safeRequest } from "@/utils/helpers/safeRequest";

// No-op debug logger (instrumentation removed after verification)
const debugLog = () => {};

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
  }, [parents, students, matches]);

  const matchParentStudent = () => {
    // #region agent log
    debugLog({ location: 'AdminParentStudentPage.jsx:65', message: 'matchParentStudent entry', data: { parentsCount: parents.length, studentsCount: students.length, matchesCount: matches.length }, hypothesisId: 'A,E' });
    // #endregion
    const updatedParents = parents.map((parent) => {
      const match = matches.find((match) => match.parentId === parent.parent_id);
      // #region agent log
      debugLog({ location: 'AdminParentStudentPage.jsx:70', message: 'match found for parent', data: { parentId: parent.parent_id, matchExists: !!match, studentIds: match?.studentIds }, hypothesisId: 'A,C' });
      // #endregion
      const studentIds = match?.studentIds ? match.studentIds.split(",") : [];
      // #region agent log
      debugLog({ location: 'AdminParentStudentPage.jsx:72', message: 'studentIds after split', data: { studentIds, studentIdsType: typeof studentIds[0] }, hypothesisId: 'C' });
      // #endregion
      const mappedStudents = [];
      const missingStudentIds = [];
      studentIds.forEach((id) => {
        const parsedId = parseInt(id);
        const foundStudent = students.find((student) => student.student_id === parsedId);
        // #region agent log
        debugLog({ location: 'AdminParentStudentPage.jsx:75', message: 'student lookup result', data: { id, parsedId, foundStudent: !!foundStudent, foundStudentName: foundStudent?.name }, hypothesisId: 'A' });
        // #endregion
        if (foundStudent) {
          mappedStudents.push(foundStudent);
        } else {
          missingStudentIds.push(parsedId);
        }
      });
      // #region agent log
      debugLog({ location: 'AdminParentStudentPage.jsx:79', message: 'mappedStudents after filter', data: { mappedStudentsCount: mappedStudents.length, missingCount: missingStudentIds.length }, hypothesisId: 'A' });
      // #endregion
      return {
        ...parent,
        students: mappedStudents,
        missingStudentIds,
        hasMatch: !!match,
      };
    });

    const hasChanges =
      JSON.stringify(parents) !== JSON.stringify(updatedParents);
    if (hasChanges) {
      console.log("Updated parents", updatedParents);
      setParents(updatedParents); // Only update if there are changes
    }
  };

  const fetchMatchList = async () => {
    try {
      const response = await safeRequest(
        instance.get("/api/parent-student-match/get")
      );
      debugLog({
        location: "AdminParentStudentPage.jsx:86",
        message: "fetchMatchList response",
        data: {
          status: response.status,
          count: response.data?.length,
        },
        hypothesisId: "F",
      });
      setMatches(response.data);
    } catch (error) {
      debugLog({
        location: "AdminParentStudentPage.jsx:92",
        message: "fetchMatchList error",
        data: { error: error?.message, status: error?.response?.status },
        hypothesisId: "F",
      });
      console.error("Error fetching match list:", error);
    }
  };

  const fetchParentList = async () => {
    try {
      const response = await safeRequest(instance.get("/api/parents"));
      debugLog({
        location: "AdminParentStudentPage.jsx:99",
        message: "fetchParentList response",
        data: {
          status: response.status,
          count: response.data?.length,
        },
        hypothesisId: "F",
      });
      setParents(response.data);
    } catch (error) {
      debugLog({
        location: "AdminParentStudentPage.jsx:106",
        message: "fetchParentList error",
        data: { error: error?.message, status: error?.response?.status },
        hypothesisId: "F",
      });
      console.error("Error fetching parent list:", error);
    }
  };

  const fetchStudentList = async () => {
    // #region agent log
    debugLog({ location: 'AdminParentStudentPage.jsx:97', message: 'fetchStudentList entry', data: {}, hypothesisId: 'E' });
    // #endregion
    const response = await safeRequest(instance.get("/api/students"));
    // #region agent log
    debugLog({ location: 'AdminParentStudentPage.jsx:100', message: 'fetchStudentList response', data: { studentsCount: response.data?.length, hasNull: response.data?.some(s => !s), hasUndefinedName: response.data?.some(s => !s?.name) }, hypothesisId: 'D,E' });
    // #endregion
    setStudents(response.data);
  };

  const handleParentChange = (value) => {
    const selectedParent = parents.find(
      (parent) => parent.parent_id === parseInt(value)
    );
    console.log("selected parent", selectedParent);
    if (selectedParent) {
      setNewMatch({ ...newMatch, parentId: selectedParent.parent_id });
    }
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
      if (selectedStudent) {
        setNewMatch({
          ...newMatch,
          studentIds: [...newMatch.studentIds, selectedStudent.student_id],
        });
      }
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
        await instance.put("/api/parent-student-match/insert", newMatch);
        window.alert("Parent-student match updated successfully.");
      } else {
        await instance.post("/api/parent-student-match/insert", newMatch);
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
        await instance.delete("/api/parent-student-match/delete", {
          data: { parent_id: deleteConfirmation.matchId },
        });
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
                        .filter((student) => {
                          // #region agent log
                          if (!student || !student.name) {
                            debugLog({ location: 'AdminParentStudentPage.jsx:248', message: 'student is null/undefined or missing name', data: { studentExists: !!student, hasName: !!student?.name }, hypothesisId: 'D' });
                            // #endregion
                            return false;
                          }
                          return !matches.some((match) =>
                            match.studentIds
                              .split(",")
                              .includes(student.student_id.toString())
                          );
                        })
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
                    // #region agent log
                    debugLog({ location: 'AdminParentStudentPage.jsx:272', message: 'selected student lookup', data: { studentId, studentFound: !!student, studentName: student?.name, studentsCount: students.length }, hypothesisId: 'B' });
                    // #endregion
                    console.log("selected student", student);
                    if (!student) {
                      // #region agent log
                      debugLog({ location: 'AdminParentStudentPage.jsx:276', message: 'student is undefined - would cause error', data: { studentId }, hypothesisId: 'B' });
                      // #endregion
                      return null;
                    }
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
                    parent.parent_name && parent.hasMatch ? (
                      <TableRow key={parent.parent_id}>
                        <TableCell>{parent.parent_name}</TableCell>
                        <TableCell>
                          {parent.students?.map((student) => {
                            // #region agent log
                            debugLog({ location: 'AdminParentStudentPage.jsx:335', message: 'rendering student in table', data: { studentExists: !!student, studentName: student?.name, studentId: student?.student_id }, hypothesisId: 'A' });
                            // #endregion
                            if (!student) {
                              // #region agent log
                              debugLog({ location: 'AdminParentStudentPage.jsx:338', message: 'student is undefined in table - would cause error', data: { parentId: parent.parent_id }, hypothesisId: 'A' });
                              // #endregion
                              return null;
                            }
                            return (
                              <div
                                key={student.student_id}
                              >{`${student.name} (${student.school})`}</div>
                            );
                          })}
                          {parent.missingStudentIds?.length > 0 && (
                            <div className="text-red-500 text-sm mt-1">
                              Missing students: {parent.missingStudentIds.join(", ")}
                            </div>
                          )}
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
