import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Zap } from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';

const GamificationPanel = () => {
  const { totalPoints, badges, loading, allBadges } = useGamification();

  if (loading) return null;

  const earnedKeys = new Set(badges.map((b) => b.badge_key));

  return (
    <div className="space-y-4">
      {/* Points Card */}
      <Card className="overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400" />
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" />
            My Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold text-amber-600">{totalPoints}</div>
            <div className="text-xs text-muted-foreground">
              <Zap className="inline h-3 w-3 mr-0.5" />
              Keep coding to earn more!
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badges Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            Badges ({badges.length}/{Object.keys(allBadges).length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(allBadges).map(([key, def]) => {
              const earned = earnedKeys.has(key);
              return (
                <div
                  key={key}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg text-center transition-all ${
                    earned ? 'bg-primary/5' : 'opacity-40 grayscale'
                  }`}
                  title={earned ? `${def.name}: ${def.description}` : `🔒 ${def.description}`}
                >
                  <span className="text-2xl">{def.icon}</span>
                  <span className="text-[10px] font-medium leading-tight">{def.name}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GamificationPanel;
