import { useState } from 'react';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface YouTubeEmbedProps {
  videoId: string;
  title: string;
  thumbnail?: string;
  autoplay?: boolean;
  showControls?: boolean;
  startTime?: number;
  endTime?: number;
  privacy?: boolean; // Use youtube-nocookie.com
  className?: string;
}

export function YouTubeEmbed({
  videoId,
  title,
  thumbnail,
  autoplay = false,
  showControls = true,
  startTime,
  endTime,
  privacy = true,
  className = ""
}: YouTubeEmbedProps) {
  const [isLoaded, setIsLoaded] = useState(autoplay);
  const [isLoading, setIsLoading] = useState(false);

  const getYouTubeUrl = () => {
    const baseUrl = privacy ? 'https://www.youtube-nocookie.com' : 'https://www.youtube.com';
    const params = new URLSearchParams();
    
    if (autoplay) params.set('autoplay', '1');
    if (!showControls) params.set('controls', '0');
    if (startTime) params.set('start', startTime.toString());
    if (endTime) params.set('end', endTime.toString());
    
    // Enable privacy-enhanced mode
    params.set('rel', '0'); // Don't show related videos
    params.set('modestbranding', '1'); // Minimize YouTube branding
    
    return `${baseUrl}/embed/${videoId}?${params.toString()}`;
  };

  const getThumbnailUrl = () => {
    if (thumbnail) return thumbnail;
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  };

  const loadVideo = () => {
    setIsLoading(true);
    setIsLoaded(true);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  if (!isLoaded) {
    return (
      <div className={`relative bg-black rounded-lg overflow-hidden group cursor-pointer ${className}`}>
        <div className="aspect-video relative">
          <img
            src={getThumbnailUrl()}
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to standard quality thumbnail
              e.currentTarget.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            }}
          />
          
          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-50 transition-all">
            <Button
              onClick={loadVideo}
              className="bg-red-600 hover:bg-red-700 text-white rounded-full w-16 h-16 p-0 transform group-hover:scale-110 transition-transform"
              aria-label={`Play ${title}`}
            >
              <Play className="w-6 h-6 ml-1" fill="currentColor" />
            </Button>
          </div>
          
          {/* YouTube Logo */}
          <div className="absolute bottom-4 right-4 bg-red-600 text-white px-2 py-1 rounded text-sm font-semibold">
            YouTube
          </div>
          
          {/* Title Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4">
            <h3 className="text-white font-semibold text-lg drop-shadow-lg line-clamp-2">
              {title}
            </h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      <div className="aspect-video">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="flex flex-col items-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
              <p>Loading video...</p>
            </div>
          </div>
        )}
        
        <iframe
          src={getYouTubeUrl()}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full"
          onLoad={handleIframeLoad}
          loading="lazy"
        />
      </div>
    </div>
  );
}

// Utility function to extract video ID from YouTube URL
export function extractYouTubeId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Component for YouTube URL input with preview
interface YouTubeInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidVideo?: (videoId: string) => void;
  placeholder?: string;
  className?: string;
}

export function YouTubeInput({ 
  value, 
  onChange, 
  onValidVideo,
  placeholder = "Enter YouTube URL...",
  className = ""
}: YouTubeInputProps) {
  const [videoId, setVideoId] = useState<string | null>(null);

  const handleInputChange = (inputValue: string) => {
    onChange(inputValue);
    
    const extractedId = extractYouTubeId(inputValue);
    setVideoId(extractedId);
    
    if (extractedId && onValidVideo) {
      onValidVideo(extractedId);
    }
  };

  return (
    <div className={className}>
      <input
        type="url"
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      
      {videoId && (
        <div className="mt-3">
          <p className="text-sm text-gray-600 mb-2">Preview:</p>
          <div className="max-w-sm">
            <YouTubeEmbed
              videoId={videoId}
              title="YouTube Video Preview"
              autoplay={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}