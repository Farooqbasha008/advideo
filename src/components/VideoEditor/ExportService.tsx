import React, { useState } from 'react';
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
  
  // Start export process
  const startExport = async () => {
    if (timelineItems.length === 0) {
      toast.error('Nothing to export', {
        description: 'Add some media to the timeline first.'
      });
      return;
    }
    
    setIsExporting(true);
    setProgress(0);
    setStage('Initializing FFmpeg');
    
    try {
      // Load FFmpeg if not already loaded
      if (!ffmpegLoaded) {
        await ffmpegInstance.load();
        ffmpegLoaded = true;
      }
      
      // Configure progress tracking - using the updated API pattern
      const progressCallback = ({ ratio }: { ratio: number }) => {
        setProgress(Math.floor(ratio * 100));
      };
      
      // Configure logging - using the updated API pattern
      const loggerCallback = ({ message }: { message: string }) => {
        console.log('FFmpeg Log:', message);
      };
      
      // Set up progress and logging callbacks
      ffmpegInstance.setProgress(progressCallback);
      ffmpegInstance.setLogger(loggerCallback);
      
      // Process video items
      const videoItems = timelineItems.filter(item => item.type === 'video');
      const audioItems = timelineItems.filter(item => item.type === 'audio');
      
      if (videoItems.length === 0) {
        throw new Error('No video content found in timeline');
      }
      
      setStage('Downloading media files');
      
      // Download and process video files
      let inputFileList: string[] = [];
      let videoFiles: {name: string, start: number, duration: number}[] = [];
      
      // Helper function to create a clean filename from URL
      const createFilenameFromUrl = (url: string, index: number): string => {
        return `input_${index}_${Date.now()}.mp4`;
      };
      
      // Process video files
      for (let i = 0; i < videoItems.length; i++) {
        const item = videoItems[i];
        if (!item.src) continue;
        
        setStage(`Downloading video ${i+1} of ${videoItems.length}`);
        setProgress((i / videoItems.length) * 30); // First 30% for downloading
        
        try {
          const response = await fetch(item.src);
          if (!response.ok) throw new Error(`Failed to fetch ${item.src}`);
          
          const data = await response.arrayBuffer();
          const filename = createFilenameFromUrl(item.src, i);
          
          // Write file to FFmpeg virtual filesystem
          ffmpegInstance.FS('writeFile', filename, new Uint8Array(data));
          
          videoFiles.push({
            name: filename,
            start: item.start,
            duration: item.duration
          });
          
          inputFileList.push(filename);
        } catch (error) {
          console.error(`Error downloading video ${i+1}:`, error);
          toast.error(`Error downloading video ${i+1}`, {
            description: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      // Process audio files
      const audioFileList: {name: string, start: number, duration: number}[] = [];
      
      for (let i = 0; i < audioItems.length; i++) {
        const item = audioItems[i];
        if (!item.src) continue;
        
        setStage(`Downloading audio ${i+1} of ${audioItems.length}`);
        setProgress(30 + (i / audioItems.length) * 10); // 30-40% for downloading audio
        
        try {
          const response = await fetch(item.src);
          if (!response.ok) throw new Error(`Failed to fetch ${item.src}`);
          
          const data = await response.arrayBuffer();
          const filename = `audio_${i}_${Date.now()}.mp3`;
          
          // Write file to FFmpeg virtual filesystem
          ffmpegInstance.FS('writeFile', filename, new Uint8Array(data));
          
          audioFileList.push({
            name: filename,
            start: item.start,
            duration: item.duration
          });
        } catch (error) {
          console.error(`Error downloading audio ${i+1}:`, error);
        }
      }
      
      // Create concatenation list for videos
      setStage('Preparing video files');
      setProgress(40);
      
      // Sort videos by start time
      videoFiles.sort((a, b) => a.start - b.start);
      
      // Generate concat file for ffmpeg
      let concatContent = '';
      
      for (const video of videoFiles) {
        concatContent += `file ${video.name}\n`;
      }
      
      ffmpegInstance.FS('writeFile', 'concat_list.txt', new TextEncoder().encode(concatContent));
      
      // Concatenate videos
      setStage('Combining videos');
      setProgress(50);
      
      // Get export settings
      const dimensions = getVideoDimensions(options.size);
      const qualitySettings = getFFmpegQualitySettings(options.quality);
      
      const outputFilename = `output.${options.format}`;
      
      // Build command for concatenating videos
      await ffmpegInstance.run(
        '-f', 'concat',
        '-safe', '0',
        '-i', 'concat_list.txt',
        '-c', 'copy',
        'temp_concat.mp4'
      );
      
      // Mix in audio tracks if available
      if (audioFileList.length > 0) {
        setStage('Adding audio tracks');
        setProgress(70);
        
        // Create individual audio files with silence padding for position
        const audioFilterComplex = audioFileList.map((audio, index) => {
          // Create silent padding for the start position
          const silencePad = `[0:a]atrim=0:${audio.start},asetpts=PTS-STARTPTS[silence${index}];`;
          
          // Get the audio and trim it to the specified duration
          const audioIn = `aevalsrc=0:d=${audio.duration}[a${index}];`;
          
          return `${silencePad}${audioIn}[silence${index}][a${index}]concat=v=0:a=1[aout${index}];`;
        }).join('');
        
        // Mix all audio tracks together
        const mixInputs = audioFileList.map((_, index) => `[aout${index}]`).join('');
        const mixFilter = `${mixInputs}amix=inputs=${audioFileList.length}:duration=longest[aout]`;
        
        // Add filter to main command
        const audioCommand = `-filter_complex "${audioFilterComplex}${mixFilter}" -map 0:v -map "[aout]" -c:v copy -c:a aac -shortest`;
        
        await ffmpegInstance.run(
          '-i', 'temp_concat.mp4',
          ...audioCommand.split(' '),
          'temp_with_audio.mp4'
        );
      }
      
      // Apply final encoding with selected quality/format
      setStage('Finalizing export');
      setProgress(80);
      
      const inputFile = audioFileList.length > 0 ? 'temp_with_audio.mp4' : 'temp_concat.mp4';
      
      // Final encoding with quality settings and dimensions
      await ffmpegInstance.run(
        '-i', inputFile,
        '-s', `${dimensions.width}x${dimensions.height}`,
        ...qualitySettings.split(' '),
        outputFilename
      );
      
      // Read the output file
      setStage('Preparing download');
      setProgress(95);
      
      const data = ffmpegInstance.FS('readFile', outputFilename);
      
      // Check if data is available before accessing buffer property
      if (data) {
        const blob = new Blob([data.buffer], { type: `video/${options.format}` });
        
        // Create download URL
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
      } else {
        throw new Error("Failed to read output file");
      }
      
      // Cleanup
      setStage('Export complete!');
      setProgress(100);
      setIsComplete(true);
      
      // Cleanup temporary files
      inputFileList.forEach(file => {
        try {
          ffmpegInstance.FS('unlink', file);
        } catch (e) {
          console.warn('Error cleaning up file:', e);
        }
      });
      
      try {
        ffmpegInstance.FS('unlink', 'concat_list.txt');
        ffmpegInstance.FS('unlink', 'temp_concat.mp4');
        if (audioFileList.length > 0) {
          ffmpegInstance.FS('unlink', 'temp_with_audio.mp4');
        }
        ffmpegInstance.FS('unlink', outputFilename);
      } catch (e) {
        console.warn('Error cleaning up file:', e);
      }
      
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
