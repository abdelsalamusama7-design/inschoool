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
import CurriculumGeneratorPage from "./pages/CurriculumGeneratorPage";
import SchedulePage from "./pages/SchedulePage";
import StudentsPage from "./pages/StudentsPage";
import ProgressPage from "./pages/ProgressPage";
import LabPage from "./pages/LabPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import LessonsManagementPage from "./pages/LessonsManagementPage";
import LiveSessionsPage from "./pages/LiveSessionsPage";
import TutorialVideosPage from "./pages/TutorialVideosPage";
import UserManagementPage from "./pages/UserManagementPage";
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
                <ProtectedRoute allowedRoles={['instructor', 'admin']}>
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
                <ProtectedRoute allowedRoles={['student', 'parent']}>
                  <SubscriptionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/admin/subscriptions"
              element={
                <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                  <AdminSubscriptionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/curriculum-generator"
              element={
                <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                  <CurriculumGeneratorPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/schedule"
              element={
                <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                  <SchedulePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/students"
              element={
                <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                  <StudentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/lessons"
              element={
                <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                  <LessonsManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/live-sessions"
              element={
                <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                  <LiveSessionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/tutorial-videos"
              element={
                <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                  <TutorialVideosPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/progress"
              element={
                <ProtectedRoute allowedRoles={['student', 'parent']}>
                  <ProgressPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/labs/:labType"
              element={
                <ProtectedRoute allowedRoles={['student', 'instructor', 'admin']}>
                  <LabPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/leaderboard"
              element={
                <ProtectedRoute>
                  <LeaderboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UserManagementPage />
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
