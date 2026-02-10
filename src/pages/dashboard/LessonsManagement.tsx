import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Code2, Terminal, Gamepad2, Blocks, Search, BookOpen } from 'lucide-react';
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

  const filteredLessons = lessons?.filter((l) =>
    l.title.toLowerCase().includes(search.toLowerCase())
  );

  const labConfig = [
    { key: 'scratch_enabled', label: 'Scratch', icon: Code2, color: 'bg-orange-100 text-orange-700' },
    { key: 'python_enabled', label: 'Python', icon: Terminal, color: 'bg-blue-100 text-blue-700' },
    { key: 'roblox_enabled', label: 'Roblox', icon: Gamepad2, color: 'bg-purple-100 text-purple-700' },
    { key: 'minecraft_enabled', label: 'Minecraft', icon: Blocks, color: 'bg-green-100 text-green-700' },
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
            <Card key={lesson.id}>
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{lesson.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {(lesson as any).courses?.title}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    {labConfig.map((lab) => {
                      const enabled = (lesson as any)[lab.key] as boolean;
                      return (
                        <div key={lab.key} className="flex items-center gap-2">
                          <lab.icon className="w-4 h-4 text-muted-foreground" />
                          <Label className="text-sm whitespace-nowrap">{lab.label}</Label>
                          <Switch
                            checked={enabled}
                            onCheckedChange={(val) =>
                              toggleMutation.mutate({ lessonId: lesson.id, field: lab.key, value: val })
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LessonsManagement;
