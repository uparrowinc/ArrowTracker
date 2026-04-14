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

function isIOS() {
  return /iP(hone|od|ad)/i.test(navigator.userAgent);
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

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileUnlocked, setMobileUnlocked] = useState(false);
  const [fallbackMode, setFallbackMode] = useState(
    sessionStorage.getItem('audioFallback') === 'true'
  );

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const hasAccess = !isProtected || isAuthenticated;

  const unlockMobileAudio = async () => {
    if (!isMobile || mobileUnlocked) return;
    try {
      const unlocker = unlockerRef.current;
      if (unlocker) {
        unlocker.muted = true;
        await unlocker.play();
        unlocker.pause();
        setMobileUnlocked(true);
      }
    } catch {}
  };

  // Timeout to auto‑switch to fallback mode
  useEffect(() => {
    if (fallbackMode) return;
    const timeout = setTimeout(() => {
      if (isLoading) {
        setFallbackMode(true);
        sessionStorage.setItem('audioFallback', 'true');
      }
    }, 3000);
    return () => clearTimeout(timeout);
  }, [isLoading, fallbackMode]);

  useEffect(() => {
    if (!isMobile) return;
    const handleUserGesture = () => {
      unlockMobileAudio();
      document.removeEventListener('touchstart', handleUserGesture);
      document.removeEventListener('click', handleUserGesture);
      document.removeEventListener('scroll', handleUserGesture, true);
      document.removeEventListener('touchmove', handleUserGesture);
    };
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
    if (!audio || fallbackMode) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onLoadStart = () => {
      setIsLoading(true);
      setError(null);
    };
    const onCanPlay = () => {
      setIsLoading(false);
      if (isIOS()) {
        const current = audio.currentTime;
        try {
          audio.currentTime = 0.01;
          setTimeout(() => { audio.currentTime = current; }, 50);
        } catch {}
      }
    };
    const onError = () => {
      setError('Failed to load audio');
      setIsLoading(false);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('loadstart', onLoadStart);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('loadstart', onLoadStart);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('error', onError);
    };
  }, [fallbackMode]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        if (isMobile && !mobileUnlocked) await unlockMobileAudio();
        await audio.play();
        setIsPlaying(true);
      }
    } catch (err: any) {
      setError(err.name === 'NotAllowedError'
        ? 'Audio requires user interaction to play'
        : 'Failed to play audio');
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
    const newVol = value[0] / 100;
    audio.volume = newVol;
    setVolume(newVol);
    setIsMuted(newVol === 0);
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
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getProtectedAudioSrc = () => {
    // Add cache-busting for mobile browsers
    const cacheBustedSrc = `${src}?v=${Date.now()}&cb=${Math.random().toString(36).substr(2, 9)}`;
    return !isProtected
      ? cacheBustedSrc
      : `/api/media/audio/stream?file=${encodeURIComponent(src)}&token=${Date.now()}&cb=${Math.random().toString(36).substr(2, 9)}`;
  };

  if (!hasAccess) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <div className="text-lg font-semibold mb-2">Protected Content</div>
          <p className="text-gray-600 mb-4">Please log in to access this audio</p>
          <Button onClick={() => window.location.href = '/api/login'}>Log In</Button>
        </CardContent>
      </Card>
    );
  }

  if (fallbackMode) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
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
                <div className="w-16 h-16 bg-gradient-to-br from-[#163253] to-[#2C4A6E] rounded-lg flex items-center justify-center text-[#C8A466]">
                  <Radio className="w-5 h-5" />
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
              
              {/* Fallback Audio Controls */}
              <audio 
                controls 
                preload="metadata" 
                style={{ width: '100%' }}
                crossOrigin="anonymous"
              >
                <source src={getProtectedAudioSrc()} type="audio/mpeg" />
                <source src={getProtectedAudioSrc()} type="audio/mp4" />
                <source src={getProtectedAudioSrc()} type="audio/wav" />
                Your browser does not support the audio element.
              </audio>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
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
              <div className="w-16 h-16 bg-gradient-to-br from-[#163253] to-[#2C4A6E] rounded-lg flex items-center justify-center text-[#C8A466]">
                <Radio className="w-5 h-5" />
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
