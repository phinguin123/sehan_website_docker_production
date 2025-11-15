import React, { useState, useEffect } from "react";
import { Plus, Minus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import instance from "../apis/AxiosInterceptor";

const initialTimeSlots = [
  { time_slot_id: 1, start_time: "08:00", end_time: "09:00" },
  { time_slot_id: 2, start_time: "09:00", end_time: "10:00" },
  { time_slot_id: 3, start_time: "10:00", end_time: "11:00" },
  { time_slot_id: 4, start_time: "11:00", end_time: "12:00" },
  { time_slot_id: 5, start_time: "13:00", end_time: "14:00" },
  { time_slot_id: 6, start_time: "14:00", end_time: "15:00" },
  { time_slot_id: 7, start_time: "15:00", end_time: "16:00" },
  { time_slot_id: 8, start_time: "16:00", end_time: "17:00" },
];

const manualTimeSlots = [
  {
    time_slot_id: "29cc62fa-b8da-42c2-9710-b7d8734d20f4",
    start_time: "08:45",
    end_time: "09:45",
  },
  {
    time_slot_id: "1f3d0f4a-ad91-4d1b-a024-8b3e497329bf",
    start_time: "09:50",
    end_time: "10:50",
  },
  {
    time_slot_id: "c7ce6db3-c5e5-43a7-b37c-65512045ea35",
    start_time: "10:55",
    end_time: "11:55",
  },
  {
    time_slot_id: "508b616f-0d8d-4f56-9028-5bd6d64bb864",
    start_time: "12:00",
    end_time: "13:00",
  },
  {
    time_slot_id: "91702ebb-cd62-4858-89e0-3d55738d2d95",
    start_time: "14:00",
    end_time: "15:00",
  },
  {
    time_slot_id: "a5d9165b-6207-407b-84e4-5b8c99c7d979",
    start_time: "15:05",
    end_time: "16:05",
  },
  {
    time_slot_id: "f548fc88-b51e-41d2-9905-f3a110ea2bd2",
    start_time: "16:10",
    end_time: "17:10",
  },
];
const manualTimetables = [
  {
    day: "Monday",
    timeSlots: [
      {
        time_slot_id: "1f3d0f4a-ad91-4d1b-a024-8b3e497329bf",
        entries: [
          {
            timetable_id: 4869,
            subject_name: "Biology",
            level_id: "2",
            level_name: null,
            teacher_id: 22,
            modeID: 2,
          },
          {
            timetable_id: 4870,
            subject_name: "Physics",
            level_id: "2",
            level_name: null,
            teacher_id: 33,
            modeID: 2,
          },
        ],
      },
      {
        time_slot_id: "29cc62fa-b8da-42c2-9710-b7d8734d20f4",
        entries: [
          {
            timetable_id: 4871,
            subject_name: "Math AA",
            level_id: "2",
            level_name: null,
            teacher_id: 19,
            modeID: 2,
          },
        ],
      },
      {
        time_slot_id: "508b616f-0d8d-4f56-9028-5bd6d64bb864",
        entries: [
          {
            timetable_id: 4872,
            subject_name: "English B",
            level_id: "3",
            level_name: null,
            teacher_id: 24,
            modeID: 2,
          },
        ],
      },
      {
        time_slot_id: "91702ebb-cd62-4858-89e0-3d55738d2d95",
        entries: [
          {
            timetable_id: 4873,
            subject_name: "Economics",
            level_id: "3",
            level_name: null,
            teacher_id: 16,
            modeID: 2,
          },
        ],
      },
      {
        time_slot_id: "a5d9165b-6207-407b-84e4-5b8c99c7d979",
        entries: [
          {
            timetable_id: 4874,
            subject_name: "Chemistry",
            level_id: "2",
            level_name: null,
            teacher_id: 22,
            modeID: 2,
          },
        ],
      },
      {
        time_slot_id: "c7ce6db3-c5e5-43a7-b37c-65512045ea35",
        entries: [
          {
            timetable_id: 4875,
            subject_name: "English A",
            level_id: "3",
            level_name: null,
            teacher_id: 24,
            modeID: 2,
          },
          {
            timetable_id: 4876,
            subject_name: "Korean Lit",
            level_id: "3",
            level_name: null,
            teacher_id: 21,
            modeID: 2,
          },
        ],
      },
      {
        time_slot_id: "f548fc88-b51e-41d2-9905-f3a110ea2bd2",
        entries: [
          {
            timetable_id: 4877,
            subject_name: "Business",
            level_id: "3",
            level_name: null,
            teacher_id: 25,
            modeID: 2,
          },
        ],
      },
    ],
  },
  {
    day: "Tuesday",
    timeSlots: [
      {
        time_slot_id: "1f3d0f4a-ad91-4d1b-a024-8b3e497329bf",
        entries: [
          {
            timetable_id: 4869,
            subject_name: "Biology",
            level_id: "2",
            level_name: null,
            teacher_id: 22,
            modeID: 2,
          },
          {
            timetable_id: 4870,
            subject_name: "Physics",
            level_id: "2",
            level_name: null,
            teacher_id: 33,
            modeID: 2,
          },
        ],
      },
      {
        time_slot_id: "29cc62fa-b8da-42c2-9710-b7d8734d20f4",
        entries: [
          {
            timetable_id: 4871,
            subject_name: "Math AA",
            level_id: "2",
            level_name: null,
            teacher_id: 19,
            modeID: 2,
          },
        ],
      },
      {
        time_slot_id: "508b616f-0d8d-4f56-9028-5bd6d64bb864",
        entries: [
          {
            timetable_id: 4872,
            subject_name: "English B",
            level_id: "3",
            level_name: null,
            teacher_id: 24,
            modeID: 2,
          },
        ],
      },
      {
        time_slot_id: "91702ebb-cd62-4858-89e0-3d55738d2d95",
        entries: [
          {
            timetable_id: 4873,
            subject_name: "Economics",
            level_id: "3",
            level_name: null,
            teacher_id: 16,
            modeID: 2,
          },
        ],
      },
      {
        time_slot_id: "a5d9165b-6207-407b-84e4-5b8c99c7d979",
        entries: [
          {
            timetable_id: 4874,
            subject_name: "Chemistry",
            level_id: "2",
            level_name: null,
            teacher_id: 22,
            modeID: 2,
          },
        ],
      },
      {
        time_slot_id: "c7ce6db3-c5e5-43a7-b37c-65512045ea35",
        entries: [
          {
            timetable_id: 4875,
            subject_name: "English A",
            level_id: "3",
            level_name: null,
            teacher_id: 24,
            modeID: 2,
          },
          {
            timetable_id: 4876,
            subject_name: "Korean Lit",
            level_id: "3",
            level_name: null,
            teacher_id: 21,
            modeID: 2,
          },
        ],
      },
      {
        time_slot_id: "f548fc88-b51e-41d2-9905-f3a110ea2bd2",
        entries: [
          {
            timetable_id: 4877,
            subject_name: "Business",
            level_id: "3",
            level_name: null,
            teacher_id: 25,
            modeID: 2,
          },
        ],
      },
    ],
  },
  {
    day: "Wednesday",
    timeSlots: [
      {
        time_slot_id: "1f3d0f4a-ad91-4d1b-a024-8b3e497329bf",
        entries: [
          {
            timetable_id: 4869,
            subject_name: "Biology",
            level_id: "2",
            level_name: null,
            teacher_id: 22,
            modeID: 2,
          },
          {
            timetable_id: 4870,
            subject_name: "Physics",
            level_id: "2",
            level_name: null,
            teacher_id: 33,
            modeID: 2,
          },
        ],
      },
      {
        time_slot_id: "29cc62fa-b8da-42c2-9710-b7d8734d20f4",
        entries: [
          {
            timetable_id: 4871,
            subject_name: "Math AA",
            level_id: "2",
            level_name: null,
            teacher_id: 19,
            modeID: 2,
          },
        ],
      },
      {
        time_slot_id: "508b616f-0d8d-4f56-9028-5bd6d64bb864",
        entries: [
          {
            timetable_id: 4872,
            subject_name: "English B",
            level_id: "3",
            level_name: null,
            teacher_id: 24,
            modeID: 2,
          },
        ],
      },
      {
        time_slot_id: "91702ebb-cd62-4858-89e0-3d55738d2d95",
        entries: [
          {
            timetable_id: 4873,
            subject_name: "Economics",
            level_id: "3",
            level_name: null,
            teacher_id: 16,
            modeID: 2,
          },
        ],
      },
      {
        time_slot_id: "a5d9165b-6207-407b-84e4-5b8c99c7d979",
        entries: [
          {
            timetable_id: 4874,
            subject_name: "Chemistry",
            level_id: "2",
            level_name: null,
            teacher_id: 22,
            modeID: 2,
          },
        ],
      },
      {
        time_slot_id: "c7ce6db3-c5e5-43a7-b37c-65512045ea35",
        entries: [
          {
            timetable_id: 4875,
            subject_name: "English A",
            level_id: "3",
            level_name: null,
            teacher_id: 24,
            modeID: 2,
          },
          {
            timetable_id: 4876,
            subject_name: "Korean Lit",
            level_id: "3",
            level_name: null,
            teacher_id: 21,
            modeID: 2,
          },
        ],
      },
      {
        time_slot_id: "f548fc88-b51e-41d2-9905-f3a110ea2bd2",
        entries: [
          {
            timetable_id: 4877,
            subject_name: "Business",
            level_id: "3",
            level_name: null,
            teacher_id: 25,
            modeID: 2,
          },
        ],
      },
    ],
  },
  {
    day: "Thursday",
    timeSlots: [
      {
        time_slot_id: "1f3d0f4a-ad91-4d1b-a024-8b3e497329bf",
        entries: [
          {
            timetable_id: 4869,
            subject_name: "Biology",
            level_id: "2",
            level_name: null,
            teacher_id: 22,
            modeID: 2,
          },
          {
            timetable_id: 4870,
            subject_name: "Physics",
            level_id: "2",
            level_name: null,
            teacher_id: 33,
            modeID: 2,
          },
        ],
      },
      {
        time_slot_id: "29cc62fa-b8da-42c2-9710-b7d8734d20f4",
        entries: [
          {
            timetable_id: 4871,
            subject_name: "Math AA",
            level_id: "2",
            level_name: null,
            teacher_id: 19,
            modeID: 2,
          },
        ],
      },
      {
        time_slot_id: "508b616f-0d8d-4f56-9028-5bd6d64bb864",
        entries: [
          {
            timetable_id: 4872,
            subject_name: "English B",
            level_id: "3",
            level_name: null,
            teacher_id: 24,
            modeID: 2,
          },
        ],
      },
      {
        time_slot_id: "91702ebb-cd62-4858-89e0-3d55738d2d95",
        entries: [
          {
            timetable_id: 4873,
            subject_name: "Economics",
            level_id: "3",
            level_name: null,
            teacher_id: 16,
            modeID: 2,
          },
        ],
      },
      {
        time_slot_id: "a5d9165b-6207-407b-84e4-5b8c99c7d979",
        entries: [
          {
            timetable_id: 4874,
            subject_name: "Chemistry",
            level_id: "2",
            level_name: null,
            teacher_id: 22,
            modeID: 2,
          },
        ],
      },
      {
        time_slot_id: "c7ce6db3-c5e5-43a7-b37c-65512045ea35",
        entries: [
          {
            timetable_id: 4875,
            subject_name: "English A",
            level_id: "3",
            level_name: null,
            teacher_id: 24,
            modeID: 2,
          },
          {
            timetable_id: 4876,
            subject_name: "Korean Lit",
            level_id: "3",
            level_name: null,
            teacher_id: 21,
            modeID: 2,
          },
        ],
      },
      {
        time_slot_id: "f548fc88-b51e-41d2-9905-f3a110ea2bd2",
        entries: [
          {
            timetable_id: 4877,
            subject_name: "Business",
            level_id: "3",
            level_name: null,
            teacher_id: 25,
            modeID: 2,
          },
        ],
      },
    ],
  },
];

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const levels = [
  { level_id: 1, level_name: "SL" },
  { level_id: 2, level_name: "HL" },
  { level_id: 3, level_name: "SL/HL" },
];
const grades = [
  { name: "Grade 11", id: "1" },
  { name: "Grade 12", id: "2" },
  { name: "Pre-IB", id: "3" },
];
const modes = [
  { mode_id: 1, mode_name: "Online" },
  { mode_id: 2, mode_name: "Offline" },
];

export default function Component() {
  const [teachers, setTeachers] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [activeGrade, setActiveGrade] = useState("1");
  const [modeID, setModeID] = useState("1");

  useEffect(() => {
    const fetchSubjectList = async () => {
      try {
        const response = await instance.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/get-subjects`,
          { withCredentials: true }
        );
        console.log("received subject list response:", response.data);
        setSubjects(response.data);
      } catch (error) {
        console.error("Error fetching subject list:", error);
      }
    };

    const fetchTeacherList = async () => {
      try {
        const response = await instance.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/admin/getList`,
          { withCredentials: true }
        );
        console.log("received teacher list response:", response.data);
        setTeachers(response.data);
      } catch (error) {
        console.error("Error fetching teacher list:", error);
      }
    };

    fetchSubjectList();
    fetchTeacherList();
  }, []);

  useEffect(() => {
    const fetchTimetables = async () => {
      try {
        const response = await instance.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/settings/timetable`,
          { params: { grade_id: activeGrade, mode_id: modeID } }
        );
        const data = response.data;
        console.log("timetable I am receiving ", data.timetables);
        setTimetables(data.timetables);

        const tempTimeSlots =
          data.timeSlots && data.timeSlots.length > 0 ? data.timeSlots : [];

        setTimeSlots(tempTimeSlots);
      } catch (error) {
        if (error.response) {
          alert(error.response.data.message);
        } else {
          alert("There was an errrrrror");
        }
      }
    };

    fetchTimetables();
  }, [activeGrade, modeID]);

  // TODO this is the optimized solution
  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const [timetableRes, subjectRes, teacherRes] = await Promise.all([
  //         instance.get(`${import.meta.env.VITE_API_BASE_URL}/api/get-timetables`),
  //         instance.get(`${import.meta.env.VITE_API_BASE_URL}/api/get-subjects`, { withCredentials: true }),
  //         instance.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/getList`, { withCredentials: true }),
  //       ]);
  //       setAllTimetables(timetableRes.data);
  //       setTimetables(timetableRes.data[activeGrade]?.timetables || {});
  //       setSubjects(subjectRes.data);
  //       setTeachers(teacherRes.data);
  //     } catch (error) {
  //       console.error("Error fetching data:", error);
  //     }
  //   };
  //   fetchDa  ta();
  // }, []);

  const handleAddTimeSlot = () => {
    const newId = crypto.randomUUID();
    if (timeSlots.length === 0) {
      // Set a sensible default for the very first slot
      setTimeSlots([
        { time_slot_id: newId, start_time: "08:00", end_time: "09:00" },
      ]);
      return;
    }

    const lastSlot = timeSlots[timeSlots.length - 1];
    const newStart = lastSlot.end_time;
    const [hours, minutes] = newStart.split(":");
    const newEnd = `${(parseInt(hours) + 1)
      .toString()
      .padStart(2, "0")}:${minutes}`;
    setTimeSlots([
      ...timeSlots,
      { time_slot_id: newId, start_time: newStart, end_time: newEnd },
    ]);
  };

  const handleRemoveTimeSlot = () => {
    if (timeSlots.length > 1) {
      setTimeSlots(timeSlots.slice(0, -1));
    }
  };

  const handleTimeChange = (slotId, field, value) => {
    const updatedSlots = timeSlots.map((slot) =>
      slot.time_slot_id === slotId ? { ...slot, [field]: value } : slot
    );
    setTimeSlots(updatedSlots);
    // const invalidSlot = updatedSlots.find(
    //   (slot) => slot.start_time >= slot.end_time
    // );
    // if (invalidSlot) {
    //   window.alert("End time must be after start time.");
    // } else {
    //   setTimeSlots(updatedSlots);
    // }
  };

  const handleGradeChange = (value) => setActiveGrade(value);
  const handleModeIDChange = (value) => setModeID(value);

  // Change class info
  const handleClassChange = (day, slotId, entryIdx, field, value) => {
    setTimetables((prev) =>
      prev.map((d) =>
        d.day !== day
          ? d
          : {
              ...d,
              timeSlots: d.timeSlots.map((s) =>
                String(s.time_slot_id) !== String(slotId)
                  ? s
                  : {
                      ...s,
                      entries: s.entries.map((entry, idx) =>
                        idx !== Number(entryIdx)
                          ? entry
                          : { ...entry, [field]: value }
                      ),
                    }
              ),
            }
      )
    );
  };

  const handleAddClass = (day, slotId) => {
    setTimetables((prev) => {
      // Find day or create
      let foundDay = prev.find((d) => d.day === day);
      let newPrev = [...prev];
      if (!foundDay) {
        foundDay = { day, timeSlots: [] };
        newPrev.push(foundDay);
      }
      // Find timeSlot or create
      let foundSlot = foundDay.timeSlots.find(
        (s) => String(s.time_slot_id) === String(slotId)
      );
      if (!foundSlot) {
        foundSlot = { time_slot_id: slotId, entries: [] };
        foundDay.timeSlots.push(foundSlot);
      }
      // Add entry
      foundSlot.entries.push({
        timetable_id: Date.now(),
        subject_name: "",
        level_id: "",
        teacher_id: "",
        modeID: modeID,
      });
      return newPrev.map((d) =>
        d.day !== day
          ? d
          : {
              ...foundDay,
              timeSlots: [...foundDay.timeSlots],
            }
      );
    });
  };

  const handleRemoveClass = (day, slotId, entryIdx) => {
    setTimetables((prev) =>
      prev
        .map((d) =>
          d.day !== day
            ? d
            : {
                ...d,
                timeSlots: d.timeSlots
                  .map((s) =>
                    String(s.time_slot_id) !== String(slotId)
                      ? s
                      : {
                          ...s,
                          entries: s.entries.filter(
                            (_, idx) => idx !== Number(entryIdx)
                          ),
                        }
                  )
                  .filter((s) => s.entries.length > 0),
              }
        )
        .filter((d) => d.timeSlots.length > 0)
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (modeID === "Online") {
      setModeID(1);
    } else if (modeID === "Offline") {
      setModeID(2);
    }

    // console.log;
    // setTimetables(manualTimetables);

    try {
      const response = await instance.post("/api/settings/timetable", {
        grade: activeGrade,
        modeID: modeID,
        timeSlots,
        timetables,
      });
      window.alert("Timetables saved successfully.");
    } catch (error) {
      window.alert("Failed to save timetables.");
    }
  };

  // Helper to get entries for cell
  const getEntries = (day, slotId) => {
    const dayObj = timetables.find((d) => d.day === day);
    if (!dayObj) return [];
    const slotObj = dayObj.timeSlots.find(
      (s) => String(s.time_slot_id) === String(slotId)
    );
    return slotObj ? slotObj.entries : [];
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Timetable Settings</h1>
      <div className="flex items-center mb-4">
        <label className="mr-2 font-medium">Mode:</label>
        <Select value={modeID} onValueChange={handleModeIDChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Select mode" />
          </SelectTrigger>
          <SelectContent>
            {modes.map((m) => (
              <SelectItem key={m.mode_id} value={String(m.mode_id)}>
                {m.mode_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Time Slots</CardTitle>
            <CardDescription>Manage your time slots here</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {timeSlots.map((slot) => (
                <div
                  key={slot.time_slot_id}
                  className="flex items-center space-x-2"
                >
                  <Input
                    type="time"
                    value={slot.start_time}
                    onChange={(e) =>
                      handleTimeChange(
                        slot.time_slot_id,
                        "start_time",
                        e.target.value
                      )
                    }
                    className="w-24"
                  />
                  <span>to</span>
                  <Input
                    type="time"
                    value={slot.end_time}
                    onChange={(e) =>
                      handleTimeChange(
                        slot.time_slot_id,
                        "end_time",
                        e.target.value
                      )
                    }
                    className="w-24"
                  />
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button onClick={handleAddTimeSlot} type="button">
              <Plus className="mr-2 h-4 w-4" /> Add Slot
            </Button>
            <Button
              onClick={handleRemoveTimeSlot}
              variant="outline"
              type="button"
              disabled={timeSlots.length <= 1}
            >
              <Minus className="mr-2 h-4 w-4" /> Remove Slot
            </Button>
          </CardFooter>
        </Card>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Weekly Timetable</CardTitle>
            <CardDescription>
              Set your weekly class schedule for each grade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeGrade} onValueChange={handleGradeChange}>
              <TabsList>
                {grades.map((grade) => (
                  <TabsTrigger key={grade.id} value={grade.id}>
                    {grade.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              {grades.map((grade) => (
                <TabsContent key={grade.id} value={grade.id}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="px-4 py-2">Time Slot</th>
                          {daysOfWeek.map((day) => (
                            <th key={day} className="px-4 py-2">
                              {day}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {timeSlots.map((slot) => (
                          <tr key={slot.time_slot_id}>
                            <td className="border px-4 py-2">{`${slot.start_time} - ${slot.end_time}`}</td>
                            {daysOfWeek.map((day) => (
                              <td
                                key={`${day}-${slot.time_slot_id}`}
                                className="border px-4 py-2"
                              >
                                {getEntries(day, slot.time_slot_id).map(
                                  (value, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center space-x-2 mb-2"
                                    >
                                      <Select
                                        value={value.subject_name}
                                        onValueChange={(newValue) =>
                                          handleClassChange(
                                            day,
                                            slot.time_slot_id,
                                            idx,
                                            "subject_name",
                                            newValue
                                          )
                                        }
                                      >
                                        <SelectTrigger className="w-[180px]">
                                          <SelectValue placeholder="Select class" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {subjects.map((subj) => (
                                            <SelectItem
                                              key={subj.subject_name}
                                              value={subj.subject_name}
                                            >
                                              {subj.subject_name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <Select
                                        value={value.level_id}
                                        onValueChange={(newValue) =>
                                          handleClassChange(
                                            day,
                                            slot.time_slot_id,
                                            idx,
                                            "level_id",
                                            newValue
                                          )
                                        }
                                      >
                                        <SelectTrigger className="w-[100px]">
                                          <SelectValue placeholder="Level" />
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
                                      <Select
                                        value={value.teacher_id}
                                        onValueChange={(newValue) =>
                                          handleClassChange(
                                            day,
                                            slot.time_slot_id,
                                            idx,
                                            "teacher_id",
                                            newValue
                                          )
                                        }
                                      >
                                        <SelectTrigger className="w-[180px]">
                                          <SelectValue placeholder="Teacher">
                                            {teachers.find(
                                              (teacher) =>
                                                teacher.id ===
                                                parseInt(value.teacher_id)
                                            )?.name || "Select Teacher"}
                                          </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                          {teachers.map((teacher) => (
                                            <SelectItem
                                              key={teacher.id}
                                              value={teacher.id}
                                            >
                                              {teacher.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() =>
                                          handleRemoveClass(
                                            day,
                                            slot.time_slot_id,
                                            idx
                                          )
                                        }
                                        type="button"
                                      >
                                        <Minus className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  )
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleAddClass(day, slot.time_slot_id)
                                  }
                                  type="button"
                                >
                                  <Plus className="mr-2 h-4 w-4" /> Add Class
                                </Button>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
          <CardFooter>
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" />
              Save Timetables
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
