import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LockIcon } from "lucide-react";
import axios from 'axios';
import { storeTokens } from '../../utils/privateTutoringAuth';

const PrivateTutoringLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    try {
      // Call real API for authentication
      const response = await axios.post('/api/private-tutoring/auth/login', {
        username: username,
        password: password
      });

      if (response.data.success) {
        // Store tokens and teacher info
        storeTokens(response.data.token, response.data.refresh_token, response.data.teacher);
        localStorage.setItem('teacherName', response.data.teacher.name);
        
        navigate('/private-tutoring/dashboard');
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError('Login error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Private Tutoring Login
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button className="w-full mt-6" type="submit">
              <LockIcon className="w-4 h-4 mr-2" />
              Login
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <div className="w-full space-y-2">
            <p className="text-sm text-center text-gray-500">
              Private tutoring system. Teachers only.
            </p>
            <div className="text-center text-xs text-gray-400">
              <strong>Demo:</strong> sarah.kim/password123 or michael.chen/password123
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PrivateTutoringLogin;
