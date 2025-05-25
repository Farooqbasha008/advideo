import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Download, X } from 'lucide-react';
import { TimelineItem } from './VideoEditor';
import { toast } from 'sonner';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

// Define export formats and quality presets
export type ExportFormat = 'mp4' | 'webm' | 'gif';
export type ExportQuality = 'draft' | 'standard' | 'high';
export type ExportSize = '720p' | '1080p' | '480p';

interface ExportOptions {
  format: ExportFormat;
  quality: ExportQuality;
  size: ExportSize;
}

interface ExportServiceProps {
  isOpen: boolean;
  onClose: () => void;
  timelineItems: TimelineItem[];
  projectName: string;
}

// Create FFmpeg instance with config
const ffmpegInstance = new FFmpeg({
  log: true,
  corePath: 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/ffmpeg-core.js',
});

// Flag to track if FFmpeg has been loaded
let ffmpegLoaded = false;

// WebCodecs support detection
const isWebCodecsSupported = () => {
  return 'VideoEncoder' in window && 'VideoDecoder' in window;
};

// Video composition class for frame-by-frame rendering
class VideoCompositor {
  private canvas: OffscreenCanvas;
  private ctx: OffscreenCanvasRenderingContext2D;
  private width: number;
  private height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.canvas = new OffscreenCanvas(width, height);
    this.ctx = this.canvas.getContext('2d')!;
  }

  async renderFrame(timelineItems: TimelineItem[], currentTime: number): Promise<VideoFrame | ImageData> {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Render video items at current time
    for (const item of timelineItems) {
      if (item.type === 'video' && 
          currentTime >= item.start && 
          currentTime < item.start + item.duration) {
        
        const relativeTime = currentTime - item.start;
        await this.drawVideoFrame(item, relativeTime);
      }
    }

    // Get frame data
    const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
    
    // Return VideoFrame if WebCodecs is supported, otherwise ImageData
    if (isWebCodecsSupported()) {
      // Create ImageBitmap from ImageData before creating VideoFrame
      return createImageBitmap(imageData).then(bitmap => {
        return new VideoFrame(bitmap, { timestamp: currentTime * 1000000 }); // microseconds
      });
    }
    
    return imageData;
  }

  private async drawVideoFrame(item: TimelineItem, relativeTime: number) {
    // This would need to be implemented with actual video frame extraction
    // For now, we'll use a placeholder approach
    if (item.src) {
      try {
        // In a real implementation, you'd extract the frame at relativeTime
        // from the video source and draw it to the canvas
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Add text overlay showing the video item
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Video: ${item.src.substring(0, 20)}...`, 50, 50);
        this.ctx.fillText(`Time: ${relativeTime.toFixed(2)}s`, 50, 80);
      } catch (error) {
        console.error('Error drawing video frame:', error);
      }
    }
  }

  getCanvas(): OffscreenCanvas {
    return this.canvas;
  }
}

// Audio mixer class for handling audio composition
class AudioMixer {
  private audioContext: OfflineAudioContext;
  private sampleRate: number;
  private channels: number;

  constructor(duration: number, sampleRate: number = 44100, channels: number = 2) {
    this.sampleRate = sampleRate;
    this.channels = channels;
    this.audioContext = new OfflineAudioContext(channels, duration * sampleRate, sampleRate);
  }

  async mixAudioTracks(timelineItems: TimelineItem[]): Promise<AudioBuffer> {
    const audioItems = timelineItems.filter(item => item.type === 'audio');
    
    // Create audio sources and schedule them
    for (const item of audioItems) {
      if (item.src) {
        try {
          // Load and decode audio
          const response = await fetch(item.src);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
          
          // Create source and schedule playback
          const source = this.audioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(this.audioContext.destination);
          source.start(item.start);
        } catch (error) {
          console.error('Error loading audio:', error);
        }
      }
    }

    return await this.audioContext.startRendering();
  }
}

const ExportService: React.FC<ExportServiceProps> = ({ 
  isOpen, 
  onClose, 
  timelineItems,
  projectName 
}) => {
  const [options, setOptions] = useState<ExportOptions>({
    format: 'mp4',
    quality: 'standard',
    size: '720p'
  });
  const [progress, setProgress] = useState<number>(0);
  const [stage, setStage] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  
  // Get video dimensions based on size selection
  const getVideoDimensions = (size: ExportSize): { width: number, height: number } => {
    switch (size) {
      case '1080p': return { width: 1920, height: 1080 };
      case '720p': return { width: 1280, height: 720 };
      case '480p': return { width: 854, height: 480 };
      default: return { width: 1280, height: 720 };
    }
  };
  
  // Get FFmpeg quality settings
  const getFFmpegQualitySettings = (quality: ExportQuality): string => {
    switch (quality) {
      case 'high': return '-crf 18 -preset slow';
      case 'standard': return '-crf 23 -preset medium';
      case 'draft': return '-crf 28 -preset ultrafast';
      default: return '-crf 23 -preset medium';
    }
  };
  
  // Clipchamp-style export process using WebCodecs + FFmpeg hybrid approach
  const startExport = async () => {
    if (timelineItems.length === 0) {
      toast.error('Nothing to export', {
        description: 'Add some media to the timeline first.'
      });
      return;
    }
    
    setIsExporting(true);
    setProgress(0);
    setStage('Initializing export system');
    
    try {
      // Load FFmpeg if not already loaded
      if (!ffmpegLoaded) {
        await ffmpegInstance.load();
        ffmpegLoaded = true;
      }
      
      // Get export settings
      const dimensions = getVideoDimensions(options.size);
      const { width, height } = dimensions;
      
      // Calculate total duration
      const totalDuration = Math.max(...timelineItems.map(item => item.start + item.duration));
      const fps = 30; // Fixed 30 FPS like Clipchamp
      const frameDuration = 1 / fps;
      const totalFrames = Math.ceil(totalDuration * fps);
      
      setStage('Setting up video compositor');
      setProgress(5);
      
      // Initialize compositor and audio mixer
      const compositor = new VideoCompositor(width, height);
      const audioMixer = new AudioMixer(totalDuration);
      
      // Check WebCodecs support and setup encoders
      const useWebCodecs = isWebCodecsSupported();
      let videoEncoder: VideoEncoder | null = null;
      let audioEncoder: AudioEncoder | null = null;
      
      const encodedVideoChunks: EncodedVideoChunk[] = [];
      const encodedAudioChunks: EncodedAudioChunk[] = [];
      
      if (useWebCodecs) {
        setStage('Initializing WebCodecs encoders');
        setProgress(10);
        
        // Setup video encoder with hardware acceleration
        const videoConfig: VideoEncoderConfig = {
          codec: 'avc1.42E01E', // H.264 baseline
          width,
          height,
          bitrate: getVideoBitrate(options.quality, width, height),
          framerate: fps,
          hardwareAcceleration: 'prefer-hardware'
        };
        
        videoEncoder = new VideoEncoder({
          output: (chunk) => {
            encodedVideoChunks.push(chunk);
          },
          error: (error) => {
            console.error('Video encoder error:', error);
          }
        });
        
        videoEncoder.configure(videoConfig);
        
        // Setup audio encoder (fallback to FFmpeg for AAC if needed)
        if ('AudioEncoder' in window) {
          const audioConfig: AudioEncoderConfig = {
            codec: 'opus', // Use Opus as it's well supported
            sampleRate: 44100,
            numberOfChannels: 2,
            bitrate: 128000
          };
          
          audioEncoder = new AudioEncoder({
            output: (chunk) => {
              encodedAudioChunks.push(chunk);
            },
            error: (error) => {
              console.error('Audio encoder error:', error);
            }
          });
          
          audioEncoder.configure(audioConfig);
        }
      }
      
      setStage('Processing audio tracks');
      setProgress(15);
      
      // Mix audio using Web Audio API
      const mixedAudio = await audioMixer.mixAudioTracks(timelineItems);
      
      setStage('Rendering video frames');
      setProgress(20);
      
      // Frame-by-frame composition and encoding
      for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
        const currentTime = frameIndex * frameDuration;
        const progressPercent = 20 + (frameIndex / totalFrames) * 60; // 20-80% for frame processing
        
        setProgress(Math.floor(progressPercent));
        
        if (frameIndex % 30 === 0) { // Update stage every second
          setStage(`Rendering frame ${frameIndex + 1} of ${totalFrames}`);
        }
        
        // Render composed frame
        const frame = await compositor.renderFrame(timelineItems, currentTime);
        
        if (useWebCodecs && videoEncoder && frame instanceof VideoFrame) {
          // Use WebCodecs for hardware-accelerated encoding
          videoEncoder.encode(frame, { keyFrame: frameIndex % 30 === 0 });
          frame.close(); // Important: release VideoFrame resources
        } else {
          // Fallback: convert to raw data for FFmpeg
          // This would need additional implementation for FFmpeg integration
        }
      }
      
      setStage('Finalizing video encoding');
      setProgress(80);
      
      // Flush encoders
      if (videoEncoder) {
        await videoEncoder.flush();
        videoEncoder.close();
      }
      
      if (audioEncoder) {
        // Convert mixed audio to AudioData chunks and encode
        const audioData = mixedAudio.getChannelData(0); // Simplified - would need proper conversion
        // ... encode audio chunks ...
        await audioEncoder.flush();
        audioEncoder.close();
      }
      
      setStage('Muxing final video');
      setProgress(85);
      
      // Use FFmpeg for muxing encoded chunks into final container
      if (useWebCodecs && encodedVideoChunks.length > 0) {
        // Convert WebCodecs chunks to FFmpeg-compatible format
        // This requires custom integration between WebCodecs and FFmpeg
        await muxWithFFmpeg(encodedVideoChunks, encodedAudioChunks, options.format);
      } else {
        // Fallback to pure FFmpeg approach
        await fallbackFFmpegExport();
      }
      
      setStage('Preparing download');
      setProgress(95);
      
      // Read the final output
      const outputFilename = `output.${options.format}`;
      const data = ffmpegInstance.FS('readFile', outputFilename);
      
      if (data) {
        const blob = new Blob([data.buffer], { type: `video/${options.format}` });
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
      } else {
        throw new Error("Failed to read output file");
      }
      
      setStage('Export complete!');
      setProgress(100);
      setIsComplete(true);
      
      toast.success('Export complete!', {
        description: 'Your video is ready for download.'
      });
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed', {
        description: error instanceof Error ? error.message : 'An unknown error occurred'
      });
      setIsExporting(false);
    }
  };
  
  // Helper function to get video bitrate based on quality and resolution
  const getVideoBitrate = (quality: ExportQuality, width: number, height: number): number => {
    const baseRate = width * height * 0.1; // Base calculation
    
    switch (quality) {
      case 'high': return Math.floor(baseRate * 1.5);
      case 'standard': return Math.floor(baseRate);
      case 'draft': return Math.floor(baseRate * 0.5);
      default: return Math.floor(baseRate);
    }
  };
  
  // Mux WebCodecs chunks using FFmpeg
  const muxWithFFmpeg = async (videoChunks: EncodedVideoChunk[], audioChunks: EncodedAudioChunk[], format: string) => {
    // Convert encoded chunks to raw data and write to FFmpeg filesystem
    // This is a simplified version - real implementation would need proper chunk handling
    
    const videoData = new Uint8Array(videoChunks.reduce((acc, chunk) => acc + chunk.byteLength, 0));
    let offset = 0;
    
    for (const chunk of videoChunks) {
      const chunkData = new Uint8Array(chunk.byteLength);
      chunk.copyTo(chunkData);
      videoData.set(chunkData, offset);
      offset += chunk.byteLength;
    }
    
    ffmpegInstance.FS('writeFile', 'encoded_video.h264', videoData);
    
    // Similar process for audio chunks...
    
    // Mux with FFmpeg
    await ffmpegInstance.run(
      '-f', 'h264',
      '-i', 'encoded_video.h264',
      '-c', 'copy',
      `output.${format}`
    );
  };
  
  // Fallback to traditional FFmpeg-only export
  const fallbackFFmpegExport = async () => {
    // Implement traditional FFmpeg export as fallback
    // This would be similar to the original implementation but optimized
    setStage('Using FFmpeg fallback encoding');
    
    // Process files and use FFmpeg for everything
    // ... implementation similar to original but streamlined ...
  };
  
  // Handle download
  const handleDownload = () => {
    if (!downloadUrl) return;
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    
    // Create safe filename
    const safeProjectName = projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.download = `${safeProjectName}_${timestamp}.${options.format}`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Reset export state when closing
  const handleClose = () => {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
    }
    
    // Wait a bit before fully resetting state to avoid UI flashes
    setTimeout(() => {
      setIsComplete(false);
      setIsExporting(false);
      setProgress(0);
      setStage('');
      setDownloadUrl('');
    }, 300);
    
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-[#151514] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Export Video</DialogTitle>
        </DialogHeader>
        
        {!isExporting && !isComplete ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="format">Format</Label>
              <Select 
                value={options.format} 
                onValueChange={(value) => setOptions({...options, format: value as ExportFormat})}
              >
                <SelectTrigger id="format" className="bg-[#1A1A19] border-white/20">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A19] border-white/20">
                  <SelectItem value="mp4">MP4</SelectItem>
                  <SelectItem value="webm">WebM</SelectItem>
                  <SelectItem value="gif">GIF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quality">Quality</Label>
              <Select 
                value={options.quality} 
                onValueChange={(value) => setOptions({...options, quality: value as ExportQuality})}
              >
                <SelectTrigger id="quality" className="bg-[#1A1A19] border-white/20">
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A19] border-white/20">
                  <SelectItem value="draft">Draft (Faster)</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="high">High Quality (Slower)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="size">Resolution</Label>
              <Select 
                value={options.size} 
                onValueChange={(value) => setOptions({...options, size: value as ExportSize})}
              >
                <SelectTrigger id="size" className="bg-[#1A1A19] border-white/20">
                  <SelectValue placeholder="Select resolution" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A19] border-white/20">
                  <SelectItem value="480p">480p</SelectItem>
                  <SelectItem value="720p">720p (HD)</SelectItem>
                  <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : isComplete ? (
          <div className="py-6 flex flex-col items-center justify-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
            <h3 className="text-lg font-semibold text-center">Export Complete!</h3>
            <p className="text-white/80 text-center">
              Your video has been successfully exported. Click the button below to download it.
            </p>
          </div>
        ) : (
          <div className="py-6 space-y-4">
            <div className="flex flex-col items-center justify-center space-y-2">
              <h3 className="text-lg font-semibold">{stage}</h3>
              <Progress value={progress} className="w-full h-2 bg-white/10" />
              <p className="text-sm text-white/70">{progress}% complete</p>
            </div>
            <p className="text-white/60 text-sm text-center">
              This may take several minutes depending on your project size and export quality.
              <br />
              Please don't close this window.
            </p>
          </div>
        )}
        
        <DialogFooter>
          {!isExporting && !isComplete ? (
            <>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button 
                onClick={startExport} 
                className="bg-[#D7F266] text-[#151514] hover:bg-[#D7F266]/80"
              >
                Export
              </Button>
            </>
          ) : isComplete ? (
            <>
              <Button variant="outline" onClick={handleClose}>Close</Button>
              <Button 
                onClick={handleDownload}
                className="bg-[#D7F266] text-[#151514] hover:bg-[#D7F266]/80 flex items-center gap-2"
              >
                <Download className="h-4 w-4" /> Download Video
              </Button>
            </>
          ) : (
            <Button 
              variant="outline" 
              onClick={handleClose} 
              className="flex items-center gap-2"
              disabled={isExporting && progress < 100}
            >
              <X className="h-4 w-4" /> Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportService;
