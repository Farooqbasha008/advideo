import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Video, Settings, Info } from 'lucide-react';
import { toast } from 'sonner';
import { TimelineItem } from './VideoEditor';
import { generateVideo, generatePikaVideo } from '@/lib/falai';
import { generatedMediaDB } from '@/lib/db';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Pika v2.2 supports more aspect ratios
type AspectRatioType = '16:9' | '9:16' | '1:1' | '4:5' | '5:4' | '3:2' | '2:3';
type ResolutionType = '720p' | '1080p';
type VideoModelType = 'wan-2.1' | 'pika-v2.2';

interface VideoGeneratorProps {
  onAddToTimeline: (item: TimelineItem) => void;
}

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ onAddToTimeline }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [generating, setGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [falaiApiKey, setFalaiApiKey] = useState<string>('');
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>('16:9');
  const [resolution, setResolution] = useState<ResolutionType>('720p');
  const [videoDuration, setVideoDuration] = useState<number>(5);
  const [videoModel, setVideoModel] = useState<VideoModelType>('pika-v2.2');
  const [generatedVideos, setGeneratedVideos] = useState<Array<{
    id: string;
    name: string;
    src: string;
    thumbnail: string;
    duration: number;
    aspectRatio: AspectRatioType;
    model: VideoModelType;
  }>>([]);

  // Load API key from localStorage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('falai_api_key');
    if (savedApiKey) {
      setFalaiApiKey(savedApiKey);
    } else {
      setShowApiKeyInput(true);
    }

    // Load previously generated videos from IndexedDB
    const loadGeneratedVideos = async () => {
      try {
        const mediaItems = await generatedMediaDB.getAllMedia();
        const videos = mediaItems
          .filter(item => item.type === 'video')
          .map(item => ({
            id: item.id,
            name: item.name,
            src: item.src,
            thumbnail: item.metadata.thumbnail || '',
            duration: item.metadata.duration || 5,
            aspectRatio: (item.metadata.aspectRatio || '16:9') as AspectRatioType,
            model: (item.metadata.model || 'wan-2.1') as VideoModelType
          }));
        setGeneratedVideos(videos);
      } catch (error) {
        console.error('Error loading generated videos:', error);
      }
    };

    loadGeneratedVideos();
  }, []);

  const handleSaveApiKey = () => {
    if (falaiApiKey.trim()) {
      localStorage.setItem('falai_api_key', falaiApiKey);
      setShowApiKeyInput(false);
      toast.success('API key saved successfully');
    } else {
      toast.error('Please enter a valid API key');
    }
  };

  const handleDragStart = (e: React.DragEvent, video: typeof generatedVideos[number]) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      ...video,
      type: 'video',
      color: 'bg-yellow-400/70',
      allowedTrack: 'track1'
    }));
    
    // Create custom drag image
    const dragImage = document.createElement('div');
    dragImage.classList.add('video-item', 'p-2', 'bg-editor-panel', 'rounded', 'shadow-lg', 'text-white', 'border', 'border-white/20');
    dragImage.style.width = '120px';
    dragImage.style.opacity = '0.8';
    dragImage.textContent = video.name;
    document.body.appendChild(dragImage);
    
    e.dataTransfer.setDragImage(dragImage, 60, 30);
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  };

  const handleAddToTimeline = (video: typeof generatedVideos[number]) => {
    const newItem: TimelineItem = {
      id: `timeline-${Date.now()}`,
      trackId: 'track1',
      start: 0,
      duration: video.duration,
      type: 'video',
      name: video.name,
      color: 'bg-yellow-400/70',
      src: video.src,
      thumbnail: video.thumbnail,
      volume: 1.0
    };

    onAddToTimeline(newItem);
    toast.success('Video added to timeline');
  };

  const handleGenerateVideo = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt to generate a video');
      return;
    }

    if (!falaiApiKey) {
      setShowApiKeyInput(true);
      toast.error('Fal.ai API key not found', {
        description: 'Please add your Fal.ai API key to continue.',
      });
      return;
    }

    setGenerating(true);
    setProgress(10);

    try {
      toast.info(`Starting video generation with ${videoModel}`, {
        description: 'This may take a few moments...',
        duration: 5000,
      });

      let videoUrl: string | null = null;

      // Generate video using the selected model
      if (videoModel === 'wan-2.1') {
        videoUrl = await generateVideo(prompt, falaiApiKey, {
          duration: videoDuration,
          negativePrompt: 'close-up faces, blurry, low quality, distorted faces, rapid movements, complex backgrounds, inconsistent lighting',
          aspectRatio: aspectRatio as '16:9' | '9:16' // Original model only supported these two
        });
      } else if (videoModel === 'pika-v2.2') {
        // Using the new Pika v2.2 model
        videoUrl = await generatePikaVideo(prompt, falaiApiKey, {
          duration: videoDuration,
          negative_prompt: 'close-up faces, blurry, low quality, distorted faces, rapid movements, complex backgrounds, inconsistent lighting',
          aspect_ratio: aspectRatio,
          resolution: resolution
        });
      }

      if (!videoUrl) {
        throw new Error('Failed to generate video: No URL returned');
      }

      // Update progress to show completion
      setProgress(100);

      // Generate a unique ID for the video
      const videoId = `generated-${Date.now()}`;
      
      // Create a thumbnail URL (using the first frame of the video)
      const thumbnailUrl = videoUrl.replace('.mp4', '.jpg');

      // Save to IndexedDB
      const savedVideo = await generatedMediaDB.addMedia({
        name: `Generated from: ${prompt.slice(0, 20)}${prompt.length > 20 ? '...' : ''}`,
        type: 'video',
        src: videoUrl,
        dateCreated: new Date(),
        prompt: prompt,
        metadata: {
          thumbnail: thumbnailUrl,
          duration: videoDuration,
          aspectRatio,
          resolution,
          model: videoModel
        }
      });

      // Add to local state for display
      setGeneratedVideos(prev => [{
        id: savedVideo.id,
        name: savedVideo.name,
        src: savedVideo.src,
        thumbnail: savedVideo.metadata.thumbnail || '',
        duration: savedVideo.metadata.duration || 5,
        aspectRatio: savedVideo.metadata.aspectRatio as AspectRatioType,
        model: savedVideo.metadata.model as VideoModelType
      }, ...prev]);
      
      toast.success('Video generation complete', {
        description: 'Video has been added to your library'
      });
      
      setPrompt('');
    } catch (error) {
      console.error('Error generating video:', error);
      toast.error('Failed to generate video', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    } finally {
      setGenerating(false);
      setProgress(0);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {showApiKeyInput ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="falai-api-key">Fal.ai API Key</Label>
            <Input
              id="falai-api-key"
              type="password"
              value={falaiApiKey}
              onChange={(e) => setFalaiApiKey(e.target.value)}
              placeholder="Enter your Fal.ai API key"
              className="bg-[#151514] border-white/20 focus:border-[#D7F266]"
            />
            <p className="text-xs text-white/60">
              Get your API key from{' '}
              <a
                href="https://fal.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#D7F266] hover:underline"
              >
                fal.ai
              </a>
            </p>
          </div>
          <Button
            onClick={handleSaveApiKey}
            disabled={!falaiApiKey.trim()}
            className="w-full bg-[#D7F266] text-[#151514] hover:bg-[#D7F266]/80"
          >
            Save API Key
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="prompt">Describe the video you want to generate</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A serene lake surrounded by mountains at sunset..."
              className="h-24 bg-[#151514] border-white/20 focus:border-[#D7F266]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="model">Video Model</Label>
              <Select
                value={videoModel}
                onValueChange={(value: VideoModelType) => setVideoModel(value)}
              >
                <SelectTrigger className="bg-[#151514] border-white/20 focus:border-[#D7F266]">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wan-2.1">Wan 2.1 (Fast)</SelectItem>
                  <SelectItem value="pika-v2.2">Pika v2.2 (High Quality)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
              <Select
                value={aspectRatio}
                onValueChange={(value: AspectRatioType) => setAspectRatio(value)}
              >
                <SelectTrigger className="bg-[#151514] border-white/20 focus:border-[#D7F266]">
                  <SelectValue placeholder="Select aspect ratio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                  <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                  {videoModel === 'pika-v2.2' && (
                    <>
                      <SelectItem value="1:1">1:1 (Square)</SelectItem>
                      <SelectItem value="4:5">4:5</SelectItem>
                      <SelectItem value="5:4">5:4</SelectItem>
                      <SelectItem value="3:2">3:2</SelectItem>
                      <SelectItem value="2:3">2:3</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {videoModel === 'pika-v2.2' && (
              <div className="space-y-2">
                <Label htmlFor="resolution">Resolution</Label>
                <Select
                  value={resolution}
                  onValueChange={(value: ResolutionType) => setResolution(value)}
                >
                  <SelectTrigger className="bg-[#151514] border-white/20 focus:border-[#D7F266]">
                    <SelectValue placeholder="Select resolution" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="720p">720p</SelectItem>
                    <SelectItem value="1080p">1080p</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (seconds)</Label>
              <Select
                value={videoDuration.toString()}
                onValueChange={(value) => setVideoDuration(parseInt(value))}
              >
                <SelectTrigger className="bg-[#151514] border-white/20 focus:border-[#D7F266]">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 seconds</SelectItem>
                  <SelectItem value="5">5 seconds</SelectItem>
                  <SelectItem value="8">8 seconds</SelectItem>
                  <SelectItem value="10">10 seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {generating && (
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-[#D7F266] h-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          
          <div className="flex space-x-2">
            <Button 
              onClick={handleGenerateVideo} 
              className="flex-1 bg-[#D7F266] text-[#151514] hover:bg-[#D7F266]/80"
              disabled={generating || !prompt.trim()}
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Video className="mr-2 h-4 w-4" />
                  Generate Video
                </>
              )}
            </Button>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="bg-transparent border-white/20">
                    <Info className="h-4 w-4 text-white/70" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px]">
                  <p className="text-xs">
                    <strong>Pika v2.2</strong> is a high-quality model with more options and better results.
                    <br /><br />
                    <strong>Wan 2.1</strong> is faster but with more limited options.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Generated Videos List */}
          {generatedVideos.length > 0 && (
            <div className="mt-4 space-y-2">
              <Label>Generated Videos</Label>
              <div className="grid grid-cols-2 gap-2">
                {generatedVideos.map((video) => (
                  <div
                    key={video.id}
                    className="relative group bg-[#151514] border border-white/20 rounded p-2 cursor-move hover:border-[#D7F266]/50 transition-colors"
                    draggable
                    onDragStart={(e) => handleDragStart(e, video)}
                    onDoubleClick={() => handleAddToTimeline(video)}
                  >
                    <div className="absolute top-2 right-2 z-10 bg-black/60 text-[10px] text-white/80 px-1 py-0.5 rounded">
                      {video.model === 'pika-v2.2' ? 'Pika' : 'Wan'}
                    </div>
                    <div className="aspect-video bg-black/50 rounded overflow-hidden mb-2">
                      <img
                        src={video.thumbnail}
                        alt={video.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-xs text-white/80 truncate">{video.name}</div>
                    <div className="text-[10px] text-white/60">
                      {video.duration}s • {video.aspectRatio}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="text-xs text-white/60">
              Powered by fal.ai - Generate high-quality videos from text descriptions
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowApiKeyInput(true)}
              className="text-white/60 hover:text-white"
            >
              <Settings className="h-4 w-4 mr-1" />
              API Key
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default VideoGenerator;
