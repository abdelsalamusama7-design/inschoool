import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Code2, Play, Sparkles } from 'lucide-react';

const ScratchLabCard = () => {
  const navigate = useNavigate();

  return (
    <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 border-dashed border-orange-300/50 hover:border-orange-400/80"
      onClick={() => navigate('/dashboard/labs/scratch')}
    >
      {/* Gradient accent bar */}
      <div className="h-2 bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400" />
      
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          {/* Big colorful icon */}
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Code2 className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-primary-foreground" />
            </div>
          </div>

          {/* Text content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
              Scratch Lab 🧩
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Build games, stories & animations with visual coding blocks!
            </p>
          </div>

          {/* Action button */}
          <Button
            size="sm"
            className="gap-2 shrink-0 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/dashboard/labs/scratch');
            }}
          >
            <Play className="h-4 w-4" />
            Open Lab
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScratchLabCard;
