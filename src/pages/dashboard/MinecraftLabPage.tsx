import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Blocks, Lightbulb, Star, Zap, Target, Rocket, BookOpen, Code2 } from 'lucide-react';

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
  const openMakeCode = () => {
    window.open(MAKECODE_URL, '_blank', 'noopener,noreferrer');
  };

  const openMinecraftEdu = () => {
    window.open(MINECRAFT_EDU_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-green-500/10 text-green-600 border border-green-200">
          <Blocks className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Minecraft Coding</h1>
          <p className="text-muted-foreground">Learn to code by building and automating in the Minecraft world</p>
        </div>
      </div>

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

      {/* Tips Grid */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-green-500" />
          Tips & Getting Started
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tips.map((tip, i) => (
            <Card key={i} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                  <tip.icon className="w-4 h-4 text-green-600" />
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

export default MinecraftLabPage;
