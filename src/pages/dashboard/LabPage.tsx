import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Blocks, Terminal, Gamepad2, Construction } from 'lucide-react';
import ScratchLabPage from './ScratchLabPage';
import PythonLabPage from './PythonLabPage';

const labConfig: Record<string, { title: string; icon: React.ComponentType<{ className?: string }>; description: string; color: string }> = {
  minecraft: {
    title: 'Minecraft Coding',
    icon: Blocks,
    description: 'Learn to code by building and automating in the Minecraft world.',
    color: 'bg-green-500/10 text-green-600 border-green-200',
  },
  python: {
    title: 'Python Playground',
    icon: Terminal,
    description: 'Write and run Python code directly in the browser with interactive challenges.',
    color: 'bg-blue-500/10 text-blue-600 border-blue-200',
  },
  gamification: {
    title: 'Coding Gamification',
    icon: Gamepad2,
    description: 'Earn points, badges, and level up as you complete coding challenges.',
    color: 'bg-purple-500/10 text-purple-600 border-purple-200',
  },
  roblox: {
    title: 'Roblox Lab',
    icon: Gamepad2,
    description: 'Create immersive games and experiences in Roblox Studio.',
    color: 'bg-red-500/10 text-red-600 border-red-200',
  },
};

const LabPage = () => {
  const { labType } = useParams<{ labType: string }>();

  // Scratch Lab is fully functional
  if (labType === 'scratch') {
    return <ScratchLabPage />;
  }

  // Python Lab is fully functional
  if (labType === 'python') {
    return <PythonLabPage />;
  }

  const config = labConfig[labType || ''];

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Lab not found</p>
      </div>
    );
  }

  const IconComponent = config.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-xl ${config.color}`}>
          <IconComponent className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{config.title}</h1>
          <p className="text-muted-foreground">{config.description}</p>
        </div>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="p-4 rounded-full bg-muted">
            <Construction className="w-10 h-10 text-muted-foreground" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Coming Soon</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              We're working hard to bring you {config.title}. Stay tuned for updates!
            </p>
          </div>
          <Badge variant="secondary" className="mt-2">
            Under Development
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
};

export default LabPage;
