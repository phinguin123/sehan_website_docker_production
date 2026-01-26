import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Upload,
  Download,
  ChevronLeft,
  ChevronRight,
  Edit,
  TrendingUp,
} from "lucide-react";
import D3BarChart from '@/components/common/BarChart2';
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { getCookie } from '@/components/common/Cookie';
import "@/styles/customShadow.css";
import instance from "@/apis/axiosInstance";
import { ScrollArea } from "@/components/ui/scroll-area";




const gradeBoundaries = [
  { min: 80, max: 101, score: 7, label: "Excellent", color: "bg-green-500" },
  { min: 70, max: 80, score: 6, label: "Very Good", color: "bg-blue-500" },
  { min: 50, max: 70, score: 5, label: "Good", color: "bg-indigo-500" },
  { min: 40, max: 50, score: 4, label: "Satisfactory", color: "bg-yellow-500" },
  { min: 30, max: 40, score: 3, label: "Needs Improvement", color: "bg-orange-500" },
  { min: 20, max: 30, score: 2, label: "Poor", color: "bg-red-400" },
  { min: 0, max: 20, score: 1, label: "Very Poor", color: "bg-red-600" },
]

function getGradeInfo(rawScore, totalScore) {
  const percentage = (rawScore / totalScore) * 100
  const grade =
    gradeBoundaries.find((boundary) => percentage >= boundary.min && percentage < boundary.max) ||
    gradeBoundaries[gradeBoundaries.length - 1]

  return { percentage, grade }
}

const subjectColors = {
  "Math AA": "#FFF68F",
  Physics: "#75FBB0",
  Chemistry: "#E64B85",
  Biology: "#E0FE52",
  Korean: "#FF0000",
  Business: "#FFC247",
  Economics: "#FFA07A",
  CompSci: "#d096ff",
  "English A": "#87CEFA",
  "English B": "#90EE90",
  "Korean LL": "#FF69B4",
  "Korean Lit": "#9370DB",
  "Math AI": "#FF7F50",
  "Pre-Math": "#FFC0CB",
  "Pre-English": "#AFEEEE",
};

const markColors = [
  "bg-[#F8696B]",
  "bg-[#FA9473]",
  "bg-[#FCBF7B]",
  "bg-[#FFEB84]",
  "bg-[#CCDD82]",
  "bg-[#98CE7F]",
  "bg-[#63BE7B]",
];

const markColors2 = [
  "#F8696B",
  "#FA9473",
  "#FCBF7B",
  "#FFC000",
  "#CCDD82",
  "#98CE7F",
  "#63BE7B",
];

const initialHomeworkData = {
  Math: {
    submitted: [
      { id: 1, date: "2023-08-01", marks: 7 },
      { id: 2, date: "2023-08-03", marks: 6 },
      { id: 3, date: "2023-08-05", marks: 5 },
      { id: 4, date: "2023-08-08", marks: 4 },
      { id: 5, date: "2023-08-10", marks: 3 },
      { id: 6, date: "2023-08-12", marks: 2 },
      { id: 7, date: "2023-08-15", marks: 1 },
      { id: 8, date: "2023-08-17", marks: 5 },
      { id: 9, date: "2023-08-19", marks: 7 },
      { id: 10, date: "2023-08-22", marks: 6 },
    ],
    pending: [
      { id: 11, date: "2023-08-25" },
      { id: 12, date: "2023-08-27" },
    ],
  },
  Physics: {
    submitted: [
      { id: 13, date: "2023-08-02", marks: 7 },
      { id: 14, date: "2023-08-04", marks: 6 },
      { id: 15, date: "2023-08-07", marks: 5 },
      { id: 16, date: "2023-08-09", marks: 7 },
      { id: 17, date: "2023-08-11", marks: 6 },
      { id: 18, date: "2023-08-14", marks: 5 },
      { id: 19, date: "2023-08-16", marks: 7 },
      { id: 20, date: "2023-08-18", marks: 6 },
      { id: 21, date: "2023-08-21", marks: 5 },
      { id: 22, date: "2023-08-23", marks: 7 },
    ],
    pending: [
      { id: 23, date: "2023-08-26" },
      { id: 24, date: "2023-08-28" },
    ],
  },
  Chemistry: {
    submitted: [],
    pending: [],
  },
  Biology: {
    submitted: [],
    pending: [],
  },
};

function useReRenderer() {
  const [, setState] = useState({});
  return useCallback(() => setState({}), []);
}

export default function HomeworkDashboard() {
  const params = useParams();
  const subject = params?.subject;
  const [subjects, setSubjects] = useState([]);
  const [currentSubject, setCurrentSubject] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState(null);
  const [uploadData, setUploadData] = useState({
    date: "",
    subject: null,
    file: null,
    text_attachment: "",
  });
  const [homeworkData, setHomeworkData] = useState({});
  const [currentWeek, setCurrentWeek] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editHomeworkData, setEditHomeworkData] = useState(null);
  const isSubmittingRef = useRef(false);
  const reRender = useReRenderer();
  const [sehanStartDate, setSehanStartDate] = useState("2025-5-19");
  const [activeTab, setActiveTab] = useState("submitted");
  const [formattedHomeworkDescription, setFormattedHomeworkDescription] = useState("");

const renderBoundariesDisplay = () => {
  return (
          <div>
            <h3 className="text-sm font-medium mb-2">성적 기준</h3>
            <div className="space-y-1">
              {gradeBoundaries
                .slice()
                .reverse()
                .map((boundary) => (
                  <div key={boundary.score} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 ${boundary.color} rounded-full`}></div>
                      <span className="font-medium">{boundary.score}</span>
                    </div>
                    <span className="text-gray-500">
                      {boundary.min}-{boundary.max}%
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )
      }

    const renderGradeDisplay = (selectedHomework) => {

      if (!selectedHomework?.raw_score || !selectedHomework?.total_score) return null;
      const { percentage, grade } = getGradeInfo(
    selectedHomework.raw_score,
    selectedHomework.total_score
  );
            return (
              <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold text-blue-900">Performance Summary</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Raw Score:</span>
                        <span className="font-medium">
                          {selectedHomework.raw_score}/{selectedHomework.total_score}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Percentage:</span>
                        <span className="font-medium">{percentage.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Grade:</span>
                        <span className={`font-bold text-white px-2 py-1 rounded text-xs ${grade.color}`}>
                          {grade.score}/7
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-blue-700 font-medium">{grade.label}</div>
              </div>
            )
      }

  const handleFileClick = (homework_file_name) => {
    if (!homework_file_name) {
      console.error("File name is missing");
      return;
    }
    // Use query parameter instead of path parameter to avoid nginx URL decoding issues
    // This preserves the filename encoding better when there are spaces
    const encodedFilename = encodeURIComponent(homework_file_name);
    const url = `${window.location.origin}/api/files/?file=${encodedFilename}`;
    window.open(url, "_blank");
  };

  const fetchHomeworkData = async (subject) => {
    if (!subject) {
      console.warn("No subject provided to fetchHomeworkData");
      return;
    }
    try {
      console.log(`[DEBUG] Fetching homework for subject: ${subject}`);
      // Use query parameter instead of path parameter to avoid nginx parsing issues with spaces
      const response = await instance.get(`/api/homework`, {
        params: { subject: subject }
      });
      console.log(`[DEBUG] Homework API response:`, response.data);
      console.log(`[DEBUG] Response status:`, response.status);
      if (!response.data || !Array.isArray(response.data)) {
        console.warn("Invalid homework data received:", response.data);
        setHomeworkData((prevData) => ({
          ...prevData,
          [subject]: [],
        }));
        return;
      }
      const updatedHomeworkList = response.data.map((homework) => {
        // Create a new object with formatted date
        return {
          ...homework,
          submission_date: homework.submission_date 
            ? new Date(homework.submission_date)
                .toISOString()
                .split("T")[0]
                .replace(/-/g, "/")
            : "",
          assignedDate: homework.assignedDate
            ? new Date(homework.assignedDate)
                .toISOString()
                .split("T")[0]
                .replace(/-/g, "/")
            : "",
          dueDate: homework.dueDate
            ? new Date(homework.dueDate)
                .toISOString()
                .split("T")[0]
                .replace(/-/g, "/")
            : "",
          marks: homework.marks,
        };
      });
      console.log(`[DEBUG] Setting homework data for ${subject}:`, updatedHomeworkList.length, "items");
      setHomeworkData((prevData) => ({
        ...prevData,
        [subject]: updatedHomeworkList,
      }));
    } catch (error) {
      console.error("[ERROR] Error fetching homework data:", error);
      console.error("[ERROR] Error response:", error.response?.data);
      console.error("[ERROR] Error status:", error.response?.status);
      if (error.response?.status !== 401) {
        console.error("Error fetching homework data:", error);
        // Set empty array on error to prevent undefined access
        setHomeworkData((prevData) => ({
          ...prevData,
          [subject]: [],
        }));
      }
    }
  };

  useEffect(() => {
    const normalizeSubjects = (rawSubjects = []) =>
      rawSubjects
        .map((item) =>
          typeof item === "string" ? { subject_name: item } : item
        )
        .filter(Boolean);

    const fetchSubjectList = async () => {
      try {
        const response = await instance.get("/api/student/get-subjects");
        console.log("Raw API response:", response.data);
        
        const normalized = normalizeSubjects(response.data);
        console.log("Normalized subjects:", normalized);
        setSubjects(normalized);

        if (!normalized || normalized.length === 0) {
          console.warn("No subjects found in response");
          return null;
        }

        console.log("URL subject param:", subject);

        // If no subject in URL, use first available subject
        if (!subject || typeof subject !== "string") {
          const firstSubject = normalized[0]?.subject_name || null;
          if (firstSubject) {
            console.log("No subject in URL, using first subject:", firstSubject);
            setCurrentSubject(firstSubject);
            setUploadData((prev) => ({ ...prev, subject: firstSubject }));
            return firstSubject;
          }
        }

        // Try to match the subject from URL (case-insensitive)
        const requested = subject.toLowerCase().trim();
        console.log("Looking for subject (lowercase):", requested);
        
        const match = normalized.find(
          (item) => {
            const itemName = item?.subject_name;
            if (!itemName) return false;
            const itemNameLower = itemName.toLowerCase().trim();
            console.log("Comparing:", requested, "with", itemNameLower);
            return itemNameLower === requested;
          }
        );

        if (match) {
          console.log("Matched subject:", match.subject_name);
          setCurrentSubject(match.subject_name);
          setUploadData((prev) => ({ ...prev, subject: match.subject_name }));
          return match.subject_name;
        }

        // Fallback to first subject if no match
        if (normalized.length > 0) {
          const fallbackSubject = normalized[0]?.subject_name;
          if (fallbackSubject) {
            console.log("No match found, using fallback subject:", fallbackSubject);
            setCurrentSubject(fallbackSubject);
            setUploadData((prev) => ({ ...prev, subject: fallbackSubject }));
            return fallbackSubject;
          }
        }

        console.warn("No subject name found in normalized list. Normalized:", normalized);
        return null;
      } catch (error) {
        console.error("Error fetching subject list:", error, error.response?.data);
        return null;
      }
    };

    const handleFetchSubjectAndHomework = async () => {
      const fetchedSubject = await fetchSubjectList();
      if (fetchedSubject) {
        console.log(`[DEBUG] Fetched subject: ${fetchedSubject}, calling fetchHomeworkData`);
        await fetchHomeworkData(fetchedSubject);
      } else {
        console.error("Failed to fetch or resolve subject");
        // Fallback: if we have a subject in the URL, try to use it directly
        if (subject && typeof subject === "string") {
          console.log(`[DEBUG] Fallback: Using subject from URL: ${subject}`);
          // Try different capitalization formats to match database
          // Common formats: "CompSci", "compsci", "Compsci"
          const subjectVariations = [
            subject.charAt(0).toUpperCase() + subject.slice(1).toLowerCase(), // Compsci
            subject.charAt(0).toUpperCase() + subject.slice(1), // CompSci (if already mixed case)
            subject.toLowerCase(), // compsci
            subject.toUpperCase(), // COMPSCI
          ];
          
          // Try the most common format first: CompSci
          const capitalizedSubject = subject === "compsci" ? "CompSci" : subjectVariations[0];
          console.log(`[DEBUG] Trying capitalized subject: ${capitalizedSubject}`);
          setCurrentSubject(capitalizedSubject);
          setUploadData((prev) => ({ ...prev, subject: capitalizedSubject }));
          await fetchHomeworkData(capitalizedSubject);
        }
      }
    };

    handleFetchSubjectAndHomework();
    fetchWeekNumber();
  }, [subject]);

  const fetchWeekNumber = async () => {
    try {
      const response = await instance.get("/get-week-number");
      console.log("response for week number", response);
      console.log(
        "today's week with respect to the set sehan date",
        response.data["week_number"]
      );
      let weekNumber = response.data["week_number"] - 1;
      // If week number goes beyond 6, default to 0 (week 1)
      if (weekNumber > 5) {
        weekNumber = 0;
      }
      setCurrentWeek(weekNumber);
      setSehanStartDate(response.data["sehan_start_date"]);
    } catch (e) {
      console.log("Error occured", e);
    }
  };

  const delay = (delayInms) => {
    return new Promise((resolve) => setTimeout(resolve, delayInms));
  };
  const handleUploadSubmit = async (event) => {
    event.preventDefault();

    console.log("upload homework data", uploadData);

    // check if date and file is select (don't check for text. It is optional)
    if (!uploadData.assignedDate) {
      alert("Date is a required field.");
      return;
    }

    if (uploadData.file && uploadData.file.type !== "application/pdf") {
      alert("Please submit only pdf files");
      return;
    }

    // Prevent duplicate submissions
    if (isSubmittingRef.current) return;

    isSubmittingRef.current = true; // Mark as submitting
    reRender(); // Force re-render to disable the button

    await delay(500);

    let homework_id = null;
    const homework = currentSubject && homeworkData[currentSubject] 
      ? homeworkData[currentSubject].find(
          (hw) => hw.assignedDate === uploadData.assignedDate
        )
      : null;

    if (!uploadData.file && !uploadData.text_attachment) {
      alert("Submit either file or text!");
      isSubmittingRef.current = false;
      reRender();
      return;
    }

    if (homework) {
      homework_id = homework.homework_id;
    }

    console.log("upload text_attachment", uploadData.text_attachment);

    // Create a FormData object to handle the file and metadata
    const formData = new FormData();
    if (uploadData.file) {
      formData.append("file", uploadData.file);
    }
    if (homework_id) {
      formData.append("homework_id", homework_id);
    }
    formData.append("text_attachment", uploadData.text_attachment || "");

    console.log("formdata", formData);

    try {
      // Send the form data to the backend
      const response = await instance.post("/api/submissions", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      alert("Homework uploaded successfully");
      fetchHomeworkData(currentSubject);
      // Refresh homework data and close the dialog after a successful upload
      // await fetchHomeworkData(currentSubject);
      setIsUploadOpen(false);
    } catch (error) {
      if (error.response) {
        alert(error.response.data.message || "Error uploading homework");
      }
    } finally {
      isSubmittingRef.current = false; // Reset submission state
      reRender(); // Re-enable the button
    }
  };

  // 숙제 업로드 버튼
  const handleUpload = (homework = null) => {
    if (homework) {
      setUploadData({
        submission_id: homework.submission_id,
        assignedDate: homework.assignedDate,
        subject: currentSubject || homework.subject,
        file: null,
        student_file_name: homework.student_file_name,
        text_attachment: homework.text_attachment,
      });
    } else {
      // When clicking the main upload button, automatically set the current subject
      const subjectToUse = currentSubject || (subjects.length > 0 ? subjects[0].subject_name : null);
      console.log("[DEBUG] Setting upload data with subject:", subjectToUse, "currentSubject:", currentSubject);
      setUploadData({ 
        assignedDate: "", 
        subject: subjectToUse, 
        file: null,
        text_attachment: "",
      });
    }
    setIsUploadOpen(true);
  };

  const chartData = useMemo(() => {
    if (!currentSubject) {
      return [];
    }
    const subjectData = homeworkData[currentSubject];

    if (!subjectData || subjectData.length === 0) {
      return [];
    }

    const allData =
      subjectData
        .filter((homework) => homework.submitted && homework.marks)
        .map((hw) => ({
          date: hw.assignedDate, //.split("/").slice(1).join("/"), // Only day
          marks: hw.marks,
        })) || [];

    console.log("allData", allData);

    // Calculate the start and end dates for the current week
    // Replace with your actual start date

    console.log("sehanStartDate", sehanStartDate);
    const a = new Date(sehanStartDate);
    const utc = a.getTime() + a.getTimezoneOffset() * 60000;
    const weekStartDate = new Date(utc);

    weekStartDate.setDate(weekStartDate.getDate() + currentWeek * 7); // Start of the week
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6); // End of the week

    console.log("weekstartdate", weekStartDate);
    // Filter data to include only entries within the week range
    const weekData = subjectData
      .filter((homework) => {
        if (!homework.submitted || !homework.marks || !homework.assignedDate) {
          return false;
        }
        // Parse date from "YYYY/MM/DD" format
        const [year, month, day] = homework.assignedDate.split("/").map(Number);
        const homeworkDate = new Date(year, month - 1, day);
        return homeworkDate >= weekStartDate && homeworkDate <= weekEndDate;
      })
      .map((hw) => ({
        date: hw.assignedDate.split("/").slice(1).join("/"), // Only day and month
        marks: hw.marks,
      }));

    console.log("weekdata", weekData);

    const sortedData = weekData.sort((a, b) => {
      const dateA = new Date(`2025/${a.date}`); // Add year for comparison
      const dateB = new Date(`2025/${b.date}`);
      return dateA - dateB; // Sort ascending
    });

    const weekStart = currentWeek * 7;
    return sortedData; //.slice(weekStart, weekStart + 7);
  }, [homeworkData, currentSubject, currentWeek]);

  const pendingDates = useMemo(() => {
    const currentUploadData = homeworkData[uploadData.subject] || [];
    console.log("currentUploadData", currentUploadData);
    if (currentUploadData.length > 0) {
      return currentUploadData.map((hw) => hw.assignedDate);
    } else {
      return [];
    }
  }, [homeworkData, uploadData.subject]);

  const pendingDatesFiltered = useMemo(() => {
    const currentUploadData = homeworkData[uploadData.subject] || [];
    console.log("currentUploadData", currentUploadData);
    console.log("homework data in pendingdates filtered", homeworkData);
    console.log("uploaddata.subject", uploadData.subject);
    if (currentUploadData.length > 0) {
      return currentUploadData
        .filter((hw) => !hw.submitted)
        .map((hw) => hw.assignedDate);
    } else {
      return [];
    }
  }, [homeworkData, uploadData.subject]);

  const stats = useMemo(() => {
    const subjectData = homeworkData[currentSubject];

    if (!subjectData || subjectData.length === 0) {
      return {
        submissionRate: 0,
        averageScore: 0,
        totalHomework: 0,
        submitted: 0,
        pending: 0,
      }; // Return default values if data is not available
    }

    const submittedHomework = subjectData.filter((hw) => hw.submitted);
    const pendingHomework = subjectData.filter((hw) => !hw.submitted);

    const submitted = submittedHomework.length;
    const submittedAndCorrectedLength = submittedHomework.filter(
      (homework) => homework.marks !== null
    ).length;
    const pending = pendingHomework.length;
    const totalHomework = submitted + pending;
    const submissionRate = Math.round((submitted / totalHomework) * 100);
    const totalMarks = submittedHomework.reduce((sum, hw) => sum + hw.marks, 0);
    const averageScore =
      submitted > 0 ? (totalMarks / submittedAndCorrectedLength).toFixed(2) : 0;
    console.log(
      "total marks submitted",
      totalMarks,
      submittedAndCorrectedLength
    );

    return {
      submissionRate,
      averageScore,
      totalHomework,
      submitted,
      pending,
    };
  }, [homeworkData, currentSubject]);

  const { submissionRate, averageScore, totalHomework, submitted, pending } =
    stats;

  const averageScoreColor = averageScore > 0 && averageScore <= 7 
    ? markColors2[Math.floor(averageScore) - 1] 
    : markColors2[0];

  const handleSubjectChange = useCallback((subject) => {
    setUploadData((prev) => ({ ...prev, subject, date: "" }));
  }, []);

  const currentHomeworkData = homeworkData[currentSubject] || [];

  const handleEditClick = (e, homework) => {
    e.stopPropagation(); // Prevents the card's onClick from firing
    setIsEditing(true); // Switches to editing mode
    setEditHomeworkData({
      assignedDate: homework.assignedDate,
      subject: currentSubject,
      file: null,
      text_attachment: homework.text_attachment,
    }); // Loads the current homework data into the form
    setUploadData({
      submission_id: homework.submission_id,
      assignedDate: homework.assignedDate,
      subject: currentSubject,
      file: null,
      student_file_name: homework.student_file_name,
      text_attachment: homework.text_attachment,
    });
    console.log("editting info", currentSubject);
  };

  // todo
  const handleEditSubmit = async (e) => {
    e.preventDefault();

    console.log("edithomeworkdata", uploadData);
    console.log("uploaddata file", uploadData.file);

    if (!uploadData.assignedDate) {
      alert("Date is a required field.");
      return;
    }

    if (uploadData.file && uploadData.file.type !== "application/pdf") {
      alert("Please submit only pdf files");
    }

    // Prevent duplicate submissions
    if (isSubmittingRef.current) return;

    isSubmittingRef.current = true; // Mark as submitting
    reRender(); // Force re-render to disable the button

    await delay(500);

    let homework_id = null;
    const homework = currentSubject && homeworkData[currentSubject] 
      ? homeworkData[currentSubject].find(
          (hw) => hw.assignedDate === uploadData.assignedDate
        )
      : null;

    if (homework) {
      homework_id = homework.homework_id;
    }

    // Create a FormData object to handle the file and metadata
    const formData = new FormData();
    formData.append("file", uploadData.file);
    formData.append("homework_id", homework_id);
    formData.append("text_attachment", uploadData.text_attachment);

    console.log("formdata", formData);

    try {
      // Check if homework is past due before allowing edit
      if (homework) {
        const isPastDue = homework.dueDate 
          ? new Date(homework.dueDate.replace(/\//g, "-")) < new Date()
          : false;
        
        if (isPastDue) {
          alert("이 숙제의 제출 기한이 지났습니다. 수정할 수 없습니다.");
          isSubmittingRef.current = false;
          reRender();
          return;
        }
      }

      if (uploadData.student_file_name) {
        formData.append("homework_file_name", uploadData.student_file_name);
      }

      const data = await instance.put(
        `/api/submissions/${uploadData.submission_id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      fetchHomeworkData(currentSubject);

      setIsEditing(false);
      setEditHomeworkData(null);

      alert("Homework updated successfully.");
    } catch (error) {
      console.log("error in edit submit", error);
      if (error.response) {
        // Display the backend error message using alert
        alert(error.response.data.message || "An unexpected error occurred.");
      } else {
        // Handle client-side or network errors
        alert("Failed. Please try again.");
      }
    } finally {
      isSubmittingRef.current = false; // Reset submission state
      reRender(); // Re-enable the button
    }
  };

  const formatDescription = (homework) => {
    setSelectedHomework(homework);
    setFormattedHomeworkDescription(homework.description.split(/(\r\n|\n)/g));
  };

  return (
    <div
      className="flex h-full w-full"
      style={{
        width: "100%",
        marginTop: "4rem",
        backgroundColor: "#fcfcfc",
      }}
    >
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex gap-8">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-6">
              {currentSubject ? `${currentSubject} 숙제` : "Loading..."}
            </h1>

            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{currentWeek + 1}주</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setCurrentWeek((prev) => Math.max(0, prev - 1))
                    }
                    disabled={currentWeek === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const nextWeek = currentWeek + 1;
                      // If going beyond week 6, reset to week 1 (index 0)
                      setCurrentWeek(nextWeek > 5 ? 0 : nextWeek);
                    }}
                    disabled={false}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <D3BarChart
                    data={chartData}
                    barColor={currentSubject ? subjectColors[currentSubject] : "#d096ff"}
                  />
                </div>
              </CardContent>
            </Card>

            <Tabs
              defaultValue="submitted"
              className="w-full"
              onValueChange={setActiveTab}
            >
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="submitted">제출</TabsTrigger>
                  <TabsTrigger value="pending">
                    미제출 &nbsp;
                    <span className="text-red-500">
                      {currentHomeworkData.length > 0
                        ? currentHomeworkData.filter(
                            (homework) => !homework.submitted
                          ).length
                        : ""}
                    </span>
                  </TabsTrigger>
                </TabsList>
                <Button onClick={() => handleUpload()}>
                  <Upload className="mr-2 h-4 w-4" /> 숙제 업로드
                </Button>
              </div>

              <TabsContent value="submitted">
                <div className="space-y-4">
                  {currentHomeworkData.length > 0 ? (
                    currentHomeworkData
                      .filter((homework) => homework.submitted)
                      .map((homework) => (
                        <Card
                          key={homework.homework_id}
                          className="w-full cursor-pointer hover:bg-gray-50"
                          onClick={() => formatDescription(homework)}
                          style={{
                            borderLeftWidth: "10px",
                            borderLeftColor: currentSubject ? subjectColors[currentSubject] : "#d096ff",
                            borderRadius: "10px",
                            borderTopWidth: "0px",
                            borderBottomWidth: "0px",
                          }}
                        >
                          <CardHeader className="flex flex-row items-center gap-2 py-3 px-4">
                            <div className="flex-grow">
                              <CardTitle className="text-lg">
                                {homework.title}
                              </CardTitle>
                              <p
                                className="text-xs text-muted-foreground"
                                style={{ marginBottom: "0.5rem" }}
                              >
                                제출 날짜: {homework.submission_date}
                              </p>
                            </div>
                            <div
                              className={`w-8 h-8 rounded-full ${
                                markColors[homework.marks - 1]
                              } flex items-center justify-center text-black font-bold`}
                            >
                              {homework.marks}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="me-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFileClick(homework.student_file_name);
                              }}
                              disabled={!homework.student_file_name}
                            >
                              내 파일 보기
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="me-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFileClick(homework.homework_file_name);
                              }}
                              disabled={!homework.homework_file_name}
                            >
                              문제파일 보기
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className={`ml-2 bg-gray-200 hover:bg-gray-300 text-gray-800`}
                              onClick={(e) => {
                                handleEditClick(e, homework);
                              }}
                            >
                              <Edit className="mr-1 h-3 w-3" /> 편집
                            </Button>
                          </CardHeader>
                        </Card>
                      ))
                  ) : (
                    <p>no submission</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="pending">
                <div className="space-y-4">
                  {currentHomeworkData.length > 0 ? (
                    currentHomeworkData
                      .filter((homework) => !homework.submitted)
                      .map((homework) => {
                        // Check if homework is past due
                        const isPastDue = homework.dueDate 
                          ? new Date(homework.dueDate.replace(/\//g, "-")) < new Date()
                          : false;
                        
                        // Check if current KST time is before assigned date
                        // Homework should be enabled if assigned date <= today (using <= as requested)
                        const isBeforeAssignedDate = homework.assignedDate
                          ? (() => {
                              // Parse assigned date (format: YYYY/MM/DD)
                              const [year, month, day] = homework.assignedDate.split("/").map(Number);
                              const assignedDateObj = new Date(year, month - 1, day);
                              // Set to start of day (00:00:00) so homework is available on the assigned date
                              assignedDateObj.setHours(0, 0, 0, 0);
                              const now = new Date();
                              // Set current time to start of day for date-only comparison
                              const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                              // If assigned date <= today, homework is enabled (isBeforeAssignedDate = false)
                              // So isBeforeAssignedDate = !(assignedDateObj <= today)
                              // This means: if assigned date > today, then it's before (disabled)
                              return !(assignedDateObj <= today);
                            })()
                          : false;
                        
                        const isDisabled = isBeforeAssignedDate || isPastDue;
                        
                        return (
                          <Card
                            key={homework.homework_id}
                            className={`w-full ${isDisabled ? "opacity-60 bg-gray-100 cursor-not-allowed" : "cursor-pointer hover:bg-gray-50"}`}
                            onClick={() => {
                              if (!isDisabled) {
                                formatDescription(homework);
                              }
                            }}
                            style={{
                              borderLeftWidth: "10px",
                              borderLeftColor: currentSubject ? subjectColors[currentSubject] : "#d096ff",
                              borderRadius: "10px",
                              borderTopWidth: "0px",
                              borderBottomWidth: "0px",
                            }}
                          >
                            <CardHeader className="flex flex-row items-center gap-2 py-3 px-4">
                              {/* <div className={`w-1 self-stretch bg-[${subjectColors[currentSubject]}]`} /> */}
                              <div className="flex-grow">
                                <CardTitle className={`text-lg ${isDisabled ? "text-gray-500" : ""}`}>
                                  {homework.title}
                                </CardTitle>
                                <p
                                  className={`text-xs ${isPastDue ? "text-red-500" : isBeforeAssignedDate ? "text-blue-500" : "text-muted-foreground"}`}
                                  style={{ marginBottom: "0.5rem" }}
                                >
                                  {isBeforeAssignedDate && (
                                    <span className="block mb-1">할당 날짜: {homework.assignedDate} (아직 시작 전)</span>
                                  )}
                                  마감 날짜: {homework.dueDate} {isPastDue ? "(기한 초과)" : ""}
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="me-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isBeforeAssignedDate) {
                                    alert("이 숙제는 아직 할당 날짜 전입니다.");
                                    return;
                                  }
                                  handleFileClick(homework.homework_file_name);
                                }}
                                disabled={!homework.homework_file_name || isBeforeAssignedDate}
                              >
                                문제파일 보기
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isDisabled}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isBeforeAssignedDate) {
                                    alert("이 숙제는 아직 할당 날짜 전입니다.");
                                    return;
                                  }
                                  if (isPastDue) {
                                    alert("이 숙제의 제출 기한이 지났습니다.");
                                    return;
                                  }
                                  handleUpload(homework);
                                }}
                                className={isDisabled ? "opacity-50 cursor-not-allowed" : ""}
                              >
                                <Upload className="mr-1 h-3 w-3" /> 업로드
                              </Button>
                            </CardHeader>
                          </Card>
                        );
                      })
                  ) : (
                    <p>no homework</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="w-64">
            <Card>
              <CardHeader>
                <CardTitle>숙제 통계</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium">제출률</h3>
                    <div className="mt-2 flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: `${submissionRate}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm font-medium">
                        {submissionRate}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">평균 점수</h3>
                    <p
                      className="text-2xl font-bold mt-1 "
                      style={{ color: averageScoreColor }}
                    >
                      {averageScore}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">전체 숙제</h3>
                    <p className="text-2xl font-bold mt-1">{totalHomework}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">제출</h3>
                    <p className="text-2xl font-bold mt-1 text-green-600">
                      {submitted}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">미제출</h3>
                    <p className="text-2xl font-bold mt-1 text-red-600">
                      {pending}
                    </p>
                  </div>
                  <div className="border-t pt-4">{renderBoundariesDisplay()}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>숙제 업로드</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleUploadSubmit}>
            <div>
              <Label htmlFor="subject">과목</Label>
              <Select
                value={uploadData.subject || currentSubject || ""}
                onValueChange={handleSubjectChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder={uploadData.subject || currentSubject || "Select subject"} />
                </SelectTrigger>
                <SelectContent>
                  {subjects.length > 0 ? (
                    subjects.map((subject) => (
                      <SelectItem
                        key={subject.subject_name}
                        value={subject.subject_name}
                      >
                        {subject.subject_name}
                      </SelectItem>
                    ))
                  ) : (
                    // Fallback: show current subject if subjects list is empty
                    currentSubject && (
                      <SelectItem key={currentSubject} value={currentSubject}>
                        {currentSubject}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date">날짜</Label>
              <Select
                value={uploadData.assignedDate}
                onValueChange={(value) =>
                  setUploadData((prev) => ({ ...prev, assignedDate: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select date" />
                </SelectTrigger>
                <SelectContent>
                  {pendingDatesFiltered.map((assignedDate) => (
                    <SelectItem key={assignedDate} value={assignedDate}>
                      {assignedDate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="file">파일</Label>
              <Input
                id="file"
                type="file"
                accept="application/pdf"
                onChange={(e) =>
                  setUploadData((prev) => ({
                    ...prev,
                    file: e.target.files?.[0] || null,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="text_attachment">텍스트</Label>
              <Textarea
                id="text_attachment"
                placeholder="Enter your text here"
                value={uploadData.text_attachment}
                onChange={(e) =>
                  setUploadData((prev) => ({
                    ...prev,
                    text_attachment: e.target.value,
                  }))
                }
              />
            </div>
            <Button type="submit" disabled={isSubmittingRef.current}>
              {isSubmittingRef.current ? "Submitting..." : "제출"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {isEditing && (
        <Dialog open={!!isEditing} onOpenChange={() => setIsEditing(false)}>
          {" "}
          {/* Can be a modal component */}
          <DialogContent>
            <DialogHeader>
              <DialogTitle>숙제 수정</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleEditSubmit}>
              <div>
                <Label htmlFor="subject">과목</Label>
                <Select
                  value={uploadData.subject}
                  onValueChange={handleSubjectChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem
                        key={subject.subject_name}
                        value={subject.subject_name}
                      >
                        {subject.subject_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date">날짜</Label>
                <Select
                  value={uploadData.assignedDate}
                  onValueChange={(value) =>
                    setUploadData((prev) => ({ ...prev, assignedDate: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select date" />
                  </SelectTrigger>
                  <SelectContent>
                    {pendingDates.map((assignedDate) => (
                      <SelectItem key={assignedDate} value={assignedDate}>
                        {assignedDate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="file">파일</Label>
                <div className="flex-col items-center">
                  <Input
                    id="homework-file"
                    className="hidden"
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setUploadData((prev) => ({
                        ...prev,
                        file, // store the file itself
                        student_file_name: file?.name || null, // store the file name
                      }));
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      document.getElementById("homework-file")?.click()
                    }
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Choose File
                  </Button>
                  <div className="mt-1">
                    <span className="text-sm text-gray-500">
                      {uploadData.student_file_name
                        ? uploadData.student_file_name
                        : "No file chosen"}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="text_attachment">텍스트</Label>
                <Textarea
                  id="text_attachment"
                  placeholder="Enter your text here"
                  value={uploadData.text_attachment}
                  onChange={(e) =>
                    setUploadData((prev) => ({
                      ...prev,
                      text_attachment: e.target.value,
                    }))
                  }
                />
              </div>
              <Button type="submit" disabled={isSubmittingRef.current}>
                {isSubmittingRef.current ? "Submitting..." : "변경"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {selectedHomework && (
        <Dialog
          open={!!selectedHomework}
          onOpenChange={() => setSelectedHomework(null)}
        >
          <DialogContent
            style={{
              maxWidth: "64rem",
              zIndex: "10000",
              marginTop: "30px",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <DialogHeader>
              <DialogTitle>
                {selectedHomework?.title || "Loading..."}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <p>
                <strong>숙제 설명:</strong>{" "}
                {formattedHomeworkDescription.map((line, index) => {
                  if (line === "\n" || line === "\r\n") {
                    // If the segment is a newline character, render a <br>
                    return <br key={index} />;
                  } else {
                    // Otherwise, render the text content within a span or fragment
                    // Use a key for each element in the map for React performance
                    return <span key={index}>{line}</span>;
                  }
                })}
              </p>

            {/* Grade Display */}
            {renderGradeDisplay(selectedHomework)}

              {/* {selectedHomework?.marks && (
                <p>
                  <strong>점수:</strong> {selectedHomework.marks}/7 (
                  {selectedHomework.raw_score}/{selectedHomework.total_score})
                </p>
              )} */}
              {selectedHomework?.teacher_comment_file_name && (
                <div>
                  <strong>피드백 파일:</strong>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFileClick(
                        selectedHomework?.teacher_comment_file_name
                      );
                    }}
                    disabled={!selectedHomework?.teacher_comment_file_name}
                  >
                    피드백 파일 보기
                  </Button>
                </div>
              )}
              {selectedHomework?.comment && (
                <div>
                  <strong>피드백:</strong>
                  <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                    <div style={{ whiteSpace: "pre-wrap" }}>
                      {selectedHomework.comment}
                    </div>
                  </ScrollArea>
                </div>
              )}
              {selectedHomework?.file && (
                <Button
                  variant="outline"
                  onClick={() => window.open(selectedHomework.file, "_blank")}
                >
                  <Download className="mr-2 h-4 w-4" /> 파일 다운로드
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
