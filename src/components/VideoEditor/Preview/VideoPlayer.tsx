import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { TimelineItem } from '../VideoEditor';
import { toast } from 'sonner';
import { Volume2, VolumeX } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

const DEFAULT_VIDEO_URL = 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

interface VideoPlayerProps {
  activeVideo: TimelineItem | null;
  currentTime: number;
  isPlaying: boolean;
  muted: boolean;
  volume: number;
  fullscreen: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  duration: number;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  activeVideo,
  currentTime,
  isPlaying,
  muted,
  volume,
  fullscreen,
  containerRef,
  duration
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [initialPlayAttempted, setInitialPlayAttempted] = useState(false);

  // Handle video loading and source changes
  useEffect(() => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    
    if (activeVideo?.src) {
      // Check if this is a new video that needs to be loaded
      if (activeVideo.id !== currentVideoId) {
        console.log('Loading new video:', activeVideo.src);
        setIsVideoReady(false);
        setLoaded(false);
        setInitialPlayAttempted(false);
        
        try {
          video.src = activeVideo.src;
          video.load();
          setCurrentVideoId(activeVideo.id);
        } catch (error) {
          console.error('Error setting video source:', error);
          toast.error('Failed to load video', {
            description: 'Could not set video source. The URL might be invalid.'
          });
        }
      } 
    } else {
      // No active video
      video.src = '';
      setIsVideoReady(false);
      setLoaded(false);
      setInitialPlayAttempted(false);
      setCurrentVideoId(null);
    }
  }, [activeVideo, currentVideoId]);

  // Set up event listeners for the video element
  useEffect(() => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    
    const handleLoadedData = () => {
      console.log('Video loaded successfully');
      setLoaded(true);
      setIsVideoReady(true);
      
      // Try to play if currently playing
      if (isPlaying && video.paused && !initialPlayAttempted) {
        setInitialPlayAttempted(true);
        video.play().catch(error => {
          console.error('Failed to autoplay video:', error);
        });
      }
    };
    
    const handleCanPlayThrough = () => {
      if (!isVideoReady) {
        console.log('Video can play through');
        setIsVideoReady(true);
      }
    };
    
    const handleError = (e: ErrorEvent) => {
      console.error('Video loading error:', e);
      setIsVideoReady(false);
      toast.error('Error loading video', {
        description: 'Could not load the video. Please try a different file.',
      });
    };
    
    const handleEnded = () => {
      if (isPlaying) {
        video.currentTime = 0;
        video.play().catch(console.error);
      }
    };
    
    // Add event listeners
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplaythrough', handleCanPlayThrough);
    video.addEventListener('error', handleError as EventListener);
    video.addEventListener('ended', handleEnded);
    
    // Clean up
    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplaythrough', handleCanPlayThrough);
      video.removeEventListener('error', handleError as EventListener);
      video.removeEventListener('ended', handleEnded);
    };
  }, [isPlaying, initialPlayAttempted, isVideoReady]);

  // Handle video playback and synchronization
  useEffect(() => {
    if (!videoRef.current || !activeVideo || !isVideoReady) return;

    const video = videoRef.current;
    
    // Calculate relative time position in the clip
    const relativeTime = Math.max(0, currentTime - activeVideo.start);
    
    // Apply video trimming if set
    const trimStart = activeVideo.trimStart || 0;
    const trimEnd = activeVideo.trimEnd || 0;
    const maxDuration = activeVideo.duration - trimStart - trimEnd;
    
    // Ensure we don't go beyond the trimmed bounds
    const clampedRelativeTime = Math.min(maxDuration, Math.max(0, relativeTime));
    const targetTime = trimStart + clampedRelativeTime;

    // Update video position if needed - use a larger threshold for seeking to avoid constant small adjustments
    if (Math.abs(video.currentTime - targetTime) > 0.5) {
      console.log(`Seeking to ${targetTime} (current: ${video.currentTime})`);
      try {
        video.currentTime = targetTime;
      } catch (error) {
        console.error('Error seeking video:', error);
      }
    }

    // Update volume
    const clipVolume = (activeVideo.volume || 1) * (muted ? 0 : volume);
    video.volume = Math.max(0, Math.min(1, clipVolume)); // Ensure volume is between 0 and 1

    // Handle play/pause
    if (isPlaying) {
      if (video.paused) {
        console.log('Playing video:', activeVideo.src);
        video.play().catch(err => {
          console.error('Failed to play video:', err);
          toast.error('Playback error', {
            description: 'Could not play the video. Please try again.',
          });
        });
      }
    } else {
      if (!video.paused) {
        video.pause();
      }
    }
  }, [activeVideo, currentTime, isPlaying, isVideoReady, volume, muted]);

  const toggleVideoVolume = () => {
    setShowVolumeControl(prev => !prev);
  };

  return (
    <div className="flex-1 bg-[#1a1a1a] flex items-center justify-center relative p-4">
      <div className={cn(
        "relative aspect-video bg-black rounded overflow-hidden shadow-lg",
        fullscreen ? "w-full h-full" : "w-[90%] mx-auto"
      )}>
        <video 
          ref={videoRef} 
          className="w-full h-full object-contain"
          playsInline
          preload="auto"
        />
        
        {activeVideo && (
          <div className="absolute bottom-0 right-0 p-2 flex items-center space-x-2 bg-black/40 rounded-tl-md">
            <button 
              className="w-7 h-7 flex items-center justify-center text-[#F7F8F6] hover:text-[#D7F266] transition-colors"
              onClick={toggleVideoVolume}
              title="Adjust video volume"
            >
              {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            
            {showVolumeControl && (
              <div className="w-24 px-2 py-1 bg-black/80 rounded-full">
                <Slider
                  value={[activeVideo.volume || 1]}
                  min={0}
                  max={1}
                  step={0.1}
                  onValueChange={(value) => {
                    if (videoRef.current) {
                      videoRef.current.volume = value[0] * (muted ? 0 : volume);
                      const event = new CustomEvent('video-volume-change', {
                        detail: {
                          id: activeVideo.id,
                          volume: value[0]
                        }
                      });
                      window.dispatchEvent(event);
                    }
                  }}
                  className="h-1"
                />
                <div className="text-[10px] text-center text-[#F7F8F6] mt-1">
                  {Math.round((activeVideo.volume || 1) * 100)}%
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Loading indicator */}
        {activeVideo && !isVideoReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D7F266]"></div>
          </div>
        )}
        
        {/* No video message */}
        {!activeVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white/70">
            <p>Add and select media to preview</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;
