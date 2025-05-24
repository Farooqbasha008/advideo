import React, { useState } from 'react';
import { Music, Play, Pause, Download, Save, Plus, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { TimelineItem } from './VideoEditor';
import { generateSound } from '@/lib/elevenlabs';
import { generatedMediaDB } from '@/services/GeneratedMediaDB';

interface SoundEffectsGeneratorProps {
  onAddToTimeline: (item: TimelineItem) => void;
}

// Track constants for better organization
const TRACK_IDS = {
  VIDEO: 'video-track',
  MUSIC: 'music-track',
  VOICEOVER: 'voiceover-track',
  SOUND_EFFECTS: 'sfx-track'
} as const;

const SOUND_TYPES = [
  { id: 'cinematic', name: 'Cinematic', example: 'Dramatic orchestral hit with deep brass and rising tension' },
  { id: 'effect', name: 'Sound Effect', example: 'Metallic impact with reverb tail' },
  { id: 'transition', name: 'Transition', example: 'Smooth whoosh with tonal elements' },
  { id: 'impact', name: 'Impact', example: 'Deep bass drop with distortion' },
  { id: 'ambient', name: 'Ambient', example: 'Atmospheric pad with gentle movement' },
];

const SoundEffectsGenerator: React.FC<SoundEffectsGeneratorProps> = ({ onAddToTimeline }) => {
  const [description, setDescription] = useState('');
  const [soundType, setSoundType] = useState('effect');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    const savedApiKey = localStorage.getItem('elevenlabs_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast.error('Please enter a description for the sound effect');
      return;
    }

    if (!apiKey) {
      toast.error('ElevenLabs API key is required', {
        description: 'Please enter your ElevenLabs API key in the settings',
      });
      return;
    }

    setIsGenerating(true);
    toast.info('Generating sound effect...', {
      description: 'This might take a few moments'
    });

    try {
      console.log('Sending request to ElevenLabs with prompt:', description);
      
      const audioUrl = await generateSound(
        description,
        apiKey,
        { type: 'sfx', duration: 5 }
      );
      
      console.log('Received audio URL:', audioUrl);
      
      // Try preloading the audio
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        await audioRef.current.load();
      }
      
      setGeneratedAudio(audioUrl);
      
      // Save to IndexedDB
      await generatedMediaDB.addSoundEffect({
        name: `${soundType === 'ambient' ? 'Music' : 'SFX'}: ${description.substring(0, 15)}${description.length > 15 ? '...' : ''}`,
        type: 'sfx',
        src: audioUrl,
        dateCreated: new Date(),
        prompt: description,
        metadata: {
          soundType,
          duration: 5
        }
      });
      
      toast.success('Sound effect generated and saved successfully!');
    } catch (error) {
      console.error('Error generating sound effect:', error);
      toast.error('Failed to generate sound effect', {
        description: error instanceof Error ? error.message : 'An error occurred while generating the sound effect.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current || !generatedAudio) {
      console.error('Audio element or URL is missing:', {
        audioRef: !!audioRef.current,
        generatedAudio: !!generatedAudio
      });
      return;
    }
    
    console.log('Current audio source:', audioRef.current.src);
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Force reload of audio source
      audioRef.current.src = generatedAudio;
      audioRef.current.load();
      
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Audio playing successfully');
            setIsPlaying(true);
          })
          .catch(err => {
            console.error('Failed to play audio:', err);
            toast.error('Failed to play audio', {
              description: 'Browser prevented audio playback. Try clicking the Play button again.'
            });
          });
      }
    }
  };

  const handleAddToTimeline = () => {
    if (!generatedAudio) return;

    const newAudioItem: TimelineItem = {
      id: `sfx-${Date.now()}`,
      // Use sound effects track for sfx and ambient sounds, music track for musical elements
      trackId: soundType === 'ambient' ? TRACK_IDS.MUSIC : TRACK_IDS.SOUND_EFFECTS,
      start: 0,
      duration: 3,
      type: 'audio',
      name: `${soundType === 'ambient' ? 'Music' : 'SFX'}: ${description.substring(0, 15)}${description.length > 15 ? '...' : ''}`,
      color: soundType === 'ambient' ? 'bg-blue-400/70' : 'bg-yellow-400/70',
      src: generatedAudio,
      volume: 1,
    };

    onAddToTimeline(newAudioItem);
    toast.success(`${soundType === 'ambient' ? 'Music' : 'Sound effect'} added to timeline`, {
      description: `Added to ${soundType === 'ambient' ? 'Music' : 'Sound Effects'} Track`
    });
  };

  const downloadAudio = () => {
    if (!generatedAudio) return;

    const a = document.createElement('a');
    a.href = generatedAudio;
    a.download = `sound_effect_${Date.now()}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast.success('Sound effect download started');
  };

  const saveApiKey = (key: string) => {
    if (key.trim()) {
      localStorage.setItem('elevenlabs_api_key', key);
      setApiKey(key);
      toast.success('API key saved');
    }
  };

  return (
    <div className="space-y-3 p-3">
      <div className="space-y-2">
        <Label htmlFor="sound-description" className="text-xs text-[#EEEEEE]">Sound Description</Label>
        <Select value={soundType} onValueChange={(type) => {
          setSoundType(type);
          const selectedType = SOUND_TYPES.find(t => t.id === type);
          if (selectedType) {
            setDescription(selectedType.example);
          }
        }}>
          <SelectTrigger id="sound-type" className="bg-transparent border-white/20 text-white focus:ring-[#C9FF00]">
            <SelectValue placeholder="Select a sound type" />
          </SelectTrigger>
          <SelectContent className="bg-[#000000] border-white/20 text-white">
            {SOUND_TYPES.map((type) => (
              <SelectItem key={type.id} value={type.id} className="focus:bg-[#C9FF00]/20 focus:text-white">
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Textarea
          id="sound-description"
          placeholder="Describe the sound effect you want to generate..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="h-24 text-xs bg-transparent border-white/20 resize-none focus-visible:ring-[#C9FF00]"
        />
      </div>

      {!apiKey && (
        <div className="space-y-2">
          <Label htmlFor="api-key" className="text-xs text-[#EEEEEE]">ElevenLabs API Key</Label>
          <div className="flex space-x-2">
            <input
              id="api-key"
              type="password"
              placeholder="Enter your ElevenLabs API key"
              className="flex-1 h-9 px-3 py-2 text-xs rounded-md bg-transparent border border-white/20 text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#C9FF00]"
              onChange={(e) => setApiKey(e.target.value)}
            />
            <Button 
              onClick={() => saveApiKey(apiKey)}
              className="bg-[#C9FF00] hover:bg-[#C9FF00]/90 text-[#000000] h-9 px-3 py-2 text-xs"
            >
              Save
            </Button>
          </div>
          <p className="text-xs text-[#EEEEEE]/60">
            Your API key is stored locally and never sent to our servers.
          </p>
        </div>
      )}

      <Button
        onClick={handleGenerate}
        disabled={isGenerating || !description.trim()}
        className="w-full bg-[#C9FF00] hover:bg-[#C9FF00]/90 text-[#000000] rounded-full transition-all duration-300 text-sm h-8"
      >
        {isGenerating ? (
          <span className="animate-pulse">Generating...</span>
        ) : (
          <>
            <Music className="h-4 w-4 mr-2" />
            Generate Sound
          </>
        )}
      </Button>

      {generatedAudio && (
        <div className="mt-3 space-y-2">
          <div 
            className="flex items-center gap-2 bg-editor-panel/50 p-2 rounded cursor-move group relative"
            draggable
            onDragStart={(e) => {
              const item = {
                id: `sfx-${Date.now()}`,
                type: 'audio',
                name: `SFX: ${description.substring(0, 15)}${description.length > 15 ? '...' : ''}`,
                src: generatedAudio,
                duration: '5:00'
              };
              
              e.dataTransfer.setData('application/json', JSON.stringify(item));
              
              // Create custom drag image
              const dragImage = document.createElement('div');
              dragImage.classList.add('p-2', 'bg-editor-panel', 'rounded', 'shadow-lg', 'text-white', 'border', 'border-white/20');
              dragImage.style.width = '120px';
              dragImage.style.opacity = '0.8';
              dragImage.textContent = item.name;
              document.body.appendChild(dragImage);
              
              e.dataTransfer.setDragImage(dragImage, 60, 30);
              
              // Clean up
              setTimeout(() => {
                document.body.removeChild(dragImage);
              }, 0);
            }}
          >
            <button
              className="p-1 bg-editor-hover rounded-full flex-shrink-0"
              onClick={handlePlayPause}
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            </button>
            <div className="text-xs text-[#EEEEEE]/90 truncate flex-1">
              {description.substring(0, 20)}{description.length > 20 ? '...' : ''}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-[0.6rem] flex items-center gap-1 bg-editor-panel border-white/20 hover:bg-editor-hover"
              onClick={downloadAudio}
            >
              <Download size={12} />
            </Button>

            <GripVertical className="w-4 h-4 text-white/40 group-hover:text-white/90 transition-colors ml-1" />
            
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] text-white/70 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Drag to timeline
            </div>
          </div>

          <Button
            size="sm"
            onClick={handleAddToTimeline}
            className="w-full h-8 text-xs bg-editor-panel border border-white/20 hover:bg-editor-hover text-[#EEEEEE]"
            variant="outline"
          >
            <Plus size={14} className="mr-1" /> Add to Timeline
          </Button>

          <audio ref={audioRef} src={generatedAudio} onEnded={() => setIsPlaying(false)} className="hidden" />
        </div>
      )}
    </div>
  );
};

export default SoundEffectsGenerator;