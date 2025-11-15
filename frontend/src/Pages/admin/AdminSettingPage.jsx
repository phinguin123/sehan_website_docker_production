import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import api from "@/apis/AxiosInterceptor";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { RefreshCw, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminSettingPage() {
  const [studentId, setStudentId] = useState("");
  const [examEndTime, setExamEndTime] = useState("");
  const [hoursBefore, setHoursBefore] = useState("");
  const [reportNotice, setReportNotice] = useState("");
  const [credentialsNotice, setCredentialsNotice] = useState("");
  const [confirmation, setConfirmation] = useState({
    show: false,
    type: "credentialsAll",
  });

  useEffect(() => {
    const fetchExamEndTime = async () => {
      try {
        const result = await api.get("/settings/exam_end_time");
        console.log("exam end time", result);
        setExamEndTime(result.data?.exam_end_time);
        setHoursBefore(result.data?.hours_before);
      } catch (error) {
        console.log("error fetching exam end time");
      }
    };

    const fetchNoticeText = async () => {
      try {
        const result = await api.get("/settings/report/notice_text");
        setReportNotice(result.data?.notice_text);
      } catch (error) {
        console.log("error fetching notice text");
      }
    };

    const fetchCredentialsNoticeText = async () => {
      try {
        const result = await api.get("/settings/credentials");
        setCredentialsNotice(result.data?.credentials_notice_text);
      } catch (error) {
        console.log("error fetching credentials notice text");
      }
    };

    //fetchExamEndTime();
    //fetchNoticeText();
    //fetchCredentialsNoticeText();
  }, []);

  const confirmOkay = async () => {
    setConfirmation({ show: false, type: "credentialsAll" });
    if (confirmation.type === "credentialsAll") {
      await handleSendCredentials();
      return;
    } else if (confirmation.type === "credentialsOne") {
      await handleSendOne();
      return;
    } else if (confirmation.type === "resetServer") {
      await handleResetServer();
      return;
    }
    return;
  };

  const handleSendCredentials = async () => {
    try {
      await api.post("/api/settings/credentials", { credentialsNotice });
      window.alert("Student credentials message sent");
    } catch (error) {
      console.error("Error sending message", error);
      window.alert("There was an error sending test message.");
    }
  };

  const handleSendAll = async () => {
    try {
      await api.post("/settings");
      window.alert("Test message sent");
    } catch (error) {
      console.error("Error sending test message", error);
      window.alert("There was an error sending test message.");
    }
  };

  const handleSendOne = async () => {
    if (!studentId) {
      window.alert("Please enter a student ID");
      return;
    }
    try {
      await api.post(`/api/settings/credentials/${studentId}`);
      window.alert("Test message sent");
    } catch (error) {
      console.error("Error sending test message", error);
      window.alert("There was an error sending test message.");
    }
  };

  const handleSetExamEndTime = async () => {
    if (!examEndTime) {
      window.alert("Please select an exam end time");
      return;
    }
    try {
      await api.post("/settings/exam_end_time", {
        examEndTime,
        hoursBefore: hoursBefore ? Number.parseInt(hoursBefore) : 0,
      });
      window.alert("Exam end time set successfully");
    } catch (error) {
      console.error("Error setting exam end time", error);
      window.alert("There was an error setting the exam end time.");
    }
  };

  const handleSetReportNotice = async () => {
    if (!reportNotice) {
      window.alert("Please enter a report notice text");
      return;
    }
    try {
      await api.post("/settings/report/notice_text", { reportNotice });
      window.alert("Report notice text set successfully");
    } catch (error) {
      console.error("Error setting report notice", error);
      window.alert("There was an error setting the report notice text.");
    }
  };

  const handleResetServer = async () => {
    if (
      window.confirm(
        "Are you sure you want to reset the server? This action cannot be undone."
      )
    ) {
      try {
        await api.post("/settings/reset");
        window.alert("Server has been reset successfully");
      } catch (error) {
        console.error("Error resetting server", error);
        window.alert("There was an error resetting the server.");
      }
    }
  };

  const cancelConfirmation = () => {
    setConfirmation({ show: false, type: "credentialsAll" });
  };

  return (
    <div className="flex flex-col items-center justify-center bg-background p-8 rounded-lg shadow-md">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-primary">Settings</h1>
        <div className="flex flex-col gap-6 w-full">
          {/* <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label htmlFor="examEndTime">Exam End Time</Label>
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="hoursBefore"
                  className="text-sm whitespace-nowrap"
                >
                  Hours Before:
                </Label>
                <Input
                  id="hoursBefore"
                  type="number"
                  min="0"
                  max="72"
                  placeholder="0"
                  value={hoursBefore}
                  onChange={(e) => setHoursBefore(e.target.value)}
                  className="w-16"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                id="examEndTime"
                type="datetime-local"
                value={examEndTime}
                onChange={(e) => setExamEndTime(e.target.value)}
                className="flex-grow"
              />
              <Button
                onClick={handleSetExamEndTime}
                className="whitespace-nowrap"
              >
                Save Time Settings
              </Button>
            </div>
          </div> */}

          <div className="space-y-2">
            <Label htmlFor="reportNotice">Report Notice Text</Label>
            <Textarea
              id="reportNotice"
              placeholder="Enter report notice text..."
              value={reportNotice}
              onChange={(e) => setReportNotice(e.target.value)}
              className="w-full min-h-[100px]"
            />
            <Button onClick={handleSetReportNotice} className="w-full">
              Set Notice Text
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="credentials">Credentials Notice Text</Label>
            {/* <Textarea
              id="credentials"
              placeholder="Enter credentials notice..."
              value={credentialsNotice}
              onChange={(e) => setCredentialsNotice(e.target.value)}
              className="w-full min-h-[100px]"
            /> */}
            <Button
              onClick={() =>
                setConfirmation({ show: true, type: "credentialsAll" })
              }
              className="w-full transition-colors hover:bg-primary/90"
            >
              Send Credentials
            </Button>
          </div>
          {/* <Button
          onClick={handleSendAll}
          className="w-full transition-colors hover:bg-primary/90"
        >
          Alimtalk Check (All)
        </Button> */}
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Student ID"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="flex-grow"
            />
            <Button
              onClick={() =>
                setConfirmation({ show: true, type: "credentialsOne" })
              }
              className="transition-colors hover:bg-primary/90"
            >
              Credentials Check
            </Button>
          </div>

          {/* Server Management Section */}
          <div className="w-full">
            <Card className="mt-3 w-full border-destructive/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Server Management
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Use these controls with caution. Actions performed here may
                affect system functionality.
              </CardContent>
              <CardFooter>
                <Button
                  variant="destructive"
                  onClick={handleResetServer}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reset Server
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>

      <AlertDialog open={confirmation.show} onOpenChange={cancelConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{"Confirmation"}</AlertDialogTitle>
            <AlertDialogDescription>
              {"Send credentials?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter
            style={{ display: "flex", justifyContent: "center" }}
          >
            <AlertDialogCancel onClick={cancelConfirmation}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmOkay}
              style={{ marginTop: "7px", borderTop: "1px solid #000" }}
            >
              Okay
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
