import DashboardLayout from '@/components/dashboard/DashboardLayout';
import LiveSessionsManagement from './dashboard/LiveSessionsManagement';

const LiveSessionsPage = () => {
  return (
    <DashboardLayout>
      <LiveSessionsManagement />
    </DashboardLayout>
  );
};

export default LiveSessionsPage;
