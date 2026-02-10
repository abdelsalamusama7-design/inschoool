import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ExternalLink, Code2, Rocket, Lightbulb, Star, Zap, Target } from 'lucide-react';
import TutorialVideos from './TutorialVideos';

const scratchVideos = [
  { videoId: 'VIpmkeqJhmQ', title: 'Scratch Tutorial for Beginners', description: 'Learn the basics of Scratch programming' },
  { videoId: '0eJTGJc0JlE', title: 'Make a Game in Scratch', description: 'Create your first Scratch game step by step' },
  { videoId: 'QXjKa9l4M04', title: 'Scratch Animation Tutorial', description: 'Learn to make cool animations' },
];

interface ScratchFreePlayProps {
  onClose: () => void;
}

const SCRATCH_EDITOR_URL = 'https://scratch.mit.edu/projects/editor/';

const tips = [
  { icon: Lightbulb, title: 'Start Simple', text: 'Begin with a small project — try making a sprite move left and right!' },
  { icon: Star, title: 'Use Loops', text: 'Repeat blocks save time. Use "forever" or "repeat" to animate smoothly.' },
  { icon: Zap, title: 'Add Sound', text: 'Make your project fun! Add sound effects when sprites interact.' },
  { icon: Target, title: 'Test Often', text: 'Click the green flag frequently to test your changes as you build.' },
];

const ScratchFreePlay = ({ onClose }: ScratchFreePlayProps) => {
  const openScratchEditor = () => {
    window.open(SCRATCH_EDITOR_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Code2 className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Scratch Free Play</h2>
        </div>
      </div>

      {/* Main CTA Card */}
      <Card className="overflow-hidden border-2 border-primary/20">
        <div className="h-2 bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400" />
        <CardContent className="p-8 flex flex-col items-center text-center gap-5">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-xl">
            <Rocket className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold">Ready to Code? 🚀</h3>
            <p className="text-muted-foreground max-w-md">
              The Scratch editor will open in a new tab. Build games, stories, and animations using visual coding blocks!
            </p>
          </div>
          <Button
            size="lg"
            className="gap-2 text-base px-8"
            onClick={openScratchEditor}
          >
            <ExternalLink className="h-5 w-5" />
            Open Scratch Editor
          </Button>
          <p className="text-xs text-muted-foreground">
            💡 Sign in to Scratch to save your projects!
          </p>
        </CardContent>
      </Card>

      {/* Coding Tips Grid */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          Coding Tips & Suggestions
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {tips.map((tip, i) => (
            <Card key={i} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <tip.icon className="w-4 h-4 text-primary" />
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

      {/* Tutorial Videos */}
      <TutorialVideos videos={scratchVideos} accentColor="text-amber-500" />
    </div>
  );
};

export default ScratchFreePlay;
