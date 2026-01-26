import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import instance from "@/apis/axiosInstance";

const mockStudents = [
  {
    id: 1,
    name: "John Doe",
    subjects: [
      { name: "Economics", level: "SL", commented: false },
      { name: "CompSci", level: "HL", commented: true },
      { name: "Chemistry", level: "HL", commented: false },
    ],
    grade: "11",
  },
  {
    id: 2,
    name: "Jane Smith",
    subjects: [
      { name: "Math", level: "HL", commented: true },
      { name: "Physics", level: "SL", commented: false },
      { name: "English", level: "HL", commented: true },
    ],
    grade: "12",
  },
  {
    id: 3,
    name: "Alex Johnson",
    subjects: [
      { name: "Science", level: "SL", commented: false },
      { name: "Math", level: "HL", commented: true },
      { name: "English", level: "SL", commented: false },
    ],
    grade: "MYP",
  },
];

const weekdays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function StudentComments() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState(mockStudents);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeSubject, setActiveSubject] = useState(null);
  const [comment, setComment] = useState("");
  const [homeworkMarks, setHomeworkMarks] = useState({});
  const [subjectFilter, setSubjectFilter] = useState("");
  const [uncommentedFilter, setUncommentedFilter] = useState(false);
  const [gradeFilter, setGradeFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Fetch students data from API
    fetchStudentList();
    //fetchStudentComments()
    // setStudents(fetchedStudents)
  }, []);

  useEffect(() => {
    const filtered = students.filter((student) => {
      const subjectMatch = subjectFilter
        ? student.subjects.some(
            (subject) => subject.subject_name === subjectFilter
          )
        : true;
      const uncommentMatch = uncommentedFilter
        ? subjectFilter === ""
          ? student.subjects.some((subject) => !subject.comment_text)
          : student.subjects.some(
              (subject) =>
                subject.subject_name === subjectFilter && !subject.comment_text
            )
        : true;
      const gradeMatch = gradeFilter ? student.grade === gradeFilter : true;
      const nameMatch = student.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      return subjectMatch && uncommentMatch && gradeMatch && nameMatch;
    });
    setFilteredStudents(filtered);
  }, [students, subjectFilter, uncommentedFilter, gradeFilter, searchQuery]);

  const fetchStudentList = async () => {
    try {
      const response = await instance.get("/api/students/comments");
      console.log("received student list response:", response.data);
      setStudents(response.data);
    } catch (error) {
      console.error("Error fetching student list:", error);
    }
  };

  const handleGradeFilterChange = (selectedGrade) => {
    setGradeFilter(selectedGrade === "ag" ? "" : selectedGrade);
  };

  const fetchHomeworkMarks = async (student) => {
    try {
      const response = await instance.get("/api/student/marks", {
        params: { student_id: student.student_id },
      });
      console.log("received student marks response:", response.data);
      //   setStudents(response.data)
      setHomeworkMarks(response.data);
    } catch (error) {
      console.error("Error fetching student list:", error);
    }
  };

  const fetchStudentComments = async (student) => {
    try {
      console.log("inside fetch");
      console.log("student_id in fetch comment", student);
      const response = await instance.get("/api/student/comments", {
        headers: {
          "Content-Type": "application/json",
        },
        params: { student_id: student.student_id },
        withCredentials: true,
      });
      console.log("received student comment response:", response.data);
      setComment(response.data || "");
    } catch (error) {
      console.error("Error fetching student comment:", error);
      setComment("");
    }
  };

  const handleStudentClick = (student) => {
    setSelectedStudent(student);
    setActiveSubject(student.subjects[0]);
    // Fetch homework marks for this student
    // setHomeworkMarks(fetchedHomeworkMarks)
    fetchHomeworkMarks(student);
    console.log("student in click", student);
    fetchStudentComments(student);
  };

  const handleSubjectChange = (subject) => {
    setActiveSubject(subject);
    // Fetch comment for this subject
    // setComment(fetchedComment)
  };

  const handleSubjectFilterChange = (selectedSubject) => {
    console.log("selected subject", selectedSubject);
    if (selectedSubject == "ab") {
      setSubjectFilter("");
    } else {
      setSubjectFilter(selectedSubject);
    }
  };

  const handleCommentChange = (e) => {
    console.log("current comment", comment);
    setComment((prevComments) => ({
      ...prevComments,
      [activeSubject.subject_name]: e.target.value,
    }));
  };

  const handleCommentSubmit = async () => {
    // Submit comment to API
    try {
      const response = await instance.post("/api/student/submit-comment", {
        student_id: selectedStudent.student_id,
        comment_text: comment,
        subject_name: activeSubject.subject_name,
      });
      window.alert("Comment submitted successfully.");

      // Update student's subject commented status
      const updatedStudents = students.map((student) =>
        student.student_id === selectedStudent.student_id
          ? {
              ...student,
              subjects: student.subjects.map((subj) =>
                subj.subject_name === activeSubject.subject_name
                  ? { ...subj, comment_text: comment }
                  : subj
              ),
            }
          : student
      );
      setStudents(updatedStudents);
    } catch (error) {
      console.error("Error submitted comment:", error);
      if (error.response && error.response.data) {
        window.alert(
          error.response.data.error ||
            "There was an error submitting the comment."
        );
      }
    }
  };

  const allSubjects = Array.from(
    new Set(
      students.flatMap((student) =>
        student.subjects.map((subject) => subject.subject_name)
      )
    )
  );

  // Get unique grades from students, and ensure MYP is always included
  const allGradesFromStudents = Array.from(
    new Set(students.map((student) => student.grade))
  );
  const allGrades = Array.from(new Set([...allGradesFromStudents, "11", "12", "pre-IB", "MYP"]));

  console.log("allsub and all grade", allSubjects, allGrades);

  const handleSearchQueryChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Student Comments</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Students</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredStudents.map((student) => (
              <Card
                key={student.student_id}
                className="mb-2 cursor-pointer hover:bg-gray-100"
                onClick={() => handleStudentClick(student)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">{student.name}</h3>
                    <Badge className="mr-2 rounded-full border-transparent border">
                      {student.grade}
                    </Badge>
                  </div>
                  <div className="mt-2">
                    {student.subjects.map((subject) => (
                      <Badge
                        key={subject.subject_name}
                        className="mr-2 rounded-full border-transparent border"
                        variant={subject.comment_text ? "default" : "secondary"}
                      >
                        {subject.subject_name} - {subject.level_name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="search-query">Search by Name</Label>
                <Input
                  id="search-query"
                  placeholder="Enter student name"
                  value={searchQuery}
                  onChange={handleSearchQueryChange}
                />
              </div>
              <div>
                <Label htmlFor="grade-filter">Grade</Label>
                <Select
                  onValueChange={handleGradeFilterChange}
                  value={gradeFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ag">All Grades</SelectItem>
                    {allGrades.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subject-filter">Subject</Label>
                <Select
                  onValueChange={handleSubjectFilterChange}
                  value={subjectFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ab">All Subjects</SelectItem>
                    {allSubjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="uncommented-filter"
                  checked={uncommentedFilter}
                  onCheckedChange={setUncommentedFilter}
                />
                <Label htmlFor="uncommented-filter">
                  Show only uncommented
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={selectedStudent !== null}
        onOpenChange={(open) => !open && setSelectedStudent(null)}
      >
        <DialogContent className="max-w-4xl" style={{ zIndex: "1055" }}>
          <DialogHeader>
            <DialogTitle>
              {selectedStudent?.name} - Grade {selectedStudent?.grade}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Current Week Scores</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Day</TableHead>
                      <TableHead>Mark</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weekdays.map((day) => (
                      <TableRow key={day}>
                        <TableCell>{day}</TableCell>
                        <TableCell>
                          {homeworkMarks?.[activeSubject?.subject_name]?.[
                            day
                          ] || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Comments</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs
                  defaultValue={selectedStudent?.subjects[0]?.subject_name}
                  className="w-full"
                >
                  <ScrollArea className="w-full whitespace-nowrap">
                    <TabsList className="inline-flex">
                      {selectedStudent?.subjects.map((subject) => (
                        <TabsTrigger
                          key={subject.subject_name}
                          value={subject.subject_name}
                          onClick={() => handleSubjectChange(subject)}
                        >
                          {subject.subject_name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                  {selectedStudent?.subjects.map((subject) => (
                    <TabsContent
                      key={subject.subject_name}
                      value={subject.subject_name}
                    >
                      <Textarea
                        value={comment ? comment?.[subject.subject_name] : ""}
                        onChange={handleCommentChange}
                        placeholder="Enter your comment here..."
                        className="w-full h-40"
                      />
                      <Button onClick={handleCommentSubmit} className="mt-4">
                        Submit Comment
                      </Button>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
