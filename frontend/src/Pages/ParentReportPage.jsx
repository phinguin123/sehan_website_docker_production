import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import instance from "../apis/AxiosInterceptor";

export default function ParentReportPage() {
  const [children, setChildren] = useState([]);

  useEffect(() => {
    fetchChildList();
  }, []);

  const fetchChildList = async () => {
    try {
      const response = await instance.get("/api/parent/getChildList");
      const childrenData = response.data;

      setChildren(childrenData);
    } catch (error) {
      if (error.response) {
        // Display the backend error message using alert
        alert(error.response.data.message || "An unexpected error occurred.");
      } else {
        // Handle client-side or network errors
        alert("Failed to connect to the server. Please try again.");
      }
    }
  };

  const handleStudentClick = async (student_id) => {
    try {
      const response = await instance.get("/api/reports/availability");
    } catch (e) {
      if (e.response?.data.message) {
        alert(e.response.data.message);
      }
      return;
    }
    const url = `/api/api/reports/students/${student_id}`;
    window.open(url, "_blank");
  };

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col`}>
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-semibold text-gray-900">Student List</h1>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Students
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Select a student to view more information
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {children.map((child) => (
              <Card
                key={child.student_id}
                className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStudentClick(child.student_id);
                }}
              >
                <CardHeader>
                  <CardTitle className="text-center">{child.name}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          &copy; 2025 Student List System
        </div>
      </footer>
    </div>
  );
}
