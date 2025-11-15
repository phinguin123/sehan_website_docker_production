import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KakaoLogin from "../components/KakaoLogin.jsx";
import instance from "../apis/AxiosInterceptor.jsx";
import { useNavigate } from "react-router-dom";

export default function ParentLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleManualLogin = async (e) => {
    e.preventDefault();
    // Implement manual login logic here
    if (!email || !password) {
      window.alert("email and password are required fields.");
      return;
    }

    try {
      // Send the form data to the backend
      const response = await instance.post("/api/parent-login", {
        email: email,
        password: password,
      });
      console.log("response", response);

      if (response.status !== 200) {
        window.alert("Failed to Login");
        throw new Error("Failed to Login");
      }
      console.log("submitted");
      navigate("/parent/dashboard"); // Redirect to a success page
    } catch (error) {
      console.error("Error loggin in:", error);
    }
  };

  return (
    <div className="w-full flex flex-column items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute left-1/4 top-1/4 w-48 h-48 bg-white rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute right-1/4 top-1/2 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute left-1/2 bottom-1/4 w-60 h-60 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      <Card className="w-full max-w-md relative z-10 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-800">
            Welcome to Sehan IB
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleManualLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
            <Button type="submit" className="w-full">
              Log In
            </Button>
          </form>
          {/* <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Login</TabsTrigger>
              <TabsTrigger value="button">Kakao Login</TabsTrigger>
            </TabsList>
            <TabsContent value="manual">
              <form onSubmit={handleManualLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                <Button type="submit" className="w-full">
                  Log In
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="button">
              <div className="space-y-4 text-center">
                <KakaoLogin />
              </div>
            </TabsContent>
          </Tabs> */}
        </CardContent>
      </Card>
    </div>
  );
}
