
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { FileAudio, Play, Pause, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TimelineItem } from './VideoEditor';

interface AudioExtractorProps {
  videoItem: TimelineItem | null;
  onAddExtractedAudio: (item: TimelineItem) => void;
}

const AudioExtractor: React.FC<AudioExtractorProps> = ({ videoItem, onAddExtractedAudio }) => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [extractedAudioUrl, setExtractedAudioUrl] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const destinationRef = React.useRef<MediaStreamAudioDestinationNode | null>(null);

  useEffect(() => {
    // Clean up resources when component unmounts
    return () => {
      if (extractedAudioUrl && extractedAudioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(extractedAudioUrl);
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [extractedAudioUrl]);

  const extractAudio = async () => {
    if (!videoItem || !videoItem.src) {
      toast.error('No video selected for audio extraction');
      return;
    }

    setIsExtracting(true);
    toast.info('Extracting audio from video...');

    try {
      // Create video element to process
      const video = document.createElement('video');
      video.src = videoItem.src;
      video.muted = true;
      
      // Wait for video metadata to load
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error('Failed to load video'));
        video.load();
      });

      // Create audio context and connect to destination
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      // Create media stream destination to collect audio
      const destination = audioContext.createMediaStreamDestination();
      destinationRef.current = destination;
      
      // Connect video source to audio destination
      const source = audioContext.createMediaElementSource(video);
      source.connect(destination);
      source.connect(audioContext.destination);
      
      // Create a media recorder to capture the audio
      const mediaRecorder = new MediaRecorder(destination.stream);
      const audioChunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        if (audioChunks.length === 0) {
          toast.error('No audio data was captured from the video');
          setIsExtracting(false);
          return;
        }
        
        // Create a blob from the audio chunks
        const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
        
        // Clean up previous URL if exists
        if (extractedAudioUrl && extractedAudioUrl.startsWith('blob:')) {
          URL.revokeObjectURL(extractedAudioUrl);
        }
        
        // Create a URL for the blob
        const audioUrl = URL.createObjectURL(audioBlob);
        setExtractedAudioUrl(audioUrl);
        
        toast.success('Audio extracted successfully!', {
          description: `Extracted from ${videoItem.name}`
        });
        
        setIsExtracting(false);
      };
      
      // Start recording
      mediaRecorder.start();
      
      // Play the video (muted) to process audio
      video.currentTime = 0;
      await video.play();
      
      // Stop recording when video ends or after 30 seconds (safety)
      const recordingDuration = Math.min(video.duration * 1000, 30000);
      
      setTimeout(() => {
        mediaRecorder.stop();
        video.pause();
        video.src = '';
      }, recordingDuration);
      
    } catch (error) {
      console.error('Error extracting audio:', error);
      toast.error('Failed to extract audio', {
        description: 'An error occurred during audio extraction.',
      });
      setIsExtracting(false);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current || !extractedAudioUrl) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error('Failed to play audio:', err);
        toast.error('Failed to play audio');
      });
    }
    setIsPlaying(!isPlaying);
  };

  const addToTimeline = () => {
    if (!extractedAudioUrl || !videoItem) return;
    
    const newAudioItem: TimelineItem = {
      id: `audio-${Date.now()}`,
      trackId: 'track3', // First audio track
      start: 0,
      duration: videoItem.duration,
      type: 'audio',
      name: `Audio from ${videoItem.name}`,
      color: 'bg-blue-400/70',
      src: extractedAudioUrl,
      thumbnail: '',
      volume: 1.0,
    };
    
    onAddExtractedAudio(newAudioItem);
    toast.success('Audio added to timeline', {
      description: `Added to Audio Track 1`
    });
  };

  const downloadAudio = () => {
    if (!extractedAudioUrl) return;
    
    // Create a temporary link element to trigger the download
    const a = document.createElement('a');
    a.href = extractedAudioUrl;
    a.download = `audio_from_${videoItem?.name || 'video'}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast.success('Audio download started');
  };

  return (
    <div className="p-3 border-t border-white/10">
      {videoItem ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm text-[#F7F8F6] font-medium">Extract Audio</div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs bg-editor-panel border-white/20 hover:bg-editor-hover"
              onClick={extractAudio}
              disabled={isExtracting}
            >
              {isExtracting ? 'Extracting...' : 'Extract'}
            </Button>
          </div>
          
          {extractedAudioUrl && (
            <>
              <div className="flex items-center gap-2 mt-2 bg-editor-panel/50 p-2 rounded">
                <FileAudio size={16} className="text-[#D7F266]" />
                <div className="text-xs text-[#F7F8F6]/90 truncate flex-1">
                  Audio from {videoItem.name}
                </div>
                <button
                  className="p-1 bg-editor-hover rounded-full"
                  onClick={handlePlayPause}
                >
                  {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                </button>
              </div>
              
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs flex-1 bg-editor-panel border-white/20 hover:bg-editor-hover"
                  onClick={addToTimeline}
                >
                  Add to Timeline
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs flex items-center gap-1 bg-editor-panel border-white/20 hover:bg-editor-hover"
                  onClick={downloadAudio}
                >
                  <Download size={12} />
                </Button>
              </div>
              
              <audio ref={audioRef} src={extractedAudioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
            </>
          )}
        </div>
      ) : (
        <div className="text-xs text-[#F7F8F6]/60 text-center">
          Select a video to extract audio
        </div>
      )}
      
      {/* Hidden elements for processing */}
      <canvas ref={canvasRef} className="hidden" width="1" height="1"></canvas>
      <video ref={videoRef} className="hidden"></video>
    </div>
  );
};

export default AudioExtractor;
