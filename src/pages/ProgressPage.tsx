import DashboardLayout from '@/components/dashboard/DashboardLayout';
import StudentProgress from './dashboard/StudentProgress';

const ProgressPage = () => {
  return (
    <DashboardLayout>
      <StudentProgress />
    </DashboardLayout>
  );
};

export default ProgressPage;
