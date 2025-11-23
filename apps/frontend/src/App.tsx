import { Route, Routes } from "react-router-dom";
import "./App.css";
import Home from "./pages/Dashboard";
import SignIn from "./pages/SignIn";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import { SidebarProvider } from "./components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import WorkflowPage from "./pages/WorkflowPage";
import CreateWorkflowPage from "./pages/CreateWorkflowPage";

function App() {
  return (
    <>
      <SidebarProvider>
        <Routes>
          <Route
            element={
              <>
                <AppSidebar />
                <Home />
              </>
            }
            path="/"
          />
          
          {/* Create new workflow route */}
          <Route
            element={
              <>
                <AppSidebar /> 
                <CreateWorkflowPage />
              </>
            }
            path="/create"
          />
          
          {/* View existing workflow route */}
          <Route
            element={
              <>
                <AppSidebar /> 
                <WorkflowPage />
              </>
            }
            path="/workflow/:workflowId"
          />

          {/* Profile route */}
          <Route
            element={
              <>
                <AppSidebar /> 
                <Profile />
              </>
            }
            path="/profile"
          />

          <Route element={<SignIn />} path="/signin" />
          <Route element={<Signup />} path="/signup" />
        </Routes>
      </SidebarProvider>
    </>
  );
}

export default App;