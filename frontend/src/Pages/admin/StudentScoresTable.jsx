import { useState, useEffect } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Loader2 } from "lucide-react";
import instance from "@/apis/AxiosInterceptor";

export default function StudentScoresTable() {
  // Generate dates for a week based on week number
  const generateDatesForWeek = (weekNumber) => {
    // Start with a base date (first day of 2025)
    const baseDate = new Date(2025, 5, 24);
    // Add days to get to the first day of the selected week
    const firstDayOfWeek = new Date(baseDate);
    firstDayOfWeek.setDate(baseDate.getDate() + (weekNumber - 1) * 7);

    // Generate 5 consecutive dates (Mon-Fri)
    return Array.from({ length: 5 }, (_, i) => {
      const date = new Date(firstDayOfWeek);
      date.setDate(firstDayOfWeek.getDate() + i);
      return date.toISOString().split("T")[0]; // Format as YYYY-MM-DD
    });
  };

  // State for search, grades, and data
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("11");
  const [selectedLevelID, setSelectedLevelID] = useState("1");
  const [selectedModeID, setSelectedModeID] = useState("1");
  const [selectedSubjectID, setSelectedSubjectID] = useState("10");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [allSubjects, setAllSubjects] = useState([]);
  const [students, setStudents] = useState([]);

  const weekDates = generateDatesForWeek(selectedWeek);
  const weeks = [1, 2, 3, 4, 5, 6]; // Sample weeks
  const modes = [
    { mode_id: 1, mode_name: "Online" },
    { mode_id: 2, mode_name: "Offline" },
  ];
  const levels = [
    { level_id: 1, level_name: "SL" },
    { level_id: 2, level_name: "HL" },
    { level_id: 3, level_name: "SL/HL" },
  ];
  const grades = ["11", "12", "Pre IB"];

  // Mock function to fetch data from backend
  // In a real application, this would be an actual API call
  const fetchFakeStudents = async () => {
    setIsLoading(true);

    try {
      // This would be replaced with an actual API call
      // const response = await fetch(`/api/students?search=${searchQuery}&grade=${selectedGrade}&week=${selectedWeek}&subject=${selectedSubject}`);
      // const data = await response.json();

      // For demo purposes, we'll simulate a backend response
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay

      // Mock data - in a real app, this would come from the API
      const mockData = [
        {
          id: 1,
          name: "Alice Johnson",
          grade: "11",
          subjects: [
            {
              subject: "Math",
              dailyScores: weekDates.map((date, i) => ({
                date,
                score: 85 + i,
              })),
            },
            {
              subject: "Science",
              dailyScores: weekDates.map((date, i) => ({
                date,
                score: 90 + i,
              })),
            },
          ],
        },
        {
          id: 2,
          name: "Bob Smith",
          grade: "11",
          subjects: [
            {
              subject: "History",
              dailyScores: weekDates.map((date, i) => ({
                date,
                score: 88 - i,
              })),
            },
            {
              subject: "Math",
              dailyScores: weekDates.map((date, i) => ({
                date,
                score: 78 + i * 2,
              })),
            },
          ],
        },
        {
          id: 3,
          name: "Charlie Brown",
          grade: "12",
          subjects: [
            {
              subject: "Math",
              dailyScores: weekDates.map((date, i) => ({
                date,
                score: 90 + i,
              })),
            },
            {
              subject: "Art",
              dailyScores: weekDates.map((date, i) => ({
                date,
                score: 88 + i,
              })),
            },
          ],
        },
        {
          id: 4,
          name: "Diana Miller",
          grade: "12",
          subjects: [
            {
              subject: "Physics",
              dailyScores: weekDates.map((date, i) => ({
                date,
                score: 92 - i,
              })),
            },
            {
              subject: "Math",
              dailyScores: weekDates.map((date, i) => ({
                date,
                score: 85 + i,
              })),
            },
          ],
        },
        {
          id: 5,
          name: "Ethan Davis",
          grade: "Pre IB",
          subjects: [
            {
              subject: "Math",
              dailyScores: weekDates.map((date, i) => ({
                date,
                score: 95 - i,
              })),
            },
            {
              subject: "Chemistry",
              dailyScores: weekDates.map((date, i) => ({
                date,
                score: 88 + i * 2,
              })),
            },
          ],
        },
        {
          id: 6,
          name: "Fiona Wilson",
          grade: "Pre IB",
          subjects: [
            {
              subject: "Biology",
              dailyScores: weekDates.map((date, i) => ({
                date,
                score: 91 + i,
              })),
            },
            {
              subject: "Math",
              dailyScores: weekDates.map((date, i) => ({
                date,
                score: 89 + i,
              })),
            },
          ],
        },
      ];

      // Filter by grade and search term
      const filteredData = students.filter(
        (student) =>
          student.grade === selectedGrade &&
          (searchQuery
            ? student.student_name
                .toLowerCase()
                .includes(searchQuery.toLowerCase())
            : true)
      );

      setStudents(filteredData);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchTerm);
  };

  // Get students who take the selected subject
  const studentsWithSelectedSubject = students;

  const fetchSubjectList = async () => {
    try {
      const response = await instance.get("/api/subjects", {
        params: { fields: "subject_id,subject_name" },
      });
      setAllSubjects(response.data);
    } catch (error) {
      console.error("Error fetching subject list:", error);
    }
  };

  const fetchStudents = async () => {
    try {
      setIsLoading(true);

      console.log({ selectedGrade, selectedSubjectID, weekDates });
      console.log("data above");
      var grade_name = selectedGrade;
      if (selectedGrade === "Pre IB") {
        grade_name = "pre-IB";
      }
      const response = await instance.get("/api/scores", {
        params: {
          grade: grade_name,
          level_id: parseInt(selectedLevelID),
          mode_id: parseInt(selectedModeID),
          subject_id: parseInt(selectedSubjectID),
          week_dates: weekDates.join(","),
        },
      });

      console.log("received response for scores", response);

      const filteredData = response.data.filter((student) =>
        searchQuery
          ? student.student_name
              .toLowerCase()
              .includes(searchQuery.toLowerCase())
          : true
      );

      setStudents(filteredData);
    } catch (error) {
      if (error.response) {
        alert(error.response.data.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to fetch data when dependencies change
  useEffect(() => {
    fetchStudents();
  }, [
    searchQuery,
    selectedGrade,
    selectedWeek,
    selectedSubjectID,
    selectedLevelID,
    selectedModeID,
  ]);

  useEffect(() => {
    fetchSubjectList();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Student Scores</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select
              value={selectedSubjectID}
              onValueChange={setSelectedSubjectID}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Subject" />
              </SelectTrigger>
              <SelectContent>
                {allSubjects.map((subject) => (
                  <SelectItem
                    key={subject.subject_id}
                    value={String(subject.subject_id)}
                  >
                    {subject.subject_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedLevelID} onValueChange={setSelectedLevelID}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Level" />
              </SelectTrigger>
              <SelectContent>
                {levels.map((level) => (
                  <SelectItem
                    key={level.level_id}
                    value={String(level.level_id)}
                  >
                    {level.level_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedModeID} onValueChange={setSelectedModeID}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Mode" />
              </SelectTrigger>
              <SelectContent>
                {modes.map((mode) => (
                  <SelectItem key={mode.mode_id} value={String(mode.mode_id)}>
                    {mode.mode_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedWeek.toString()}
              onValueChange={(value) => setSelectedWeek(Number.parseInt(value))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Week" />
              </SelectTrigger>
              <SelectContent>
                {weeks.map((week) => (
                  <SelectItem key={week} value={week.toString()}>
                    Week {week}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Search form */}
        <form
          onSubmit={handleSearch}
          className="flex w-full items-center space-x-2"
        >
          <Input
            type="text"
            placeholder="Search student name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="outline">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            <span className="ml-2">Search</span>
          </Button>
        </form>
      </CardHeader>

      <CardContent>
        {/* Grade Tabs */}
        <Tabs
          defaultValue="11"
          value={selectedGrade}
          onValueChange={setSelectedGrade}
          className="mb-6"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="11">Grade 11</TabsTrigger>
            <TabsTrigger value="12">Grade 12</TabsTrigger>
            <TabsTrigger value="Pre IB">Pre IB</TabsTrigger>
          </TabsList>

          {grades.map((grade) => (
            <TabsContent key={grade} value={grade} className="mt-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Student</TableHead>
                      {weekDates.map((date) => (
                        <TableHead key={date} className="text-center">
                          {date}
                        </TableHead>
                      ))}
                      <TableHead className="text-center">Average</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                          <div className="mt-2">Loading student data...</div>
                        </TableCell>
                      </TableRow>
                    ) : studentsWithSelectedSubject.length > 0 ? (
                      studentsWithSelectedSubject.map((student) => {
                        const studentData = student;

                        if (!studentData) return null;

                        return (
                          <TableRow key={student.student_id}>
                            <TableCell className="font-medium">
                              {student.student_name}
                            </TableCell>
                            {weekDates.map((date) => {
                              const daily_score = studentData.daily_scores.find(
                                (ds) => ds.date === date
                              );
                              return (
                                <TableCell key={date} className="text-center">
                                  <span className="font-bold">
                                    {daily_score
                                      ? daily_score.score === -1
                                        ? "▲"
                                        : daily_score.score === -100
                                        ? "✖"
                                        : daily_score.score
                                      : "-"}
                                  </span>
                                </TableCell>
                              );
                            })}
                            <TableCell className="text-center">
                              <span className="font-bold">
                                {Math.round(
                                  studentData.daily_scores
                                    .filter(
                                      (ds) =>
                                        ds.score !== -1 && ds.score !== -100
                                    )
                                    .reduce((sum, ds) => sum + ds.score, 0) /
                                    studentData.daily_scores.filter(
                                      (ds) =>
                                        ds.score !== -1 && ds.score !== -100
                                    ).length
                                )}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          {searchQuery
                            ? `No students found matching "${searchQuery}" in Grade ${grade} who take ${
                                allSubjects?.find(
                                  (e) =>
                                    String(e.subject_id) === selectedSubjectID
                                )?.subject_name
                              }.`
                            : `No students in Grade ${grade} are taking ${
                                allSubjects?.find(
                                  (e) =>
                                    String(e.subject_id) === selectedSubjectID
                                )?.subject_name
                              } this semester.`}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
