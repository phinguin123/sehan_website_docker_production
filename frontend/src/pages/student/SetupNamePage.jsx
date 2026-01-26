import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getCookie } from '@/components/common/Cookie'
import { jwtDecode } from "jwt-decode"
import '@/styles/App.css'
import instance from '@/apis/axiosInstance'

export default function NameEntryPage() {
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    if (!name.trim()) {
      alert('Name is required.')
      return
    }

    try {
      // const jwt_token = getCookie("jwt_access_token")
      // const student_id = jwtDecode(jwt_token)["sub"]
      const response = await instance.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/submit-name`,
        { name },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        },
        
      )

      if (response.status !== 200) {
        throw new Error('Failed to submit name')
      }
      console.log('submitted')
      navigate('/') // Redirect to a success page
      
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
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
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Submitting...' : 'Submit'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}