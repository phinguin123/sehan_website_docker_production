import "@/styles/App.css";
// import {Text} from "@chakra-ui/react"
import KakaoLogin from "@/components/common/KakaoLogin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import instance from "@/apis/axiosInstance";
import { resetAlert } from "@/utils/helpers/alertOnce";

// function LoginPage(){
//   return(
//     <div className="App">
//       <header className="App-header">
//         <Text
// 		  bgGradient='linear(to-l, #72a5f7 , #edf4ff)'
// 	      bgClip='text'
// 	      fontSize='7xl'
// 	      fontWeight='extrabold'
//         >
// 	  	  Welcome to Sehan IB
// 	    </Text>
//       	<KakaoLogin />
// 	  </header>
//     </div>
//   );

// }

// export default LoginPage;

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Footer from '@/components/layout/Footer';

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Reset the alert state when the component mounts
    resetAlert();
  }, []);

  const handleManualLogin = async (e) => {
    e.preventDefault();
    // Implement manual login logic here
    if (!email || !password) {
      window.alert("email and password are required fields.");
      return;
    }

    try {
      // Send the form data to the backend
      const response = await instance.post("/api/auth-ext/student/login", {
        email: email,
        password: password,
      });
      console.log("response", response);

      if (response.status !== 200) {
        window.alert("Failed to Login");
        throw new Error("Failed to Login");
      }
      console.log("submitted");
      navigate("/"); // Redirect to a success page
    } catch (error) {
      if (error.response && error.response.data) {
        alert(error.response.data.msg);
      }
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
          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              {/* <TabsTrigger value="button">Kakao Login</TabsTrigger> */}
              <TabsTrigger value="manual">Manual Login</TabsTrigger>
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
            {/* <TabsContent class="!mt-6" value="button">
              <div className="space-y-4 text-center">
                <KakaoLogin />
              </div>
            </TabsContent> */}
          </Tabs>
        </CardContent>
      </Card>

      <div className="absolute bottom-0 w-full flex justify-center z-10">
        <Footer />
      </div>
    </div>
  );
}

function KakaoIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 1.5a10.5 10.5 0 1 0 0 21 10.5 10.5 0 0 0 0-21Z" />
      <path d="M12.75 14.25v-3.75a1.5 1.5 0 0 0-3 0v3.75" />
      <path d="M8.25 14.25v-3.75a1.5 1.5 0 0 0-3 0v3.75" />
      <path d="M17.25 14.25v-3.75a1.5 1.5 0 0 0-3 0v3.75" />
    </svg>
  );
}

// Add this to your global CSS file or in a style tag in your layout
