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
import instance from "@/apis/AxiosInterceptor";
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

  const handleStudentReportDownload = async () => {
    try {
      const response = await instance.get("/api/reports/students", {
        responseType: "blob", // Important to handle binary data
      });

      const contentDisposition = response.headers["content-disposition"];
      console.log("content disposition", contentDisposition);
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1]?.replace(/"/g, "") // Parse filename
        : `student_report.zip`; // Default fallback filename

      // Create a Blob URL for the downloaded ZIP file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      console.log("filename", filename);

      // Create an anchor tag and simulate a click to download the file
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);

      document.body.appendChild(link);
      link.click();

      link.parentNode.removeChild(link); // Clean up the DOM
      window.URL.revokeObjectURL(url); // Free memory
    } catch (error) {
      console.error("Error downloading the PDF:", error);
      alert("Error downloading the PDF. Please try again.");
    }

    return;

    if (!studentId) {
      alert("Please enter a student ID");
      return;
    }

    try {
      const response = await instance.get("/generate_pdf/${studentId}", {
        responseType: "blob", // Important for downloading files
      });

      const contentDisposition = response.headers["content-disposition"];
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1]?.replace(/"/g, "") // Parse filename
        : `student_report_${studentId}.pdf`; // Default fallback filename

      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response?.data]));

      // Create a link element and click it to download the file
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename); // Specify the file name

      // Append to the document body and click
      document.body.appendChild(link);
      link.click();

      // Clean up and remove the link
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error("Error downloading the PDF:", error);
      alert("Error downloading the PDF. Please try again.");
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
          <Button onClick={handleStudentReportDownload} className="w-full">
            Generate Student Reports
          </Button>
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
