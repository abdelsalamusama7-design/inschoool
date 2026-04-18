import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import StudentDashboard from './dashboard/StudentDashboard';
import ParentDashboard from './dashboard/ParentDashboard';
import InstructorDashboard from './dashboard/InstructorDashboard';
import AdminDashboard from './dashboard/AdminDashboard';
import NoRoleAssigned from '@/components/dashboard/NoRoleAssigned';

const Dashboard = () => {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderDashboard = () => {
    switch (role) {
      case 'student':
        return <StudentDashboard />;
      case 'parent':
        return <ParentDashboard />;
      case 'instructor':
        return <InstructorDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <NoRoleAssigned />;
    }
  };

  return (
    <DashboardLayout>
      {renderDashboard()}
    </DashboardLayout>
  );
};

export default Dashboard;
