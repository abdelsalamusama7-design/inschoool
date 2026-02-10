import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalLink, Blocks, Lightbulb, Star, Zap, Target, Rocket, BookOpen, Code2 } from 'lucide-react';
import { useGamification, POINTS_CONFIG } from '@/hooks/useGamification';
import TutorialVideos from '@/components/dashboard/TutorialVideos';

const minecraftVideos = [
  { videoId: 'UhKDMEB9EBs', title: 'MakeCode for Minecraft Tutorial', description: 'Learn to code Minecraft with blocks' },
  { videoId: 'wNBKxLjB4vE', title: 'Minecraft Agent Coding', description: 'Program your Agent to build structures' },
  { videoId: 'MPbNXLE2eKk', title: 'Minecraft Education Edition', description: 'Getting started with coding in Minecraft' },
];

const MINECRAFT_EDU_URL = 'https://education.minecraft.net/';
const MAKECODE_URL = 'https://minecraft.makecode.com/';

const tips = [
  { icon: Lightbulb, title: 'Start with MakeCode', text: 'Use Microsoft MakeCode to code Minecraft with visual blocks — no typing needed!' },
  { icon: Star, title: 'Agent Commands', text: 'Program your Agent to build, mine, and explore the world automatically.' },
  { icon: Code2, title: 'Try JavaScript', text: 'Switch from blocks to JavaScript in MakeCode when you\'re ready for text coding.' },
  { icon: Zap, title: 'Use Chat Commands', text: 'Create custom chat commands to trigger your code in the Minecraft world.' },
  { icon: Target, title: 'Build & Test', text: 'Build structures programmatically and test them in your Minecraft world.' },
  { icon: BookOpen, title: 'Explore Tutorials', text: 'MakeCode has built-in tutorials for beginners — follow them step by step!' },
];

const MinecraftLabPage = () => {
  const { awardPoints } = useGamification();
  const awarded = useRef(false);

  useEffect(() => {
    if (!awarded.current) {
      awarded.current = true;
      awardPoints(POINTS_CONFIG.minecraft_visit, 'Visited Minecraft Lab', 'minecraft');
    }
  }, []);

  const openMakeCode = () => {
    window.open(MAKECODE_URL, '_blank', 'noopener,noreferrer');
  };

  const openMinecraftEdu = () => {
    window.open(MINECRAFT_EDU_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-green-500/10 text-green-600 border border-green-200">
          <Blocks className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Minecraft Coding ⛏️</h1>
          <p className="text-muted-foreground">Learn to code by building and automating in the Minecraft world</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        {/* Left: Main Content */}
        <div className="space-y-4">
          {/* Main CTA Card */}
          <Card className="overflow-hidden border-2 border-green-200/50">
            <div className="h-2 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-400" />
            <CardContent className="p-8 flex flex-col items-center text-center gap-5">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-xl">
                <Rocket className="w-10 h-10 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Ready to Code in Minecraft? ⛏️</h3>
                <p className="text-muted-foreground max-w-md">
                  Use Microsoft MakeCode to write code that controls your Minecraft world — build structures, automate tasks, and create mini-games!
                </p>
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                <Button
                  size="lg"
                  className="gap-2 text-base px-8 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  onClick={openMakeCode}
                >
                  <ExternalLink className="h-5 w-5" />
                  Open MakeCode
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 text-base px-6"
                  onClick={openMinecraftEdu}
                >
                  <BookOpen className="h-5 w-5" />
                  Minecraft Education
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                💡 MakeCode works in the browser — no installation needed!
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right: Tips Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-green-500" />
                Tips & Getting Started
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="p-3 space-y-2">
                  {tips.map((tip, i) => (
                    <div key={i} className="p-3 rounded-lg border border-transparent hover:bg-muted/80 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                          <tip.icon className="w-3.5 h-3.5 text-green-600" />
                        </div>
                        <span className="text-sm font-medium">{tip.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground ml-9">{tip.text}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tutorial Videos */}
      <TutorialVideos videos={minecraftVideos} accentColor="text-green-500" />
    </div>
  );
};

export default MinecraftLabPage;
