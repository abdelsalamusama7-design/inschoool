import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Maximize2, Minimize2, Code2, BookOpen } from 'lucide-react';

interface ScratchCodingLabProps {
  scratchUrl: string;
  instructions?: string | null;
  lessonTitle: string;
  onClose: () => void;
}

const ScratchCodingLab = ({ scratchUrl, instructions, lessonTitle, onClose }: ScratchCodingLabProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Convert Scratch project URL to embed URL
  const getEmbedUrl = (url: string) => {
    // Handle scratch.mit.edu/projects/ID format
    const projectMatch = url.match(/scratch\.mit\.edu\/projects\/(\d+)/);
    if (projectMatch) {
      return `https://scratch.mit.edu/projects/${projectMatch[1]}/embed`;
    }
    // If it's already an embed URL or other format, use as-is
    if (url.includes('/embed')) return url;
    // Fallback: try to append /embed
    return url.endsWith('/') ? `${url}embed` : `${url}/embed`;
  };

  const embedUrl = getEmbedUrl(scratchUrl);

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b bg-card">
          <div className="flex items-center gap-3">
            <Code2 className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-sm sm:text-base">{lessonTitle} — Scratch Lab</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsFullscreen(false)}>
              <Minimize2 className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Exit Fullscreen</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Back to Lesson</span>
            </Button>
          </div>
        </div>
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <div className="flex-1 min-h-0">
            <iframe
              src={embedUrl}
              className="w-full h-full border-0"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              title="Scratch Coding Lab"
            />
          </div>
          {instructions && (
            <div className="lg:w-80 border-t lg:border-t-0 lg:border-l overflow-y-auto p-4 bg-card max-h-48 lg:max-h-full">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Activity Instructions</h3>
              </div>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {instructions}
              </div>
            </div>
          )}
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
            <Code2 className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Scratch Coding Lab</h2>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsFullscreen(true)}>
          <Maximize2 className="h-4 w-4 mr-1" />
          Full Screen
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Scratch Embed */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="aspect-[4/3] w-full">
              <iframe
                src={embedUrl}
                className="w-full h-full border-0"
                allowFullScreen
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                title="Scratch Coding Lab"
              />
            </div>
          </CardContent>
        </Card>

        {/* Instructions Panel */}
        {instructions && (
          <Card className="h-fit lg:sticky lg:top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Activity Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {instructions}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ScratchCodingLab;
