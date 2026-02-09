import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Terminal,
  Play,
  Trash2,
  Loader2,
  Lightbulb,
  BookOpen,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { usePyodide } from '@/hooks/usePyodide';
import { pythonChallenges, PythonChallenge } from '@/data/pythonChallenges';

const DEFAULT_CODE = '# Welcome to Python Lab! 🐍\n# Write your code here and click Run\n\nprint("Hello from Python Lab!")\n';

const PythonLabPage = () => {
  const { loading: pyLoading, ready, error: pyError, runCode } = usePyodide();
  const [code, setCode] = useState(DEFAULT_CODE);
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [activeChallenge, setActiveChallenge] = useState<PythonChallenge | null>(null);
  const [showHint, setShowHint] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle tab key in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      setCode(newCode);
      // Set cursor position after setState
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      }, 0);
    }
  };

  const handleRun = async () => {
    if (!ready) return;
    setRunning(true);
    setOutput('');
    setShowHint(false);

    const result = await runCode(code);

    let finalOutput = '';
    if (result.output) finalOutput += result.output;
    if (result.error) finalOutput += `\n❌ Error:\n${result.error}`;
    if (!result.output && !result.error) finalOutput = '✅ Code ran successfully (no output)';

    setOutput(finalOutput.trim());
    setRunning(false);
  };

  const handleClear = () => {
    setOutput('');
    setCode(DEFAULT_CODE);
    setActiveChallenge(null);
    setShowHint(false);
  };

  const loadChallenge = (challenge: PythonChallenge) => {
    setCode(challenge.starterCode);
    setActiveChallenge(challenge);
    setOutput('');
    setShowHint(false);
  };

  const difficultyColor = (d: string) => {
    switch (d) {
      case 'beginner': return 'bg-green-500/10 text-green-600 border-green-200';
      case 'intermediate': return 'bg-amber-500/10 text-amber-600 border-amber-200';
      case 'advanced': return 'bg-red-500/10 text-red-600 border-red-200';
      default: return '';
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
          <Terminal className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Python Lab 🐍</h1>
          <p className="text-muted-foreground">
            Write and run Python code directly in your browser!
          </p>
        </div>
        <div className="ml-auto">
          {pyLoading && (
            <Badge variant="outline" className="gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading Python...
            </Badge>
          )}
          {ready && (
            <Badge className="bg-green-500/10 text-green-600 border-green-200 gap-1">
              <Zap className="h-3 w-3" />
              Python Ready
            </Badge>
          )}
          {pyError && (
            <Badge variant="destructive" className="gap-1">
              ❌ Load Error
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        {/* Left: Editor + Output */}
        <div className="space-y-4">
          {/* Active challenge info */}
          {activeChallenge && (
            <Card className="border-primary/20">
              <CardContent className="p-4 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">{activeChallenge.title}</h3>
                    <Badge className={`text-xs ${difficultyColor(activeChallenge.difficulty)}`}>
                      {activeChallenge.difficulty}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{activeChallenge.description}</p>
                  {showHint && activeChallenge.hint && (
                    <p className="text-sm text-primary mt-2 flex items-center gap-1">
                      <Lightbulb className="h-3.5 w-3.5" />
                      {activeChallenge.hint}
                    </p>
                  )}
                </div>
                {activeChallenge.hint && !showHint && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                    onClick={() => setShowHint(true)}
                  >
                    <Lightbulb className="h-4 w-4 mr-1" />
                    Hint
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Code Editor */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
              <span className="text-sm font-medium flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Code Editor
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear
                </Button>
                <Button
                  size="sm"
                  onClick={handleRun}
                  disabled={!ready || running}
                  className="gap-1"
                >
                  {running ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {running ? 'Running...' : 'Run Code'}
                </Button>
              </div>
            </div>
            <CardContent className="p-0">
              <textarea
                ref={textareaRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full min-h-[300px] p-4 bg-[hsl(220,20%,10%)] text-[hsl(210,40%,98%)] font-mono text-sm resize-y border-0 outline-none"
                spellCheck={false}
                placeholder="Write your Python code here..."
              />
            </CardContent>
          </Card>

          {/* Output Console */}
          <Card className="overflow-hidden">
            <div className="px-4 py-2 border-b bg-muted/50">
              <span className="text-sm font-medium flex items-center gap-2">
                <ChevronRight className="h-4 w-4" />
                Output
              </span>
            </div>
            <CardContent className="p-0">
              <pre className="w-full min-h-[120px] max-h-[300px] overflow-auto p-4 bg-[hsl(220,20%,10%)] text-[hsl(210,40%,98%)] font-mono text-sm whitespace-pre-wrap">
                {output || (
                  <span className="text-[hsl(215,20%,50%)] italic">
                    Click "Run Code" to see the output here...
                  </span>
                )}
              </pre>
            </CardContent>
          </Card>
        </div>

        {/* Right: Challenges Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Coding Challenges
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="p-3 space-y-2">
                  {pythonChallenges.map((challenge) => (
                    <button
                      key={challenge.id}
                      onClick={() => loadChallenge(challenge)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors hover:bg-muted/80 ${
                        activeChallenge?.id === challenge.id
                          ? 'border-primary bg-primary/5'
                          : 'border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{challenge.title}</span>
                        <Badge
                          className={`text-[10px] px-1.5 py-0 ${difficultyColor(challenge.difficulty)}`}
                        >
                          {challenge.difficulty}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {challenge.description}
                      </p>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Quick tips */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-1">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Quick Tips
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>• Press <kbd className="px-1 py-0.5 rounded bg-muted text-[10px]">Tab</kbd> to indent code</li>
                <li>• Use <code className="px-1 py-0.5 rounded bg-muted text-[10px]">print()</code> to see output</li>
                <li>• Python uses indentation instead of braces</li>
                <li>• Try the challenges on the right! →</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PythonLabPage;
