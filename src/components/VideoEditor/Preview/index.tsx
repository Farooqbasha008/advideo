import React, { useRef, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { TimelineItem } from '../VideoEditor';
import VideoPlayer from './VideoPlayer';
import ActiveMediaDisplay from './ActiveMediaDisplay';
import AudioManager from './AudioManager';
import { Maximize, Volume2, VolumeX, Play, Pause, Minimize2 } from 'lucide-react';

interface PreviewProps {
  currentTime: number;
  isPlaying: boolean;
  timelineItems: TimelineItem[];
  volume: number;
  muted: boolean;
  duration: number;
  onToggleMute: () => void;
  onVolumeChange: (value: number) => void;
  onPlayPause: () => void;
}

const Preview: React.FC<PreviewProps> = ({ 
  currentTime, 
  isPlaying, 
  timelineItems,
  volume,
  muted,
  duration,
  onToggleMute,
  onVolumeChange,
  onPlayPause
}) => {
  const [fullscreen, setFullscreen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeMedia, setActiveMedia] = useState({
    videos: [] as TimelineItem[],
    audios: [] as TimelineItem[]
  });
  
  // Find active media items based on current time
  useEffect(() => {
    console.log('Finding active media at time:', currentTime);
    const videos = timelineItems.filter(item => 
      item.type === 'video' && 
      currentTime >= item.start && 
      currentTime < (item.start + item.duration)
    );
    
    const audios = timelineItems.filter(item => 
      item.type === 'audio' && 
      currentTime >= item.start && 
      currentTime < (item.start + item.duration)
    );
    
    console.log('Active videos:', videos.length, 'Active audios:', audios.length);
    setActiveMedia({ videos, audios });
  }, [currentTime, timelineItems]);
  
  // Get the top video (last one in the array)
  const activeVideo = activeMedia.videos.length > 0 ? 
    activeMedia.videos[activeMedia.videos.length - 1] : null;
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    onVolumeChange(newVolume);
  };
  
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        toast.error('Error attempting to enable fullscreen', {
          description: err.message
        });
      });
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const toggleMinimized = () => {
    setMinimized(prev => !prev);
  };
  
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <div ref={containerRef} className={`flex-1 bg-[#151514] flex flex-col overflow-hidden animate-fade-in preview-container ${minimized ? 'h-20' : ''}`} style={{ minHeight: minimized ? '80px' : '360px' }} data-preview-container>
      {!minimized ? (
        <VideoPlayer 
          activeVideo={activeVideo}
          currentTime={currentTime}
          isPlaying={isPlaying}
          muted={muted}
          volume={volume}
          fullscreen={fullscreen}
          containerRef={containerRef}
          duration={duration}
        />
      ) : (
        <div className="h-20 flex items-center justify-center bg-editor-panel/30 text-[#F7F8F6]/80">
          Preview minimized - Click to restore
        </div>
      )}
      
      <div className="p-2 flex items-center justify-between border-b border-white/10 bg-[#151514]">
        <div className="flex items-center gap-2">
          <button 
            className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            onClick={onPlayPause}
          >
            {isPlaying ? 
              <Pause size={14} className="text-[#F7F8F6]" /> : 
              <Play size={14} className="text-[#F7F8F6] ml-0.5" />
            }
          </button>
          
          <button 
            className="w-7 h-7 flex items-center justify-center text-[#F7F8F6]/80 hover:text-[#F7F8F6] transition-colors"
            onClick={onToggleMute}
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-16 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#D7F266] [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>
        
        <div className="text-[#F7F8F6]/80 text-xs">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            className="w-7 h-7 flex items-center justify-center text-[#F7F8F6]/80 hover:text-[#F7F8F6] transition-colors"
            onClick={toggleMinimized}
            title={minimized ? "Expand preview" : "Minimize preview"}
          >
            <Minimize2 size={14} />
          </button>
          <button
            className="w-7 h-7 flex items-center justify-center text-[#F7F8F6]/80 hover:text-[#F7F8F6] transition-colors"
            onClick={toggleFullscreen}
          >
            <Maximize size={14} />
          </button>
        </div>
      </div>
      
      <AudioManager 
        activeAudios={activeMedia.audios}
        currentTime={currentTime}
        isPlaying={isPlaying}
        volume={volume}
        muted={muted}
      />
      
      {!minimized && (
        <ActiveMediaDisplay 
          activeVideos={activeMedia.videos}
          activeAudios={activeMedia.audios}
        />
      )}
    </div>
  );
};

export default Preview;
