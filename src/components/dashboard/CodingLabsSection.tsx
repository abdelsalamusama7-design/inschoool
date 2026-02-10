import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Code2, Terminal, Gamepad2, Blocks, FlaskConical } from 'lucide-react';

const labs = [
  {
    key: 'scratch',
    title: 'Scratch Lab',
    description: 'Build games & stories with visual blocks',
    icon: Code2,
    gradient: 'from-orange-400 to-amber-500',
    url: '/dashboard/labs/scratch',
  },
  {
    key: 'python',
    title: 'Python Lab',
    description: 'Write real code with Python',
    icon: Terminal,
    gradient: 'from-blue-500 to-cyan-500',
    url: '/dashboard/labs/python',
  },
  {
    key: 'roblox',
    title: 'Roblox Lab',
    description: 'Create games in Roblox Studio',
    icon: Gamepad2,
    gradient: 'from-red-500 to-pink-500',
    url: '/dashboard/labs/roblox',
  },
  {
    key: 'minecraft',
    title: 'Minecraft Coding',
    description: 'Code & automate in Minecraft',
    icon: Blocks,
    gradient: 'from-green-500 to-emerald-500',
    url: '/dashboard/labs/minecraft',
  },
];

const CodingLabsSection = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <FlaskConical className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Coding Labs</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {labs.map((lab) => (
          <Card
            key={lab.key}
            className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
            onClick={() => navigate(lab.url)}
          >
            <div className={`h-2 bg-gradient-to-r ${lab.gradient}`} />
            <CardContent className="p-5 flex flex-col items-center text-center gap-3">
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${lab.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
              >
                <lab.icon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-base">{lab.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{lab.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CodingLabsSection;
