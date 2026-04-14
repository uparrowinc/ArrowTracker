import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Download, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

interface AudioPlayerProps {
  src: string;
  title: string;
  artist?: string;
  cover?: string;
  protected?: boolean;
  downloadable?: boolean;
  type?: 'music' | 'podcast' | 'radio';
  className?: string;
}

export function AudioPlayer({ 
  src, 
  title, 
  artist,
  cover,
  protected: isProtected = false,
  downloadable = false,
  type = 'music',
  className = ""
}: AudioPlayerProps) {
  const { isAuthenticated } = useAuth();
  const audioRef = useRef<HTMLAudioElement>(null);
  const unlockerRef = useRef<HTMLAudioElement>(null);
  
  // Cache-busting for mobile browsers - add timestamp to force fresh fetch
  const cacheBustedSrc = `${src}?v=${Date.now()}&cb=${Math.random().toString(36).substr(2, 9)}`;
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileUnlocked, setMobileUnlocked] = useState(false);
  
  // Detect mobile browsers
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Check access for protected content
  const hasAccess = !isProtected || isAuthenticated;

  // Mobile audio unlock function
  const unlockMobileAudio = async () => {
    if (!isMobile || mobileUnlocked) return;
    
    try {
      const unlocker = unlockerRef.current;
      if (unlocker) {
        unlocker.muted = true;
        await unlocker.play();
        unlocker.pause();
        setMobileUnlocked(true);
        console.log('Mobile audio unlocked via user gesture');
      }
    } catch (e) {
      console.log('Mobile unlock attempt failed:', e);
    }
  };

  // Global touch/click handler for mobile unlock - works on ANY gesture
  useEffect(() => {
    if (!isMobile) return;
    
    const handleUserGesture = (e: Event) => {
      console.log(`Mobile gesture detected: ${e.type}`);
      unlockMobileAudio();
      // Remove all listeners after first unlock
      document.removeEventListener('touchstart', handleUserGesture);
      document.removeEventListener('click', handleUserGesture);
      document.removeEventListener('scroll', handleUserGesture, true);
      document.removeEventListener('touchmove', handleUserGesture);
    };
    
    // Listen for ANY user interaction
    document.addEventListener('touchstart', handleUserGesture, { passive: true });
    document.addEventListener('click', handleUserGesture);
    document.addEventListener('scroll', handleUserGesture, true);
    document.addEventListener('touchmove', handleUserGesture, { passive: true });
    
    return () => {
      document.removeEventListener('touchstart', handleUserGesture);
      document.removeEventListener('click', handleUserGesture);
      document.removeEventListener('scroll', handleUserGesture, true);
      document.removeEventListener('touchmove', handleUserGesture);
    };
  }, [isMobile, mobileUnlocked]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleLoadStart = () => {
      console.log('Audio loading started:', src);
      setIsLoading(true);
      setError(null);
    };
    const handleCanPlay = () => {
      console.log('Audio can play:', src);
      console.log(`Audio state - readyState: ${audio.readyState}, networkState: ${audio.networkState}, duration: ${audio.duration}`);
      setIsLoading(false);
    };
    const handleError = (e: any) => {
      const errorTarget = e.target as HTMLAudioElement;
      const mediaError = errorTarget?.error;
      
      let errorMsg = 'Failed to load audio';
      let errorDetails = '';
      
      if (mediaError) {
        switch (mediaError.code) {
          case mediaError.MEDIA_ERR_ABORTED:
            errorMsg = 'Audio loading was aborted';
            errorDetails = 'User cancelled the load';
            break;
          case mediaError.MEDIA_ERR_NETWORK:
            errorMsg = 'Network error while loading audio';
            errorDetails = 'Check network connection or CORS headers';
            break;
          case mediaError.MEDIA_ERR_DECODE:
            errorMsg = 'Audio format not supported';
            errorDetails = 'Browser cannot decode this audio format';
            break;
          case mediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMsg = 'Audio source not supported';
            errorDetails = 'Invalid source URL or missing file';
            break;
        }
        console.error(`Audio error [${mediaError.code}]: ${errorMsg} - ${errorDetails}`, src);
      } else {
        console.error('Audio load error:', e, src);
      }
      
      setError(errorMsg);
      setIsLoading(false);
    };
    const handleLoadedData = () => {
      console.log('Audio data loaded:', src);
      console.log(`Mobile unlocked: ${mobileUnlocked}, Is mobile: ${isMobile}`);
      setIsLoading(false);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('error', handleError);

    // Force load after a brief delay to handle network issues
    const loadTimeout = setTimeout(() => {
      if (audio.readyState === 0) {
        console.log('Force loading audio:', src);
        audio.load();
        
        // Enhanced mobile/desktop auto-nudge fix
        setTimeout(async () => {
          if (audio.readyState > 0 && audio.duration > 0) {
            const originalTime = audio.currentTime;
            
            if (isMobile && !mobileUnlocked) {
              // Mobile: Try muted play first, then nudge
              try {
                audio.muted = true;
                await audio.play();
                audio.pause();
                audio.muted = false;
                console.log('Mobile: Applied muted play unlock');
              } catch (e) {
                console.log('Mobile unlock play failed:', e);
              }
            }
            
            // Universal nudge for all browsers
            audio.currentTime = Math.min(0.1, audio.duration * 0.01); // 1% or 0.1s
            setTimeout(() => {
              audio.currentTime = originalTime;
              console.log(`Auto-nudge applied (${isMobile ? 'mobile' : 'desktop'})`);
            }, 150);
          }
        }, 800);
      }
    }, 1000);

    return () => {
      clearTimeout(loadTimeout);
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        // Mobile unlock on first play attempt
        if (isMobile && !mobileUnlocked) {
          await unlockMobileAudio();
        }
        
        await audio.play();
        setIsPlaying(true);
      }
    } catch (error: any) {
      console.error('Play error:', error);
      if (error.name === 'NotAllowedError') {
        setError('Audio requires user interaction to play');
      } else {
        setError('Failed to play audio');
      }
      setIsPlaying(false);
    }
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = (value[0] / 100) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = value[0] / 100;
    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProtectedAudioSrc = () => {
    if (!isProtected) return cacheBustedSrc;
    return `/api/media/audio/stream?file=${encodeURIComponent(src)}&token=${Date.now()}&cb=${Math.random().toString(36).substr(2, 9)}`;
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'radio':
        return <Radio className="w-5 h-5" />;
      case 'podcast':
        return <Radio className="w-5 h-5" />;
      default:
        return <Volume2 className="w-5 h-5" />;
    }
  };

  if (!hasAccess) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">Protected Content</div>
            <p className="text-gray-600 mb-4">Please log in to access this audio</p>
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Log In
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">Audio Error</div>
            <p className="text-gray-600">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        {/* Hidden audio unlocker for mobile browsers */}
        {isMobile && (
          <audio
            ref={unlockerRef}
            src="data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA"
            preload="auto"
            style={{ display: 'none' }}
          />
        )}
        
        <audio
          ref={audioRef}
          preload="metadata"
          crossOrigin="anonymous"
          onContextMenu={(e) => isProtected && e.preventDefault()}
          controlsList={isProtected ? "nodownload" : undefined}
        >
          <source src={getProtectedAudioSrc()} type="audio/mpeg" />
          <source src={getProtectedAudioSrc()} type="audio/mp4" />
          <source src={getProtectedAudioSrc()} type="audio/wav" />
          Your browser does not support the audio element.
        </audio>

        <div className="flex items-center space-x-4">
          {/* Cover/Icon */}
          <div className="flex-shrink-0">
            {cover ? (
              <img 
                src={cover} 
                alt={title}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
                {getTypeIcon()}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title and Artist */}
            <div className="mb-3">
              <h3 className="font-semibold text-lg truncate">{title}</h3>
              {artist && <p className="text-gray-600 truncate">{artist}</p>}
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <Slider
                value={[duration ? (currentTime / duration) * 100 : 0]}
                onValueChange={handleSeek}
                max={100}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              {/* Mobile hint - only show on mobile devices and when loading */}
              {isMobile && isLoading && (
                <div className="text-xs text-gray-400 mt-1 text-center">
                  If spinning, gently move slider back and forth to start
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePlay}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                  <div className="w-20">
                    <Slider
                      value={[isMuted ? 0 : volume * 100]}
                      onValueChange={handleVolumeChange}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {downloadable && !isProtected && (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <a href={src} download={title}>
                    <Download className="w-4 h-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}