import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Video, Trash2, ExternalLink, Calendar, Clock, Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface LiveSession {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  meeting_url: string;
  meeting_platform: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  created_by: string;
  courses?: { title: string };
}

const LiveSessionsManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editSession, setEditSession] = useState<LiveSession | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [platform, setPlatform] = useState('zoom');
  const [scheduledAt, setScheduledAt] = useState('');
  const [duration, setDuration] = useState('60');
  const [saving, setSaving] = useState(false);

  const { data: courses } = useQuery({
    queryKey: ['instructor-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title')
        .eq('instructor_id', user!.id)
        .order('title');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['live-sessions-instructor'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('live_sessions')
        .select('*, courses(title)')
        .eq('created_by', user!.id)
        .order('scheduled_at', { ascending: true });
      if (error) throw error;
      return data as LiveSession[];
    },
    enabled: !!user,
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCourseId('');
    setMeetingUrl('');
    setPlatform('zoom');
    setScheduledAt('');
    setDuration('60');
    setEditSession(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (session: LiveSession) => {
    setEditSession(session);
    setTitle(session.title);
    setDescription(session.description || '');
    setCourseId(session.course_id);
    setMeetingUrl(session.meeting_url);
    setPlatform(session.meeting_platform);
    setScheduledAt(session.scheduled_at.slice(0, 16));
    setDuration(String(session.duration_minutes));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !courseId || !meetingUrl.trim() || !scheduledAt) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setSaving(true);
    try {
      if (editSession) {
        const { error } = await supabase
          .from('live_sessions')
          .update({
            title,
            description: description || null,
            course_id: courseId,
            meeting_url: meetingUrl,
            meeting_platform: platform,
            scheduled_at: scheduledAt,
            duration_minutes: parseInt(duration),
          })
          .eq('id', editSession.id);
        if (error) throw error;
        toast.success('تم تحديث المحاضرة بنجاح');
      } else {
        const { error } = await supabase
          .from('live_sessions')
          .insert({
            title,
            description: description || null,
            course_id: courseId,
            meeting_url: meetingUrl,
            meeting_platform: platform,
            scheduled_at: scheduledAt,
            duration_minutes: parseInt(duration),
            created_by: user!.id,
          });
        if (error) throw error;
        toast.success('تم إنشاء المحاضرة بنجاح');
      }

      resetForm();
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['live-sessions-instructor'] });
    } catch (error: any) {
      toast.error('حدث خطأ: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المحاضرة؟')) return;
    try {
      const { error } = await supabase.from('live_sessions').delete().eq('id', id);
      if (error) throw error;
      toast.success('تم حذف المحاضرة');
      queryClient.invalidateQueries({ queryKey: ['live-sessions-instructor'] });
    } catch {
      toast.error('فشل في حذف المحاضرة');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from('live_sessions').update({ status }).eq('id', id);
      if (error) throw error;
      toast.success('تم تحديث الحالة');
      queryClient.invalidateQueries({ queryKey: ['live-sessions-instructor'] });
    } catch {
      toast.error('فشل في تحديث الحالة');
    }
  };

  const getStatusBadge = (status: string, scheduledAt: string) => {
    const now = new Date();
    const sessionTime = new Date(scheduledAt);
    
    if (status === 'cancelled') return <Badge variant="destructive">ملغية</Badge>;
    if (status === 'completed') return <Badge variant="secondary">منتهية</Badge>;
    if (now > new Date(sessionTime.getTime() + 60 * 60 * 1000)) return <Badge variant="secondary">منتهية</Badge>;
    if (now >= sessionTime) return <Badge className="bg-green-600 hover:bg-green-700">جارية الآن</Badge>;
    return <Badge variant="outline">مجدولة</Badge>;
  };

  const getPlatformLabel = (p: string) => {
    switch (p) {
      case 'zoom': return 'Zoom';
      case 'google_meet': return 'Google Meet';
      case 'teams': return 'Microsoft Teams';
      default: return 'أخرى';
    }
  };

  const upcomingSessions = sessions?.filter(s => {
    const sessionTime = new Date(s.scheduled_at);
    return sessionTime >= new Date() && s.status !== 'cancelled';
  }) || [];

  const pastSessions = sessions?.filter(s => {
    const sessionTime = new Date(s.scheduled_at);
    return sessionTime < new Date() || s.status === 'cancelled';
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">المحاضرات الأونلاين</h1>
          <p className="text-muted-foreground">إدارة وجدولة المحاضرات المباشرة</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          محاضرة جديدة
        </Button>
      </div>

      {/* Upcoming Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            المحاضرات القادمة
          </CardTitle>
          <CardDescription>{upcomingSessions.length} محاضرة قادمة</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : upcomingSessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد محاضرات قادمة</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{session.title}</h3>
                      {getStatusBadge(session.status, session.scheduled_at)}
                      <Badge variant="outline" className="text-xs">{getPlatformLabel(session.meeting_platform)}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{session.courses?.title}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(session.scheduled_at), 'EEEE, d MMMM yyyy', { locale: ar })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {format(new Date(session.scheduled_at), 'hh:mm a')} - {session.duration_minutes} دقيقة
                      </span>
                    </div>
                    {session.description && (
                      <p className="text-sm text-muted-foreground mt-1">{session.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <Button size="sm" variant="outline" onClick={() => window.open(session.meeting_url, '_blank')}>
                      <ExternalLink className="w-4 h-4 mr-1" />
                      فتح
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openEditDialog(session)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(session.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Sessions */}
      {pastSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>المحاضرات السابقة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pastSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/10 opacity-70">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{session.title}</h4>
                      {getStatusBadge(session.status, session.scheduled_at)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {session.courses?.title} • {format(new Date(session.scheduled_at), 'd MMM yyyy - hh:mm a', { locale: ar })}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(session.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editSession ? 'تعديل المحاضرة' : 'إنشاء محاضرة جديدة'}</DialogTitle>
            <DialogDescription>
              {editSession ? 'قم بتعديل تفاصيل المحاضرة' : 'أضف رابط الاجتماع وحدد الموعد'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>عنوان المحاضرة *</Label>
              <Input placeholder="مثال: مراجعة الأسبوع الأول" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>الدورة *</Label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الدورة" />
                </SelectTrigger>
                <SelectContent>
                  {courses?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>المنصة</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zoom">Zoom</SelectItem>
                  <SelectItem value="google_meet">Google Meet</SelectItem>
                  <SelectItem value="teams">Microsoft Teams</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>رابط الاجتماع *</Label>
              <Input placeholder="https://zoom.us/j/..." value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>الموعد *</Label>
                <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>المدة (دقيقة)</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[30, 45, 60, 90, 120].map(d => (
                      <SelectItem key={d} value={String(d)}>{d} دقيقة</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>وصف (اختياري)</Label>
              <Textarea placeholder="تفاصيل إضافية عن المحاضرة..." value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />جاري الحفظ...</>
              ) : editSession ? 'حفظ التعديلات' : 'إنشاء المحاضرة'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LiveSessionsManagement;
