import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { UserPlus, Loader2, X } from 'lucide-react';

interface Course { id: string; title: string; }
interface Student { user_id: string; full_name: string; email: string; }

interface Props {
  defaultCourseId?: string;
  trigger?: React.ReactNode;
  onEnrolled?: () => void;
}

const EnrollStudentDialog = ({ defaultCourseId, trigger, onEnrolled }: Props) => {
  const [open, setOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [courseId, setCourseId] = useState(defaultCourseId || '');
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (open) loadInitial(); }, [open]);
  useEffect(() => { if (courseId) loadEnrolled(); }, [courseId]);

  const loadInitial = async () => {
    setLoading(true);
    const [{ data: cs }, { data: roles }] = await Promise.all([
      supabase.from('courses').select('id, title').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('user_id').eq('role', 'student'),
    ]);
    const studentIds = (roles || []).map((r: any) => r.user_id);
    let stuRows: Student[] = [];
    if (studentIds.length) {
      const { data: ps } = await supabase
        .from('profiles').select('user_id, full_name, email').in('user_id', studentIds);
      stuRows = (ps as any) || [];
    }
    setCourses(cs || []);
    setStudents(stuRows);
    setLoading(false);
  };

  const loadEnrolled = async () => {
    const { data } = await supabase.from('enrollments').select('user_id').eq('course_id', courseId);
    setEnrolledIds(new Set((data || []).map((d: any) => d.user_id)));
  };

  const handleEnroll = async (userId: string) => {
    if (!courseId) return toast.error('اختر كورس أولاً');
    setSubmitting(userId);
    const { error } = await supabase.from('enrollments').insert({ course_id: courseId, user_id: userId });
    setSubmitting(null);
    if (error) return toast.error(error.message);
    toast.success('تم تسجيل الطالب');
    setEnrolledIds((prev) => new Set([...prev, userId]));
    onEnrolled?.();
  };

  const handleUnenroll = async (userId: string) => {
    if (!courseId) return;
    setSubmitting(userId);
    const { error } = await supabase.from('enrollments').delete()
      .eq('course_id', courseId).eq('user_id', userId);
    setSubmitting(null);
    if (error) return toast.error(error.message);
    toast.success('تم إلغاء التسجيل');
    setEnrolledIds((prev) => { const n = new Set(prev); n.delete(userId); return n; });
    onEnrolled?.();
  };

  const filtered = students.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return s.full_name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <UserPlus className="w-4 h-4 ml-2" />
            تسجيل طالب في كورس
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تسجيل طلاب في كورس</DialogTitle>
          <DialogDescription>اختر الكورس ثم سجّل أو ألغِ تسجيل الطلاب</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>الكورس</Label>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger><SelectValue placeholder="اختر كورس..." /></SelectTrigger>
              <SelectContent>
                {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>ابحث عن طالب</Label>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بالاسم أو البريد..." />
          </div>

          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="animate-spin" /></div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">لا يوجد طلاب</p>
              ) : (
                filtered.map((s) => {
                  const enrolled = enrolledIds.has(s.user_id);
                  const busy = submitting === s.user_id;
                  return (
                    <div key={s.user_id} className="flex items-center justify-between gap-2 p-3 rounded-lg border">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{s.full_name || '—'}</p>
                        <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                      </div>
                      {enrolled ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="secondary">مسجل</Badge>
                          <Button size="sm" variant="ghost" disabled={busy || !courseId}
                            onClick={() => handleUnenroll(s.user_id)}>
                            {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" disabled={busy || !courseId}
                          onClick={() => handleEnroll(s.user_id)}>
                          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : 'سجّل'}
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnrollStudentDialog;
