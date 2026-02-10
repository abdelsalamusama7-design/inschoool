import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Code2, Terminal, Gamepad2, Blocks, Search, BookOpen, ChevronDown, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const LessonsManagement = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');

  const { data: courses } = useQuery({
    queryKey: ['instructor-courses-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title')
        .order('title');
      if (error) throw error;
      return data;
    },
  });

  const { data: lessons, isLoading } = useQuery({
    queryKey: ['all-lessons', courseFilter],
    queryFn: async () => {
      let query = supabase
        .from('lessons')
        .select('*, courses(title)')
        .order('order_index');
      if (courseFilter !== 'all') {
        query = query.eq('course_id', courseFilter);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ lessonId, field, value }: { lessonId: string; field: string; value: boolean }) => {
      const { error } = await supabase
        .from('lessons')
        .update({ [field]: value })
        .eq('id', lessonId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-lessons'] });
      toast({ title: 'تم التحديث بنجاح' });
    },
    onError: () => {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    },
  });

  const updateFieldsMutation = useMutation({
    mutationFn: async ({ lessonId, fields }: { lessonId: string; fields: Record<string, string | null> }) => {
      const { error } = await supabase
        .from('lessons')
        .update(fields)
        .eq('id', lessonId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-lessons'] });
      toast({ title: 'تم حفظ التعليمات بنجاح' });
    },
    onError: () => {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    },
  });

  const filteredLessons = lessons?.filter((l) =>
    l.title.toLowerCase().includes(search.toLowerCase())
  );

  const labConfig = [
    { key: 'scratch', label: 'Scratch', icon: Code2, urlField: 'scratch_url', instrField: 'scratch_instructions' },
    { key: 'python', label: 'Python', icon: Terminal, urlField: 'python_url', instrField: 'python_instructions' },
    { key: 'roblox', label: 'Roblox', icon: Gamepad2, urlField: 'roblox_url', instrField: 'roblox_instructions' },
    { key: 'minecraft', label: 'Minecraft', icon: Blocks, urlField: 'minecraft_url', instrField: 'minecraft_instructions' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">إدارة الدروس</h1>
        <p className="text-muted-foreground">تفعيل وإدارة المختبرات لكل درس</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث عن درس..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="كل الدورات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الدورات</SelectItem>
            {courses?.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredLessons?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>لا توجد دروس</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredLessons?.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              labConfig={labConfig}
              onToggle={(field, value) => toggleMutation.mutate({ lessonId: lesson.id, field, value })}
              onSaveFields={(fields) => updateFieldsMutation.mutate({ lessonId: lesson.id, fields })}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface LessonCardProps {
  lesson: any;
  labConfig: { key: string; label: string; icon: any; urlField: string; instrField: string }[];
  onToggle: (field: string, value: boolean) => void;
  onSaveFields: (fields: Record<string, string | null>) => void;
}

const LessonCard = ({ lesson, labConfig, onToggle, onSaveFields }: LessonCardProps) => {
  const [editingLab, setEditingLab] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [instructions, setInstructions] = useState('');

  const startEditing = (lab: typeof labConfig[0]) => {
    setEditingLab(lab.key);
    setUrl(lesson[lab.urlField] || '');
    setInstructions(lesson[lab.instrField] || '');
  };

  const saveEditing = (lab: typeof labConfig[0]) => {
    onSaveFields({
      [lab.urlField]: url || null,
      [lab.instrField]: instructions || null,
    });
    setEditingLab(null);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{lesson.title}</h3>
              <p className="text-sm text-muted-foreground truncate">
                {lesson.courses?.title}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              {labConfig.map((lab) => {
                const enabledKey = `${lab.key}_enabled`;
                const enabled = lesson[enabledKey] as boolean;
                return (
                  <div key={lab.key} className="flex items-center gap-2">
                    <lab.icon className="w-4 h-4 text-muted-foreground" />
                    <Label className="text-sm whitespace-nowrap">{lab.label}</Label>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(val) => onToggle(enabledKey, val)}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Expandable details for enabled labs */}
          {labConfig.filter(lab => lesson[`${lab.key}_enabled`]).length > 0 && (
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                  <ChevronDown className="w-3.5 h-3.5" />
                  الروابط والتعليمات
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="space-y-3">
                  {labConfig.filter(lab => lesson[`${lab.key}_enabled`]).map((lab) => (
                    <div key={lab.key} className="border rounded-lg p-3 bg-muted/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <lab.icon className="w-4 h-4" />
                          <span className="font-medium text-sm">{lab.label}</span>
                        </div>
                        {editingLab !== lab.key ? (
                          <Button variant="outline" size="sm" onClick={() => startEditing(lab)}>
                            تعديل
                          </Button>
                        ) : (
                          <Button size="sm" onClick={() => saveEditing(lab)} className="gap-1">
                            <Save className="w-3.5 h-3.5" />
                            حفظ
                          </Button>
                        )}
                      </div>
                      {editingLab === lab.key ? (
                        <div className="space-y-2">
                          <Input
                            placeholder="رابط المشروع..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                          />
                          <Textarea
                            placeholder="تعليمات للطلاب..."
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            rows={2}
                          />
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          {lesson[lab.urlField] ? (
                            <p className="truncate">🔗 {lesson[lab.urlField]}</p>
                          ) : (
                            <p className="italic">لا يوجد رابط</p>
                          )}
                          {lesson[lab.instrField] && (
                            <p className="mt-1 line-clamp-2">📝 {lesson[lab.instrField]}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LessonsManagement;
