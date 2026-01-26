import Router from "./Router";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";

const App = () => (
  <>
    <BrowserRouter>
      <Router />
      <Toaster style={{ zIndex: "999" }} />
    </BrowserRouter>
  </>
);

export default App;