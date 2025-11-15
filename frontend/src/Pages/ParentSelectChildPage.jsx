import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import '../Styles/App.css'
import instance from '../apis/AxiosInterceptor'

export default function ParentSelectChildPage() {
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState('')
  const [students, setStudents] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    // Fetch students when component mounts
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const response = await instance.get(`${import.meta.env.VITE_API_BASE_URL}/api/student/for-parent`)
      setStudents(response.data)
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await instance.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/parent/submit-name`,
        {selectedStudent},
        
      )

      if (response.status !== 200) {
        throw new Error('Failed to submit name')
      }
      console.log('submitted')
      navigate('/parent/dashboard') // Redirect to a success page
      
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStudentChange = (value) => {
    const currentStudent = students.find(student => student.student_id === value);
    console.log("selectedstudent",currentStudent)
    if (currentStudent){
      setSelectedStudent(currentStudent)
    }
  }

  return (
    <div className="w-full flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute left-1/4 top-1/4 w-48 h-48 bg-white rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute right-1/4 top-1/2 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute left-1/2 bottom-1/4 w-60 h-60 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>
      <Card className="w-full max-w-md z-1">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Enter Your Name</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="student">Select Student</Label>
              <Select value={selectedStudent.student_id} onValueChange={handleStudentChange}>
                <SelectTrigger id="student">
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.student_id} value={student.student_id}>
                      {student.name} - {student.school}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading || !selectedStudent}
            >
              {isLoading ? 'Submitting...' : 'Submit'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}