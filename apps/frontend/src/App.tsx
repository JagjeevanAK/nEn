import { Route, Routes } from "react-router-dom";
import "./App.css";
import Home from "./pages/Dashboard";
import { SignIn } from "./pages/SignIn";
import { Signup } from "./pages/Signup";
import Profile from "./pages/Profile";
import { SidebarProvider } from "./components/ui/sidebar";
import { AppSidebar } from "./components/AppSidebar";
import WorkflowPage from "./pages/WorkflowPage";
import CreateWorkflowPage from "./pages/CreateWorkflowPage";
import { ProtectedRoute } from "./components/ProtectedRoute";

function App() {
  return (
    <>
      <Routes>
        {/* Auth routes without sidebar */}
        <Route element={<SignIn />} path="/signin" />
        <Route element={<Signup />} path="/signup" />

        {/* Protected routes with sidebar */}
        <Route
          element={
            <ProtectedRoute>
              <SidebarProvider>
                <AppSidebar />
                <Home />
              </SidebarProvider>
            </ProtectedRoute>
          }
          path="/"
        />
        
        {/* Create new workflow route */}
        <Route
          element={
            <ProtectedRoute>
              <SidebarProvider>
                <AppSidebar /> 
                <CreateWorkflowPage />
              </SidebarProvider>
            </ProtectedRoute>
          }
          path="/create"
        />
        
        {/* View existing workflow route */}
        <Route
          element={
            <ProtectedRoute>
              <SidebarProvider>
                <AppSidebar /> 
                <WorkflowPage />
              </SidebarProvider>
            </ProtectedRoute>
          }
          path="/workflow/:workflowId"
        />

        {/* Profile route */}
        <Route
          element={
            <ProtectedRoute>
              <SidebarProvider>
                <AppSidebar /> 
                <Profile />
              </SidebarProvider>
            </ProtectedRoute>
          }
          path="/profile"
        />
      </Routes>
    </>
  );
}

export default App;