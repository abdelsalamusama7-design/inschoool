import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import CoursesPage from "./pages/CoursesPage";
import CreateCoursePage from "./pages/CreateCoursePage";
import CourseDetailPage from "./pages/CourseDetailPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import AdminSubscriptionsPage from "./pages/AdminSubscriptionsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/courses"
              element={
                <ProtectedRoute>
                  <CoursesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/courses/new"
              element={
                <ProtectedRoute allowedRoles={['instructor']}>
                  <CreateCoursePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/courses/:id"
              element={
                <ProtectedRoute>
                  <CourseDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/subscription"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <SubscriptionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/admin/subscriptions"
              element={
                <ProtectedRoute allowedRoles={['instructor']}>
                  <AdminSubscriptionsPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
