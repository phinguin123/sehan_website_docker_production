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
import instance from "@/apis/axiosInstance";

export default function StudentScoresTable() {
  // State for academic calendar data
  const [academicCalendar, setAcademicCalendar] = useState(null);
  const [calendarLoading, setCalendarLoading] = useState(true);

  // Generate dates for a week based on week number and start date
  const generateDatesForWeek = (weekNumber, mondayOfStartWeek) => {
    if (!mondayOfStartWeek) {
      return [];
    }

    // Parse the Monday of start week date
    const baseDate = new Date(mondayOfStartWeek);
    
    // Add days to get to the first day (Monday) of the selected week
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

  // Generate week dates using academic calendar data
  const weekDates = academicCalendar
    ? generateDatesForWeek(selectedWeek, academicCalendar.monday_of_start_week)
    : [];

  // Generate weeks array based on total weeks from academic calendar
  const weeks = academicCalendar
    ? Array.from({ length: academicCalendar.total_weeks }, (_, i) => i + 1)
    : [1, 2, 3, 4, 5, 6]; // Fallback to default weeks
  const modes = [
    { mode_id: 1, mode_name: "Online" },
    { mode_id: 2, mode_name: "Offline" },
  ];
  const levels = [
    { level_id: 1, level_name: "SL" },
    { level_id: 2, level_name: "HL" },
    { level_id: 3, level_name: "SL/HL" },
  ];
  const grades = ["11", "12", "Pre IB", "MYP"];

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

  const fetchAcademicCalendar = async () => {
    try {
      setCalendarLoading(true);
      const response = await instance.get("/api/settings/academic-calendar");
      setAcademicCalendar(response.data);
      
      // Set the current week as default if available
      if (response.data.current_week_number) {
        setSelectedWeek(response.data.current_week_number);
      }
    } catch (error) {
      console.error("Error fetching academic calendar:", error);
      // Set a fallback to prevent the page from breaking
      setAcademicCalendar({
        monday_of_start_week: "2025-12-15", // Fallback date
        total_weeks: 6,
        current_week_number: 1,
      });
    } finally {
      setCalendarLoading(false);
    }
  };

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
    // Don't fetch if we don't have week dates yet
    if (!weekDates || weekDates.length === 0) {
      console.log("Skipping fetch: weekDates not available yet");
      return;
    }

    // Validate required parameters
    if (!selectedSubjectID || !selectedGrade) {
      console.log("Skipping fetch: missing required parameters", { selectedSubjectID, selectedGrade });
      return;
    }

    try {
      setIsLoading(true);

      console.log("Fetching scores with params:", { 
        selectedGrade, 
        selectedSubjectID, 
        selectedLevelID,
        selectedModeID,
        weekDates 
      });
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

      // Ensure response.data is an array and normalize the data structure
      const studentsData = Array.isArray(response.data) ? response.data : [];
      
      // Normalize each student object to ensure daily_scores exists and is an array
      const normalizedStudents = studentsData.map((student) => ({
        ...student,
        student_id: student.student_id || student.id,
        student_name: student.student_name || student.name || "-",
        daily_scores: Array.isArray(student.daily_scores) 
          ? student.daily_scores.filter(ds => ds && ds.date) // Filter out invalid entries
          : [],
      }));

      const filteredData = normalizedStudents.filter((student) =>
        searchQuery
          ? (student.student_name || "")
              .toLowerCase()
              .includes(searchQuery.toLowerCase())
          : true
      );

      setStudents(filteredData);
    } catch (error) {
      console.error("Error fetching students:", error);
      if (error.response) {
        const errorMessage = error.response.data?.message || error.response.data?.error || "Failed to fetch student scores";
        alert(errorMessage);
      } else {
        alert("Network error: Failed to fetch student scores. Please check your connection.");
      }
      // Set empty array on error to prevent crashes
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to fetch academic calendar on mount
  useEffect(() => {
    fetchAcademicCalendar();
  }, []);

  // Effect to fetch subject list on mount
  useEffect(() => {
    fetchSubjectList();
  }, []);

  // Effect to fetch data when dependencies change
  useEffect(() => {
    // Only fetch students if we have academic calendar data and week dates
    if (academicCalendar && weekDates.length > 0) {
      fetchStudents();
    }
  }, [
    searchQuery,
    selectedGrade,
    selectedWeek,
    selectedSubjectID,
    selectedLevelID,
    selectedModeID,
    academicCalendar, // Add as dependency to refetch when calendar loads
  ]);

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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="11">Grade 11</TabsTrigger>
            <TabsTrigger value="12">Grade 12</TabsTrigger>
            <TabsTrigger value="Pre IB">Pre IB</TabsTrigger>
            <TabsTrigger value="MYP">MYP</TabsTrigger>
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
                    {calendarLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                          <div className="mt-2">Loading academic calendar...</div>
                        </TableCell>
                      </TableRow>
                    ) : isLoading ? (
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

                        // Ensure daily_scores is an array, default to empty array if missing
                        const dailyScores = Array.isArray(studentData.daily_scores) 
                          ? studentData.daily_scores 
                          : [];

                        return (
                          <TableRow key={student.student_id}>
                            <TableCell className="font-medium">
                              {student.student_name || "-"}
                            </TableCell>
                            {weekDates.map((date) => {
                              const daily_score = dailyScores.find(
                                (ds) => ds && ds.date === date
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
                                {(() => {
                                  const validScores = dailyScores.filter(
                                    (ds) =>
                                      ds &&
                                      ds.score !== -1 && 
                                      ds.score !== -100 &&
                                      ds.score !== null &&
                                      ds.score !== undefined
                                  );
                                  if (validScores.length === 0) {
                                    return "-";
                                  }
                                  const sum = validScores.reduce(
                                    (acc, ds) => acc + (ds.score || 0), 
                                    0
                                  );
                                  return Math.round(sum / validScores.length);
                                })()}
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
