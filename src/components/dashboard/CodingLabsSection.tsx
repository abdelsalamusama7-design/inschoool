import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Code2, Terminal, Gamepad2, FlaskConical } from 'lucide-react';

const labs = [
  {
    key: 'scratch',
    title: 'Scratch Lab',
    description: 'Build games & stories with visual blocks',
    icon: Code2,
    gradient: 'from-orange-400 to-amber-500',
    url: '/dashboard/labs/scratch',
    available: true,
  },
  {
    key: 'python',
    title: 'Python Lab',
    description: 'Write real code with Python',
    icon: Terminal,
    gradient: 'from-blue-500 to-cyan-500',
    url: '/dashboard/labs/python',
    available: true,
  },
  {
    key: 'roblox',
    title: 'Roblox Lab',
    description: 'Create games in Roblox Studio',
    icon: Gamepad2,
    gradient: 'from-red-500 to-pink-500',
    url: '/dashboard/labs/roblox',
    available: false,
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

      <div className="grid gap-4 sm:grid-cols-3">
        {labs.map((lab) => (
          <Card
            key={lab.key}
            className={`group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg ${
              lab.available
                ? 'hover:scale-[1.02]'
                : 'opacity-75 hover:opacity-90'
            }`}
            onClick={() => navigate(lab.url)}
          >
            {/* Top gradient bar */}
            <div className={`h-2 bg-gradient-to-r ${lab.gradient}`} />

            <CardContent className="p-5 flex flex-col items-center text-center gap-3">
              {/* Icon */}
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${lab.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
              >
                <lab.icon className="w-8 h-8 text-white" />
              </div>

              {/* Title & description */}
              <div>
                <h3 className="font-bold text-base">{lab.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {lab.description}
                </p>
              </div>

              {/* Status badge */}
              {!lab.available && (
                <Badge variant="secondary" className="text-xs">
                  Coming Soon
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CodingLabsSection;
