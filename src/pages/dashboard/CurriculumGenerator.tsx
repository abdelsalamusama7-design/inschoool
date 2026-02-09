import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { parseCurriculum, GeneratedModule, LanguageMode } from '@/lib/curriculumParser';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Pencil,
  Save,
  BookOpen,
  Clock,
  Target,
  Lightbulb,
  Loader2,
  Trash2,
} from 'lucide-react';

const AGE_GROUPS = [
  { value: '6-8', label: '6-8 years' },
  { value: '9-12', label: '9-12 years' },
  { value: '13-15', label: '13-15 years' },
  { value: '16-18', label: '16-18 years' },
];

const LANGUAGE_MODES: { value: LanguageMode; label: string }[] = [
  { value: 'english', label: 'English Only' },
  { value: 'arabic', label: 'Arabic Only' },
  { value: 'bilingual', label: 'Bilingual (EN + AR)' },
];

const CurriculumGenerator = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form state
  const [courseTitle, setCourseTitle] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [language, setLanguage] = useState<LanguageMode>('english');
  const [curriculumText, setCurriculumText] = useState('');

  // Generation state
  const [modules, setModules] = useState<GeneratedModule[]>([]);
  const [generated, setGenerated] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editing state
  const [editingLesson, setEditingLesson] = useState<{ modIdx: number; lessonIdx: number } | null>(null);
  const [openModules, setOpenModules] = useState<Set<number>>(new Set());

  const handleGenerate = () => {
    if (!courseTitle.trim()) {
      toast({ title: 'Missing title', description: 'Please enter a course title', variant: 'destructive' });
      return;
    }
    if (!ageGroup) {
      toast({ title: 'Missing age group', description: 'Please select an age group', variant: 'destructive' });
      return;
    }
    if (!curriculumText.trim()) {
      toast({ title: 'Missing curriculum', description: 'Please paste your curriculum text', variant: 'destructive' });
      return;
    }

    const result = parseCurriculum(curriculumText, ageGroup, language);
    setModules(result);
    setGenerated(true);
    setOpenModules(new Set(result.map((_, i) => i)));
    toast({ title: 'Lessons generated!', description: `${result.length} modules with ${result.reduce((s, m) => s + m.lessons.length, 0)} lessons created` });
  };

  const toggleModule = (idx: number) => {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const updateLesson = (modIdx: number, lessonIdx: number, field: string, value: string) => {
    setModules((prev) =>
      prev.map((mod, mi) =>
        mi === modIdx
          ? {
              ...mod,
              lessons: mod.lessons.map((lesson, li) =>
                li === lessonIdx ? { ...lesson, [field]: value } : lesson
              ),
            }
          : mod
      )
    );
  };

  const deleteLesson = (modIdx: number, lessonIdx: number) => {
    setModules((prev) =>
      prev
        .map((mod, mi) =>
          mi === modIdx
            ? { ...mod, lessons: mod.lessons.filter((_, li) => li !== lessonIdx) }
            : mod
        )
        .filter((mod) => mod.lessons.length > 0)
    );
  };

  const deleteModule = (modIdx: number) => {
    setModules((prev) => prev.filter((_, i) => i !== modIdx));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // 1. Create course
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert({
          title: courseTitle,
          description: `Auto-generated from curriculum. Modules: ${modules.map((m) => m.name).join(', ')}`,
          age_group: ageGroup as any,
          instructor_id: user.id,
        })
        .select()
        .single();

      if (courseError) throw courseError;

      // 2. Insert all lessons with order index
      let orderIndex = 0;
      const lessonsToInsert = modules.flatMap((mod) =>
        mod.lessons.map((lesson) => ({
          course_id: course.id,
          title: lesson.title,
          description: lesson.description,
          content: [
            `**Objective:** ${lesson.objective}`,
            `**Activity:** ${lesson.activity}`,
            `**Duration:** ${lesson.duration}`,
            `**Module:** ${mod.name}`,
          ].join('\n\n'),
          order_index: orderIndex++,
        }))
      );

      const { error: lessonsError } = await supabase.from('lessons').insert(lessonsToInsert);

      if (lessonsError) throw lessonsError;

      toast({
        title: 'Course saved successfully!',
        description: `${lessonsToInsert.length} lessons added to "${courseTitle}"`,
      });

      navigate(`/dashboard/courses/${course.id}`);
    } catch (error: any) {
      toast({ title: 'Error saving', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const totalLessons = modules.reduce((s, m) => s + m.lessons.length, 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-primary" />
            Auto Generate Lessons
          </h1>
          <p className="text-muted-foreground">Paste your curriculum and generate structured lessons instantly</p>
        </div>
      </div>

      {/* Input Form */}
      {!generated && (
        <Card>
          <CardHeader>
            <CardTitle>Curriculum Input</CardTitle>
            <CardDescription>Provide your course details and curriculum content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="course-title">Course Title *</Label>
                <Input
                  id="course-title"
                  placeholder="e.g., Web Development Basics"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Age Group *</Label>
                <Select value={ageGroup} onValueChange={setAgeGroup}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select age group" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGE_GROUPS.map((ag) => (
                      <SelectItem key={ag.value} value={ag.value}>
                        {ag.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Language Mode</Label>
                <Select value={language} onValueChange={(v) => setLanguage(v as LanguageMode)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_MODES.map((lm) => (
                      <SelectItem key={lm.value} value={lm.value}>
                        {lm.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="curriculum-text">Curriculum Text *</Label>
              <Textarea
                id="curriculum-text"
                placeholder={`Paste your curriculum here. Example:\n\nModule 1: Introduction to HTML\n- What is HTML?\n- HTML Tags & Elements\n- Building Your First Page\n\nModule 2: CSS Basics\n- Selectors & Properties\n- Colors & Typography\n- Box Model`}
                value={curriculumText}
                onChange={(e) => setCurriculumText(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Tip: Use "Module/Unit/Chapter" headers, or numbered lists. The parser will auto-detect structure.
              </p>
            </div>

            <Button
              size="lg"
              onClick={handleGenerate}
              disabled={!courseTitle.trim() || !ageGroup || !curriculumText.trim()}
              className="w-full md:w-auto"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Lessons
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Generated Preview */}
      {generated && modules.length > 0 && (
        <>
          {/* Summary bar */}
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    <BookOpen className="w-3.5 h-3.5 mr-1" />
                    {modules.length} Modules
                  </Badge>
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    <Target className="w-3.5 h-3.5 mr-1" />
                    {totalLessons} Lessons
                  </Badge>
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    {ageGroup} years
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setGenerated(false)}>
                    Edit Input
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save to Course
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Modules */}
          <div className="space-y-4">
            {modules.map((mod, modIdx) => (
              <Card key={modIdx} className="overflow-hidden">
                <Collapsible open={openModules.has(modIdx)} onOpenChange={() => toggleModule(modIdx)}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {openModules.has(modIdx) ? (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          )}
                          <div>
                            <CardTitle className="text-lg">
                              Module {modIdx + 1}: {mod.name}
                            </CardTitle>
                            <CardDescription>{mod.lessons.length} lessons</CardDescription>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteModule(modIdx);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-3">
                      {mod.lessons.map((lesson, lessonIdx) => {
                        const isEditing =
                          editingLesson?.modIdx === modIdx && editingLesson?.lessonIdx === lessonIdx;

                        return (
                          <div
                            key={lessonIdx}
                            className="border rounded-lg p-4 bg-background space-y-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              {isEditing ? (
                                <Input
                                  value={lesson.title}
                                  onChange={(e) => updateLesson(modIdx, lessonIdx, 'title', e.target.value)}
                                  className="font-semibold"
                                />
                              ) : (
                                <h4 className="font-semibold text-sm">{lesson.title}</h4>
                              )}
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() =>
                                    setEditingLesson(isEditing ? null : { modIdx, lessonIdx })
                                  }
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => deleteLesson(modIdx, lessonIdx)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>

                            {isEditing ? (
                              <div className="space-y-3">
                                <div className="space-y-1">
                                  <Label className="text-xs">Description</Label>
                                  <Textarea
                                    value={lesson.description}
                                    onChange={(e) =>
                                      updateLesson(modIdx, lessonIdx, 'description', e.target.value)
                                    }
                                    rows={2}
                                    className="text-sm"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Learning Objective</Label>
                                  <Input
                                    value={lesson.objective}
                                    onChange={(e) =>
                                      updateLesson(modIdx, lessonIdx, 'objective', e.target.value)
                                    }
                                    className="text-sm"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Activity / Mini Project</Label>
                                  <Input
                                    value={lesson.activity}
                                    onChange={(e) =>
                                      updateLesson(modIdx, lessonIdx, 'activity', e.target.value)
                                    }
                                    className="text-sm"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="grid gap-2 text-sm text-muted-foreground">
                                <p>{lesson.description}</p>
                                <div className="flex flex-wrap gap-3">
                                  <span className="flex items-center gap-1">
                                    <Target className="w-3.5 h-3.5 text-primary" />
                                    {lesson.objective}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                  <span className="flex items-center gap-1">
                                    <Lightbulb className="w-3.5 h-3.5 text-primary" />
                                    {lesson.activity}
                                  </span>
                                </div>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  {lesson.duration}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
          </div>

          {/* Bottom save bar */}
          <div className="sticky bottom-4 z-10">
            <Card className="shadow-lg border-primary/20">
              <CardContent className="py-3 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Ready to save <strong>{totalLessons} lessons</strong> across{' '}
                  <strong>{modules.length} modules</strong> to "<strong>{courseTitle}</strong>"
                </p>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save to Course
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {generated && modules.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No modules could be detected. Try using clearer structure headers like "Module 1: ..." or numbered lists.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => setGenerated(false)}>
              Edit Input
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CurriculumGenerator;
