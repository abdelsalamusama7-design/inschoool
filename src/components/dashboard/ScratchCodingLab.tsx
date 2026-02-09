import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Maximize2, Minimize2, Code2, BookOpen, CheckCircle, Send } from 'lucide-react';
import { toast } from 'sonner';

interface ScratchCodingLabProps {
  scratchUrl: string;
  instructions?: string | null;
  lessonTitle: string;
  lessonId: string;
  onClose: () => void;
  onComplete?: () => void;
}

const ScratchCodingLab = ({ scratchUrl, instructions, lessonTitle, lessonId, onClose, onComplete }: ScratchCodingLabProps) => {
  const { user, role } = useAuth();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState('');
  const [showSubmitPanel, setShowSubmitPanel] = useState(false);

  useEffect(() => {
    if (user && role === 'student') {
      checkCompletion();
    }
  }, [user, lessonId]);

  const checkCompletion = async () => {
    const { data } = await supabase
      .from('scratch_activity_logs')
      .select('id')
      .eq('user_id', user!.id)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    if (data) setIsCompleted(true);
  };

  const handleSubmitActivity = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('scratch_activity_logs')
        .insert({
          user_id: user.id,
          lesson_id: lessonId,
          notes: notes || null,
        });

      if (error) {
        if (error.code === '23505') {
          toast.info('You already submitted this activity');
          setIsCompleted(true);
        } else {
          throw error;
        }
      } else {
        setIsCompleted(true);
        toast.success('Activity marked as complete! 🎉');
        onComplete?.();
      }
    } catch (error) {
      console.error('Error submitting activity:', error);
      toast.error('Failed to submit activity');
    } finally {
      setSubmitting(false);
      setShowSubmitPanel(false);
    }
  };

  const getEmbedUrl = (url: string) => {
    const projectMatch = url.match(/scratch\.mit\.edu\/projects\/(\d+)/);
    if (projectMatch) {
      return `https://scratch.mit.edu/projects/${projectMatch[1]}/embed`;
    }
    if (url.includes('/embed')) return url;
    return url.endsWith('/') ? `${url}embed` : `${url}/embed`;
  };

  const embedUrl = getEmbedUrl(scratchUrl);

  const CompletionButton = () => {
    if (role !== 'student') return null;

    if (isCompleted) {
      return (
        <Badge className="bg-green-500/10 text-green-600 border-green-200 gap-1">
          <CheckCircle className="w-3 h-3" />
          Completed
        </Badge>
      );
    }

    return (
      <Button
        size="sm"
        onClick={() => setShowSubmitPanel(true)}
        className="gap-1"
      >
        <Send className="h-4 w-4" />
        <span className="hidden sm:inline">Mark Complete</span>
      </Button>
    );
  };

  const SubmitPanel = () => {
    if (!showSubmitPanel) return null;

    return (
      <Card className="border-primary/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary" />
            Submit Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Add notes about what you built (optional)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
          <div className="flex gap-2">
            <Button onClick={handleSubmitActivity} disabled={submitting} className="flex-1">
              {submitting ? 'Submitting...' : 'Submit & Complete ✅'}
            </Button>
            <Button variant="outline" onClick={() => setShowSubmitPanel(false)}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b bg-card">
          <div className="flex items-center gap-3">
            <Code2 className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-sm sm:text-base">{lessonTitle} — Scratch Lab</h2>
          </div>
          <div className="flex items-center gap-2">
            <CompletionButton />
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
          <div className="lg:w-80 border-t lg:border-t-0 lg:border-l overflow-y-auto p-4 bg-card max-h-48 lg:max-h-full space-y-4">
            {instructions && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Activity Instructions</h3>
                </div>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {instructions}
                </div>
              </div>
            )}
            <SubmitPanel />
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
            <Code2 className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Scratch Coding Lab</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CompletionButton />
          <Button variant="outline" size="sm" onClick={() => setIsFullscreen(true)}>
            <Maximize2 className="h-4 w-4 mr-1" />
            Full Screen
          </Button>
        </div>
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

        {/* Right Panel: Instructions + Submit */}
        <div className="space-y-4">
          {instructions && (
            <Card className="h-fit">
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
          <SubmitPanel />
        </div>
      </div>
    </div>
  );
};

export default ScratchCodingLab;
