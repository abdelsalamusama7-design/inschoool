import { Card, CardContent } from '@/components/ui/card';
import { Video } from 'lucide-react';

interface TutorialVideo {
  title: string;
  videoId: string;
  description?: string;
}

interface TutorialVideosProps {
  videos: TutorialVideo[];
  accentColor?: string;
}

const TutorialVideos = ({ videos, accentColor = 'text-primary' }: TutorialVideosProps) => {
  if (videos.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Video className={`h-5 w-5 ${accentColor}`} />
        Tutorial Videos
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video, i) => (
          <Card key={i} className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${video.videoId}`}
                title={video.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <CardContent className="p-3">
              <p className="text-sm font-medium">{video.title}</p>
              {video.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{video.description}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TutorialVideos;
