import React from 'react';
import { Film, Music, Mic } from 'lucide-react';
import MediaLibrary from './MediaLibrary';
import { TimelineItem } from './VideoEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AudioExtractor from './AudioExtractor';
import VoiceoverGenerator from './VoiceoverGenerator';
import SoundEffectsGenerator from './SoundEffectsGenerator';
import VideoGenerator from './VideoGenerator';

interface MediaSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onAddToTimeline: (item: TimelineItem) => void;
  selectedVideo: TimelineItem | null;
}

const MediaSidebar: React.FC<MediaSidebarProps> = ({
  activeTab,
  setActiveTab,
  onAddToTimeline,
  selectedVideo
}) => {
  return (
    <div className="flex flex-col h-full bg-[#151514]">
      {/* Media Type Icons - Remove generate button */}
      <div className="flex p-1 space-x-1 border-b border-white/10">
        <button 
          className={`p-2 rounded-full flex items-center justify-center ${activeTab === 'visuals' ? 'bg-[#D7F266] text-[#151514]' : 'bg-white/10 text-white'}`}
          onClick={() => setActiveTab('visuals')}
        >
          <Film size={16} />
        </button>
        <button 
          className={`p-2 rounded-full flex items-center justify-center ${activeTab === 'audio' ? 'bg-[#D7F266] text-[#151514]' : 'bg-white/10 text-white'}`}
          onClick={() => setActiveTab('audio')}
        >
          <Music size={16} />
        </button>
        <button 
          className={`p-2 rounded-full flex items-center justify-center ${activeTab === 'voiceover' ? 'bg-[#D7F266] text-[#151514]' : 'bg-white/10 text-white'}`}
          onClick={() => setActiveTab('voiceover')}
        >
          <Mic size={16} />
        </button>
      </div>
      
      {/* Media Library - Update visuals tab to include video generation */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'visuals' && (
          <Tabs defaultValue="library" className="w-full h-full">
            <TabsList className="w-full grid grid-cols-2 bg-editor-panel/50 p-1 h-8">
              <TabsTrigger value="library" className="text-xs h-6">Video Library</TabsTrigger>
              <TabsTrigger value="generate" className="text-xs h-6">Generate Video</TabsTrigger>
            </TabsList>
            <TabsContent value="library" className="h-[calc(100%-2rem)] overflow-y-auto">
              <MediaLibrary onAddToTimeline={onAddToTimeline} mediaType="video" />
            </TabsContent>
            <TabsContent value="generate" className="h-[calc(100%-2rem)] overflow-y-auto">
              <VideoGenerator onAddToTimeline={onAddToTimeline} />
            </TabsContent>
          </Tabs>
        )}
        
        {activeTab === 'audio' && (
          <Tabs defaultValue="library" className="w-full h-full">
            <TabsList className="w-full grid grid-cols-2 bg-editor-panel/50 p-1 h-8">
              <TabsTrigger value="library" className="text-xs h-6">Audio Library</TabsTrigger>
              <TabsTrigger value="effects" className="text-xs h-6">Sound Effects</TabsTrigger>
            </TabsList>
            <TabsContent value="library" className="h-[calc(100%-2rem)] overflow-y-auto">
              <div className="flex flex-col h-full">
                <MediaLibrary onAddToTimeline={onAddToTimeline} mediaType="audio" />
                <AudioExtractor videoItem={selectedVideo} onAddExtractedAudio={onAddToTimeline} />
              </div>
            </TabsContent>
            <TabsContent value="effects" className="h-[calc(100%-2rem)] overflow-y-auto">
              <SoundEffectsGenerator onAddToTimeline={onAddToTimeline} />
            </TabsContent>
          </Tabs>
        )}
        
        {activeTab === 'voiceover' && (
          <VoiceoverGenerator onAddToTimeline={onAddToTimeline} />
        )}
      </div>
    </div>
  );
};

export default MediaSidebar;