import { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Gamepad2, Lightbulb, Star, Zap, Target, Rocket, Video, BookOpen } from 'lucide-react';
import { useGamification, POINTS_CONFIG } from '@/hooks/useGamification';

const ROBLOX_STUDIO_URL = 'https://www.roblox.com/create';
const ROBLOX_LEARN_URL = 'https://create.roblox.com/docs';

const tips = [
  { icon: Lightbulb, title: 'Start with Templates', text: 'Use Roblox Studio templates to kickstart your game — try Obby or Racing!' },
  { icon: Star, title: 'Learn Luau', text: 'Roblox uses Luau scripting. Start with simple print() and wait() commands.' },
  { icon: Zap, title: 'Use Toolbox', text: 'The Toolbox has free models, scripts, and assets to speed up your builds.' },
  { icon: Target, title: 'Playtest Often', text: 'Hit the Play button frequently to test your game as you build it.' },
  { icon: Video, title: 'Watch Tutorials', text: 'Roblox has official tutorials on their Creator Hub — great for beginners!' },
  { icon: BookOpen, title: 'Publish & Share', text: 'When ready, publish your game and share it with friends to play!' },
];

const RobloxLabPage = () => {
  const { awardPoints } = useGamification();
  const awarded = useRef(false);

  useEffect(() => {
    if (!awarded.current) {
      awarded.current = true;
      awardPoints(POINTS_CONFIG.roblox_visit, 'Visited Roblox Lab', 'roblox');
    }
  }, []);

  const openRobloxStudio = () => {
    window.open(ROBLOX_STUDIO_URL, '_blank', 'noopener,noreferrer');
  };

  const openRobloxDocs = () => {
    window.open(ROBLOX_LEARN_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-red-500/10 text-red-600 border border-red-200">
          <Gamepad2 className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Roblox Lab</h1>
          <p className="text-muted-foreground">Create immersive games and experiences in Roblox Studio</p>
        </div>
      </div>

      {/* Main CTA Card */}
      <Card className="overflow-hidden border-2 border-red-200/50">
        <div className="h-2 bg-gradient-to-r from-red-500 via-pink-500 to-rose-400" />
        <CardContent className="p-8 flex flex-col items-center text-center gap-5">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-xl">
            <Rocket className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold">Ready to Build Games? 🎮</h3>
            <p className="text-muted-foreground max-w-md">
              Open Roblox Studio to start creating your own 3D games, obstacle courses, and interactive worlds using Luau scripting!
            </p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              size="lg"
              className="gap-2 text-base px-8 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
              onClick={openRobloxStudio}
            >
              <ExternalLink className="h-5 w-5" />
              Open Roblox Studio
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 text-base px-6"
              onClick={openRobloxDocs}
            >
              <BookOpen className="h-5 w-5" />
              Creator Docs
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            💡 You need a Roblox account and Roblox Studio installed on your computer
          </p>
        </CardContent>
      </Card>

      {/* Tips Grid */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-red-500" />
          Tips & Getting Started
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tips.map((tip, i) => (
            <Card key={i} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                  <tip.icon className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">{tip.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{tip.text}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RobloxLabPage;
