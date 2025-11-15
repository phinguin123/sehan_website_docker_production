import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Pencil, Trash2 } from 'lucide-react'
import instance from '../apis/AxiosInterceptor'

export default function AdminstudentSettingsPage() {
  const [students, setstudents] = useState([])
  const [newstudent, setNewstudent] = useState({ student_id: null, name: '', email: '', password: '', phone: '' })
  const [isEditing, setIsEditing] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, studentId: null })

  useEffect(() => {
    fetchstudentList()
  }, [])

  const fetchstudentList = async () => {
    try {
			const response = await instance.get(`${import.meta.env.VITE_API_BASE_URL}/api/student/manual/getList`, {withCredentials: true});
			console.log("received student list response:", response.data);

       // Filter the response data to exclude students with null email
      const filteredStudents = response.data.filter(student => student.email !== null);

			setstudents(filteredStudents);
		} catch (error) {
			console.error("Error fetching student list:", error);
		}
    // Simulated API call
  }

  const handleInputChange = (e) => {
    setNewstudent({ ...newstudent, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newstudent.name || !newstudent.email) {
      alert("Name and email are required fields.")
      return
    }

    // Simulated API call
    if (isEditing) {
      await instance.put(`${import.meta.env.VITE_API_BASE_URL}/api/student/edit`, newstudent);
				setstudents(students.map(student => 
					student.student_id === newstudent.student_id ? newstudent : student
				));
      alert("student updated successfully.")
    } else {
      const response = await instance.post(`${import.meta.env.VITE_API_BASE_URL}/api/student/register/manual`, newstudent);
      alert("New student added successfully.")
      fetchstudentList()
    }

    setNewstudent({ student_id: null, name: '', email: '', password: ''})
    setIsEditing(false)
  }

  const handleEdit = (student) => {
    setNewstudent({ ...student, password: '' })
    setIsEditing(true)

    window.scrollTo(0, 0)
  }

  const handleDeleteConfirmation = async (id) => {
    setDeleteConfirmation({ isOpen: true, studentId: id })
  }

  const handleDelete = async () => {
    if (deleteConfirmation.studentId) {
			try {
				await instance.delete(`${import.meta.env.VITE_API_BASE_URL}/api/student/delete`, {
          headers: { 'Content-Type': 'application/json' },
          data: { student_id: deleteConfirmation.studentId }
        });
				setstudents(students.filter(student => student.student_id !== deleteConfirmation.studentId));
        window.alert("student deleted successfully.")
			} catch (error) {
				console.error("Error deleting student:", error);
        window.alert("There was an error deleting the student.")
			} finally {
				setDeleteConfirmation({ isOpen: false, studentId: null });
			}
		}
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Student Management</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? 'Edit student' : 'Add New student'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" value={newstudent.name} onChange={handleInputChange} required />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={newstudent.email} onChange={handleInputChange} required />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" value={newstudent.password} onChange={handleInputChange} required />
              </div>
              <Button type="submit">{isEditing ? 'Update student' : 'Add student'}</Button>
              {isEditing && (
                <Button type="button" variant="outline" onClick={() => {
                  setNewstudent({ student_id: null, name: '', email: '', password: ''})
                  setIsEditing(false)
                }}>
                  Cancel Edit
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Current students</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Password</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.student_id}>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.password}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="icon" onClick={() => handleEdit(student)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleDeleteConfirmation(student.student_id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <Dialog open={deleteConfirmation.isOpen} onOpenChange={(isOpen) => setDeleteConfirmation({ ...deleteConfirmation, isOpen })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this student? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmation({ isOpen: false, studentId: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}