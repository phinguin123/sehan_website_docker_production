import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LockIcon } from "lucide-react";
import instance from "../apis/AxiosInterceptor";
import { useNavigate } from "react-router-dom";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }

    try {
      // Send the form data to the backend
      const response = await instance.post('/api/admin-login', {
        username: username,
        password: password,
      });
      console.log("response", response);

      if (response.status !== 200) {
        throw new Error("Failed to Login");
      }
      console.log("submitted");
      navigate("/secure-sehan-admin/dashboard"); // Redirect to a success page
    } catch (error) {
      if (error.response) {
        alert(error.response.data.msg);
      }
      console.error("Error loggin in:", error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Admin Login
          </CardTitle>
          {/* <CardDescription className="text-center">Enter your credentials to access the admin panel</CardDescription> */}
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
          <p className="text-sm text-center text-gray-500 w-full">
            Protected area. Authorized personnel only.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
