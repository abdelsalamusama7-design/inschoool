import DashboardLayout from '@/components/dashboard/DashboardLayout';
import StudentManagement from './dashboard/StudentManagement';

const StudentsPage = () => {
  return (
    <DashboardLayout>
      <StudentManagement />
    </DashboardLayout>
  );
};

export default StudentsPage;
