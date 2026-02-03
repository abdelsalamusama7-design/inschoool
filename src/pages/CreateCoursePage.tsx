import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import CreateCourse from './dashboard/CreateCourse';

const CreateCoursePage = () => {
  return (
    <DashboardLayout>
      <CreateCourse />
    </DashboardLayout>
  );
};

export default CreateCoursePage;
