import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Video, Plus, Trash2, Loader2, Save, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface TutorialVideoRecord {
  id: string;
  lab_type: string;
  video_id: string;
  title: string;
  description: string | null;
  order_index: number;
}

const labTypes = [
  { value: 'scratch', label: 'Scratch Lab', color: 'text-orange-500' },
  { value: 'python', label: 'Python Lab', color: 'text-blue-500' },
  { value: 'roblox', label: 'Roblox Lab', color: 'text-red-500' },
  { value: 'minecraft', label: 'Minecraft Lab', color: 'text-green-500' },
];

const ManageTutorialVideos = () => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<TutorialVideoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedLab, setSelectedLab] = useState('scratch');

  // New video form
  const [newTitle, setNewTitle] = useState('');
  const [newVideoId, setNewVideoId] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, [selectedLab]);

  const fetchVideos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tutorial_videos')
      .select('*')
      .eq('lab_type', selectedLab)
      .order('order_index', { ascending: true });

    if (!error && data) {
      setVideos(data as TutorialVideoRecord[]);
    }
    setLoading(false);
  };

  const extractVideoId = (input: string): string => {
    // Handle full YouTube URLs
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) return match[1];
    }
    // Assume it's already a video ID
    return input.trim();
  };

  const handleAdd = async () => {
    if (!newTitle.trim() || !newVideoId.trim()) {
      toast.error('العنوان ورابط الفيديو مطلوبان');
      return;
    }

    setAdding(true);
    const videoId = extractVideoId(newVideoId);

    const { error } = await supabase.from('tutorial_videos').insert({
      lab_type: selectedLab,
      video_id: videoId,
      title: newTitle.trim(),
      description: newDescription.trim() || null,
      created_by: user!.id,
      order_index: videos.length,
    });

    if (error) {
      toast.error('حدث خطأ أثناء الإضافة');
      console.error(error);
    } else {
      toast.success('تم إضافة الفيديو بنجاح');
      setNewTitle('');
      setNewVideoId('');
      setNewDescription('');
      fetchVideos();
    }
    setAdding(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('tutorial_videos').delete().eq('id', id);
    if (error) {
      toast.error('حدث خطأ أثناء الحذف');
    } else {
      toast.success('تم حذف الفيديو');
      setVideos(prev => prev.filter(v => v.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-primary/10">
          <Video className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">إدارة الفيديوهات التعليمية</h1>
          <p className="text-muted-foreground">أضف وأدر فيديوهات YouTube لكل مختبر</p>
        </div>
      </div>

      {/* Lab selector */}
      <div className="flex items-center gap-3">
        <Label>المختبر:</Label>
        <Select value={selectedLab} onValueChange={setSelectedLab}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {labTypes.map(lab => (
              <SelectItem key={lab.value} value={lab.value}>{lab.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Add new video form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" />
            إضافة فيديو جديد
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>عنوان الفيديو *</Label>
              <Input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="مثال: مقدمة في Scratch"
              />
            </div>
            <div className="space-y-1.5">
              <Label>رابط أو معرف الفيديو *</Label>
              <Input
                value={newVideoId}
                onChange={e => setNewVideoId(e.target.value)}
                placeholder="رابط YouTube أو Video ID"
                dir="ltr"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>وصف (اختياري)</Label>
            <Textarea
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              placeholder="وصف مختصر للفيديو"
              rows={2}
            />
          </div>
          <Button onClick={handleAdd} disabled={adding} className="gap-2">
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            إضافة الفيديو
          </Button>
        </CardContent>
      </Card>

      {/* Existing videos list */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">
          الفيديوهات الحالية ({videos.length})
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : videos.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-muted-foreground">
              لا توجد فيديوهات مضافة لهذا المختبر بعد
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map(video => (
              <Card key={video.id} className="overflow-hidden">
                <div className="aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${video.video_id}`}
                    title={video.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <CardContent className="p-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{video.title}</p>
                    {video.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{video.description}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(video.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageTutorialVideos;
