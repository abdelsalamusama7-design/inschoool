import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Star, Zap, Target } from 'lucide-react';

const tips = [
  {
    icon: Lightbulb,
    title: 'Start Simple',
    text: 'Begin with a small project — try making a sprite move left and right!',
    color: 'text-amber-500',
  },
  {
    icon: Star,
    title: 'Use Loops',
    text: 'Repeat blocks save time. Use "forever" or "repeat" to animate smoothly.',
    color: 'text-primary',
  },
  {
    icon: Zap,
    title: 'Add Sound',
    text: 'Make your project fun! Add sound effects when sprites interact.',
    color: 'text-green-500',
  },
  {
    icon: Target,
    title: 'Test Often',
    text: 'Click the green flag frequently to test your changes as you build.',
    color: 'text-destructive',
  },
];

const CodingTipsPanel = () => {
  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          Coding Tips & Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tips.map((tip, i) => (
          <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
            <tip.icon className={`w-4 h-4 mt-0.5 shrink-0 ${tip.color}`} />
            <div>
              <p className="text-sm font-medium">{tip.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{tip.text}</p>
            </div>
          </div>
        ))}

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground text-center">
            💡 Remember to save your project before leaving!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CodingTipsPanel;
