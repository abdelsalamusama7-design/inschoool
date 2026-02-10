import { useParams } from 'react-router-dom';
import ScratchLabPage from './ScratchLabPage';
import PythonLabPage from './PythonLabPage';
import RobloxLabPage from './RobloxLabPage';
import MinecraftLabPage from './MinecraftLabPage';

const LabPage = () => {
  const { labType } = useParams<{ labType: string }>();

  if (labType === 'scratch') return <ScratchLabPage />;
  if (labType === 'python') return <PythonLabPage />;
  if (labType === 'roblox') return <RobloxLabPage />;
  if (labType === 'minecraft') return <MinecraftLabPage />;

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <p className="text-muted-foreground">Lab not found</p>
    </div>
  );
};

export default LabPage;
