import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import instance from "@/apis/axiosInstance";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const DownloadPDFButton = () => {
  const [studentId, setStudentId] = useState("");
  const [gradeList, setGradeList] = useState([]);
  const [modeList, setModeList] = useState();
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedMode, setSelectedMode] = useState("");
  const [confirmation, setConfirmation] = useState({
    show: false,
    type: "deleteAllComments",
  });

  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const response = await instance.get("/api/reference");
        setGradeList(response.data.grades);
        setModeList(response.data.modes);
      } catch (error) {
        if (error.response) {
          alert(error.message);
        }
        console.error("Error fetching data:", error);
      }
    };
    fetchReferenceData();
  }, []);

  const handleAllCommentDelete = async () => {
    try {
      const response = await instance.delete("/api/comments");
      alert("Deleted all comments!");
    } catch (error) {
      if (error.response) {
        alert(error.response.data.message);
      }
    }
  };

  const handleGenerateStudentReport = async () => {
    try {
      const response = await instance.post("/api/reports/students");
      alert("Generating student reports...");
    } catch (error) {
      if (error.response) {
        alert(error.response.data.message);
      }
    }
  };

  const [reportGenerationStatus, setReportGenerationStatus] = useState({
    taskId: null,
    status: null,
    isGenerating: false,
    error: null,
  });

  const pollTaskStatus = async (taskId) => {
    try {
      const response = await instance.get(`/api/reports/students/status/${taskId}`);
      const status = response.data.status;

      if (status === "SUCCESS") {
        setReportGenerationStatus({
          taskId,
          status: "SUCCESS",
          isGenerating: false,
          error: null,
        });
        // Automatically download when ready
        await downloadGeneratedReport(taskId);
        return true; // Task completed
      } else if (status === "FAILURE") {
        setReportGenerationStatus({
          taskId,
          status: "FAILURE",
          isGenerating: false,
          error: response.data.error || "Report generation failed",
        });
        alert(`Report generation failed: ${response.data.error || "Unknown error"}`);
        return true; // Task failed
      } else {
        // PENDING or STARTED - continue polling
        setReportGenerationStatus({
          taskId,
          status,
          isGenerating: true,
          error: null,
        });
        return false; // Task still in progress
      }
    } catch (error) {
      console.error("Error checking task status:", error);
      setReportGenerationStatus({
        taskId,
        status: "ERROR",
        isGenerating: false,
        error: error.response?.data?.error || "Failed to check status",
      });
      return true; // Stop polling on error
    }
  };

  const downloadGeneratedReport = async (taskId) => {
    try {
      const response = await instance.get(`/api/reports/students/download/${taskId}`, {
        responseType: "blob",
      });

      // Check if the response is actually a blob (zip file) or JSON error
      const contentType = response.headers["content-type"] || "";
      
      // If the response is JSON (error), parse it and show the error
      if (contentType.includes("application/json") || contentType.includes("text/json")) {
        const text = await response.data.text();
        try {
          const errorData = JSON.parse(text);
          alert(`Error downloading report: ${errorData.error || "Unknown error"}`);
          return;
        } catch (e) {
          alert("Error downloading the report. Please try again.");
          return;
        }
      }

      // Verify it's a zip file by checking the content type or file header
      if (!contentType.includes("application/zip") && !contentType.includes("application/octet-stream")) {
        // Try to read first bytes to check if it's actually a zip file
        const blob = response.data;
        const firstBytes = await blob.slice(0, 2).arrayBuffer();
        const header = new Uint8Array(firstBytes);
        
        // ZIP files start with "PK" (0x50 0x4B)
        if (header[0] !== 0x50 || header[1] !== 0x4B) {
          // Not a zip file, likely an error response
          const text = await blob.text();
          try {
            const errorData = JSON.parse(text);
            alert(`Error downloading report: ${errorData.error || "Unknown error"}`);
          } catch (e) {
            alert("Error downloading the report. The file appears to be invalid.");
          }
          return;
        }
      }

      const contentDisposition = response.headers["content-disposition"];
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
        : `student_reports_${taskId}.zip`;

      // Create a Blob URL for the downloaded ZIP file
      const url = window.URL.createObjectURL(new Blob([response.data]));

      // Create an anchor tag and simulate a click to download the file
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);

      document.body.appendChild(link);
      link.click();

      link.parentNode.removeChild(link); // Clean up the DOM
      window.URL.revokeObjectURL(url); // Free memory

      // Reset status after successful download
      setReportGenerationStatus({
        taskId: null,
        status: null,
        isGenerating: false,
        error: null,
      });
    } catch (error) {
      console.error("Error downloading the report:", error);
      
      // If the error response has data, try to parse it
      if (error.response?.data) {
        try {
          // If it's a blob, try to read it as text
          if (error.response.data instanceof Blob) {
            const text = await error.response.data.text();
            const errorData = JSON.parse(text);
            alert(`Error downloading report: ${errorData.error || "Unknown error"}`);
          } else {
            alert(`Error downloading report: ${error.response.data.error || "Unknown error"}`);
          }
        } catch (e) {
          alert("Error downloading the report. Please try again.");
        }
      } else {
        alert("Error downloading the report. Please try again.");
      }
    }
  };

  const handleStudentReportDownload = async () => {
    try {
      // Reset status
      setReportGenerationStatus({
        taskId: null,
        status: null,
        isGenerating: true,
        error: null,
      });

      // Trigger the async task
      const response = await instance.get("/api/reports/students");
      const taskId = response.data.task_id;

      if (!taskId) {
        throw new Error("No task ID returned from server");
      }

      setReportGenerationStatus({
        taskId,
        status: "PENDING",
        isGenerating: true,
        error: null,
      });

      alert("Report generation started! This may take a few minutes. Please wait...");

      // Start polling for status
      let pollInterval = setInterval(async () => {
        const isComplete = await pollTaskStatus(taskId);
        if (isComplete) {
          clearInterval(pollInterval);
        }
      }, 3000); // Poll every 3 seconds

      // Set a timeout to stop polling after 10 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        setReportGenerationStatus((prev) => {
          if (prev.isGenerating && prev.taskId === taskId) {
            return {
              ...prev,
              isGenerating: false,
              error: "Report generation is taking longer than expected. Please check back later.",
            };
          }
          return prev;
        });
      }, 600000); // 10 minutes timeout
    } catch (error) {
      console.error("Error starting report generation:", error);
      setReportGenerationStatus({
        taskId: null,
        status: "ERROR",
        isGenerating: false,
        error: error.response?.data?.error || "Failed to start report generation",
      });
      alert(
        error.response?.data?.error ||
          "Error starting report generation. Please try again."
      );
    }
  };

  const handleAttendanceReportDownload = async () => {
    if (!selectedGrade) {
      alert("Please select a grade");
      return;
    }

    // if (!selectedMode) {
    //   alert("Please select a mode (Online/Offline)");
    //   return;
    // }

    try {
      const response = await instance.get("/api/reports/attendance", {
        params: {
          grade_name: gradeList.find(
            (grade) => grade.grade_id === selectedGrade
          )?.grade_name,
        },
        responseType: "blob", // Important for downloading files
      });

      const contentDisposition = response.headers.get("Content-Disposition");
      console.log("filename is", contentDisposition);
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1]?.replace(/"/g, "") // Parse filename
        : `attendance_report_grade.csv`; // Default fallback filename

      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));

      // Create a link element and click it to download the file
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);

      // Append to the document body and click
      document.body.appendChild(link);
      link.click();

      // Clean up and remove the link
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading the attendance report:", error);
      alert("Error downloading the attendance report. Please try again.");
    }
  };

  const handleStudentReportSend = async () => {
    try {
      const response = await instance.post("/api/reports/send");
    } catch (error) {
      console.log(error);
    }
  };

  const confirmOkay = async () => {
    setConfirmation({ isOpen: false, type: "deleteAllComments" });
    if (confirmation.type === "deleteAllComments") {
      await handleAllCommentDelete();
      return;
    } else if (confirmation.type === "sendAllStudentReports") {
      await handleStudentReportSend();
      return;
    }
    return;
  };

  const cancelConfirmation = () => {
    setConfirmation({ isOpen: false, type: "deleteAllComments" });
  };

  return (
    <div className="flex flex-col space-y-6 p-4 max-w-md mx-auto">
      {/* Student Report Section */}
      <Card>
        <CardHeader>
          <CardTitle>Student Reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleStudentReportDownload}
            className="w-full"
            disabled={reportGenerationStatus.isGenerating}
          >
            {reportGenerationStatus.isGenerating
              ? `Generating... (${reportGenerationStatus.status || "PENDING"})`
              : "Generate Student Reports"}
          </Button>
          {reportGenerationStatus.error && (
            <p className="text-sm text-red-500">{reportGenerationStatus.error}</p>
          )}
          {reportGenerationStatus.status === "SUCCESS" && (
            <p className="text-sm text-green-500">Report generated successfully!</p>
          )}
          <Button
            onClick={() =>
              setConfirmation({ isOpen: true, type: "sendAllStudentReports" })
            }
            className="w-full"
          >
            Send All Student Reports
          </Button>
          <Button
            onClick={() =>
              setConfirmation({ isOpen: true, type: "deleteAllComments" })
            }
            className="w-full"
          >
            Delete all comments
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Attendance Report Section */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Grade</label>
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger>
                <SelectValue placeholder="Choose grade" />
              </SelectTrigger>

              <SelectContent>
                {gradeList?.map((grade) => (
                  <SelectItem key={grade.grade_id} value={grade.grade_id}>
                    {grade.grade_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* <div className="space-y-2">
            <label className="text-sm font-medium">Select Mode</label>
            <Select value={selectedMode} onValueChange={setSelectedModeID}>
              <SelectTrigger>
                <SelectValue placeholder="Choose mode" />
              </SelectTrigger>
              <SelectContent>
                {modeList?.map((mode) => (
                  <SelectItem key={mode.mode_id} value={mode.mode_id}>
                    {mode.mode_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div> */}

          <Button
            onClick={handleAttendanceReportDownload}
            className="w-full"
            disabled={!selectedGrade}
          >
            Download Attendance Report
          </Button>
        </CardContent>
      </Card>
      <Dialog open={confirmation.isOpen} onOpenChange={cancelConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm</DialogTitle>
            <DialogDescription>Are you sure?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelConfirmation}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmOkay}>
              Okay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DownloadPDFButton;
