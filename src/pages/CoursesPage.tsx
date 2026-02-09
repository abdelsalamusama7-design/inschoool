import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import StudentCourses from './dashboard/StudentCourses';
import InstructorCourses from './dashboard/InstructorCourses';

const CoursesPage = () => {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      {role === 'instructor' ? (
        <InstructorCourses />
      ) : (
        <StudentCourses />
      )}
    </DashboardLayout>
  );
};

export default CoursesPage;
