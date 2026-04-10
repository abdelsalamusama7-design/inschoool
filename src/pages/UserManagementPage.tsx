import DashboardLayout from '@/components/dashboard/DashboardLayout';
import UserManagement from './dashboard/UserManagement';

const UserManagementPage = () => {
  return (
    <DashboardLayout>
      <UserManagement />
    </DashboardLayout>
  );
};

export default UserManagementPage;
