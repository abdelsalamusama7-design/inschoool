import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Maximize2, Minimize2, Code2, AlertTriangle } from 'lucide-react';
import CodingTipsPanel from './CodingTipsPanel';

interface ScratchFreePlayProps {
  onClose: () => void;
}

const SCRATCH_EDITOR_URL = 'https://scratch.mit.edu/projects/editor/';

const ScratchFreePlay = ({ onClose }: ScratchFreePlayProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b bg-card">
          <div className="flex items-center gap-3">
            <Code2 className="h-5 w-5 text-orange-500" />
            <h2 className="font-bold text-sm sm:text-base">Scratch Free Play — Coding Lab</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsFullscreen(false)}>
              <Minimize2 className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Exit Fullscreen</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Back to Lab</span>
            </Button>
          </div>
        </div>
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <div className="flex-1 min-h-0">
            <iframe
              src={SCRATCH_EDITOR_URL}
              className="w-full h-full border-0"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              title="Scratch Free Play Editor"
            />
          </div>
          <div className="lg:w-80 border-t lg:border-t-0 lg:border-l overflow-y-auto p-4 bg-card max-h-48 lg:max-h-full">
            <CodingTipsPanel />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-orange-500" />
            <h2 className="text-xl font-bold">Scratch Free Play</h2>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsFullscreen(true)}>
          <Maximize2 className="h-4 w-4 mr-1" />
          Full Screen
        </Button>
      </div>

      {/* Save reminder */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500/10 border border-amber-300/40 text-sm">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
        <span className="text-amber-800 dark:text-amber-200">
          <strong>Save reminder:</strong> Sign in to Scratch to save your projects. Otherwise, your work will be lost when you leave!
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Scratch Editor Embed */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="aspect-[4/3] w-full">
              <iframe
                src={SCRATCH_EDITOR_URL}
                className="w-full h-full border-0"
                allowFullScreen
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                title="Scratch Free Play Editor"
              />
            </div>
          </CardContent>
        </Card>

        {/* Right panel: Coding tips */}
        <CodingTipsPanel />
      </div>
    </div>
  );
};

export default ScratchFreePlay;
