
import React, { useState } from 'react';
import { Upload, Film, Music, Image as ImageIcon, Mic, Video, Search, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TimelineItem } from './VideoEditor';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
// Fixed import - not using the named import as the component is exported as default
import GeneratedMediaManager from './GeneratedMediaManager';
import { Button } from '@/components/ui/button';

// Mock data for media items
const MEDIA_ITEMS = [
  // Video samples
  { 
    id: '1', 
    type: 'video', 
    name: 'Cars drifting', 
    duration: '00:15', 
    thumbnail: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&auto=format&fit=crop',
    src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
  },
  { 
    id: '2', 
    type: 'video', 
    name: 'Turbocharging', 
    duration: '00:08', 
    thumbnail: 'https://images.unsplash.com/photo-1563358955-21ed330539a9?w=800&auto=format&fit=crop',
    src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
  },
  { 
    id: '3', 
    type: 'video', 
    name: 'Car accelerating', 
    duration: '00:10', 
    thumbnail: 'https://images.unsplash.com/photo-1518563222397-1fc005b5a0e0?w=800&auto=format&fit=crop',
    src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
  },
  { 
    id: '4', 
    type: 'video', 
    name: 'Waterfall Scene', 
    duration: '00:12', 
    thumbnail: 'https://images.unsplash.com/photo-1518982700659-8e75be7141b8?w=800&auto=format&fit=crop',
    src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
  },
  { 
    id: '5', 
    type: 'video', 
    name: 'Mountain Drive', 
    duration: '00:20', 
    thumbnail: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop',
    src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4'
  },
  // Additional video samples
  { 
    id: '11', 
    type: 'video', 
    name: 'City Lights', 
    duration: '00:18', 
    thumbnail: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&auto=format&fit=crop',
    src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4'
  },
  { 
    id: '12', 
    type: 'video', 
    name: 'Night Race', 
    duration: '00:22', 
    thumbnail: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&auto=format&fit=crop',
    src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4'
  },
  // Audio samples
  { 
    id: '6', 
    type: 'audio', 
    name: 'Engine sound', 
    duration: '00:13', 
    thumbnail: '',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  { 
    id: '7', 
    type: 'audio', 
    name: 'Crowd cheer', 
    duration: '00:07', 
    thumbnail: '',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  },
  { 
    id: '8', 
    type: 'audio', 
    name: 'Background music', 
    duration: '00:15', 
    thumbnail: '',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  },
  { 
    id: '9', 
    type: 'audio', 
    name: 'Electronic beat', 
    duration: '00:08', 
    thumbnail: '',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
  },
  { 
    id: '10', 
    type: 'audio', 
    name: 'Voiceover sample', 
    duration: '00:05', 
    thumbnail: '',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'
  },
  // Additional audio samples
  { 
    id: '13', 
    type: 'audio', 
    name: 'Turbocharging sound', 
    duration: '00:09', 
    thumbnail: '',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3'
  },
  { 
    id: '14', 
    type: 'audio', 
    name: 'Car drifting', 
    duration: '00:11', 
    thumbnail: '',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3'
  },
  { 
    id: '15', 
    type: 'audio', 
    name: 'Cinematic impact', 
    duration: '00:04', 
    thumbnail: '',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'
  },
];

interface MediaItemProps {
  item: typeof MEDIA_ITEMS[number];
  onDragStart: (e: React.DragEvent, item: typeof MEDIA_ITEMS[number]) => void;
  onDoubleClick: (item: typeof MEDIA_ITEMS[number]) => void;
}

interface MediaLibraryProps {
  onAddToTimeline: (item: TimelineItem) => void;
  mediaType?: 'all' | 'video' | 'audio' | 'image';
}

const MediaItem: React.FC<MediaItemProps> = ({ item, onDragStart, onDoubleClick }) => {
  return (
    <div 
      className="video-item group cursor-pointer mb-2"
      draggable
      onDragStart={(e) => onDragStart(e, item)}
      onDoubleClick={() => onDoubleClick(item)}
    >
      {item.type === 'video' ? (
        <div className="relative">
          <img src={item.thumbnail} alt={item.name} className="w-full h-24 object-cover" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 transition-opacity">
            <Video size={24} className="text-white" />
          </div>
          <div className="absolute bottom-0 right-0 bg-black/70 text-white/90 text-[10px] px-1 py-0.5 rounded-tl">
            {item.duration}
          </div>
        </div>
      ) : (
        <div className="h-16 bg-editor-panel flex items-center justify-center relative">
          <Music size={24} className="text-white/60 group-hover:text-white/80 transition-colors" />
          <div className="absolute bottom-0 right-0 bg-black/70 text-white/90 text-[10px] px-1 py-0.5 rounded-tl">
            {item.duration}
          </div>
        </div>
      )}
      <div className="p-2 text-xs text-white/90 truncate bg-editor-panel group-hover:bg-editor-hover transition-colors">
        {item.name}
      </div>
    </div>
  );
};

const MediaLibrary: React.FC<MediaLibraryProps> = ({ onAddToTimeline, mediaType = 'all' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'library' | 'generated'>('library');
  
  const handleDragStart = (e: React.DragEvent, item: typeof MEDIA_ITEMS[number]) => {
    // Parse duration string "MM:SS" to seconds
    let durationInSeconds = 5; // Default duration
    if (item.duration) {
      const parts = item.duration.split(':');
      if (parts.length === 2) {
        const minutes = parseInt(parts[0]);
        const seconds = parseInt(parts[1]);
        durationInSeconds = (minutes * 60) + seconds;
      }
    }
    
    e.dataTransfer.setData('application/json', JSON.stringify({
      ...item,
      duration: durationInSeconds, // Set numeric duration in seconds
      type: item.type,
      color: item.type === 'video' ? 'bg-yellow-400/70' : 'bg-blue-400/70',
      allowedTrack: item.type === 'video' ? 'track1' : 'track2'
    }));
    
    // Create custom drag image
    const dragImage = document.createElement('div');
    dragImage.classList.add('media-item', 'p-2', 'bg-editor-panel', 'rounded', 'shadow-lg', 'text-white', 'border', 'border-white/20');
    dragImage.style.width = '120px';
    dragImage.style.opacity = '0.8';
    dragImage.textContent = item.name;
    document.body.appendChild(dragImage);
    
    e.dataTransfer.setDragImage(dragImage, 60, 30);
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  };

  const handleDoubleClick = (item: typeof MEDIA_ITEMS[number]) => {
    // Parse duration string "MM:SS" to seconds
    let durationInSeconds = 5; // Default duration
    if (item.duration) {
      const parts = item.duration.split(':');
      if (parts.length === 2) {
        const minutes = parseInt(parts[0]);
        const seconds = parseInt(parts[1]);
        durationInSeconds = (minutes * 60) + seconds;
      }
    }
    
    // Determine which track to add to based on media type
    let trackId = 'track1'; // Default to first video track
    let color = 'bg-yellow-400/70';
    
    if (item.type === 'audio') {
      trackId = 'track3'; // Default to first audio track
      color = 'bg-blue-400/70';
    }
    
    // Get all existing timeline items from the DOM event listener
    const customEvent = new CustomEvent('get-timeline-items', { 
      detail: { callback: (existingItems: TimelineItem[]) => {
        // Find the last item in this track to position new item right after it
        const itemsInTrack = existingItems.filter(item => item.trackId === trackId);
        let startTime = 0;
        
        if (itemsInTrack.length > 0) {
          const lastItemInTrack = itemsInTrack.reduce((latest, item) => {
            return (item.start + item.duration > latest.start + latest.duration) ? item : latest;
          }, itemsInTrack[0]);
          
          // Position new item immediately after the last item
          startTime = lastItemInTrack.start + lastItemInTrack.duration;
        }
        
        const newItem: TimelineItem = {
          id: `timeline-${Date.now()}`,
          trackId,
          start: startTime,
          duration: durationInSeconds,
          type: item.type as 'video' | 'audio',
          name: item.name,
          color,
          src: item.src,
          thumbnail: item.thumbnail,
          volume: 1.0 // Default volume
        };
        
        onAddToTimeline(newItem);
      }}
    });
    document.dispatchEvent(customEvent);
  };

  const filteredItems = MEDIA_ITEMS.filter(item => {
    // Apply media type filter
    if (mediaType !== 'all' && item.type !== mediaType) {
      return false;
    }
    
    // Apply search filter if there's a search term
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Group items by type
  const videoItems = filteredItems.filter(item => item.type === 'video');
  const audioItems = filteredItems.filter(item => item.type === 'audio');
  
  return (
    <div className="flex flex-col h-full bg-[#151514] border-r border-white/10">
      <div className="p-3 border-b border-white/10">
        <div className="flex items-center space-x-2 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white/40" size={16} />
            <input
              type="text"
              placeholder="Search media..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-white/5 text-white rounded-md focus:outline-none focus:ring-1 focus:ring-[#D7F266]"
            />
          </div>
        </div>
        
        <div className="flex space-x-1">
          <Button
            variant={activeTab === 'library' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('library')}
            className={cn(
              "flex-1 text-xs",
              activeTab === 'library' ? "bg-[#D7F266] text-[#151514]" : "text-white/60 hover:text-white"
            )}
          >
            <Film className="h-4 w-4 mr-1" />
            Library
          </Button>
          <Button
            variant={activeTab === 'generated' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('generated')}
            className={cn(
              "flex-1 text-xs",
              activeTab === 'generated' ? "bg-[#D7F266] text-[#151514]" : "text-white/60 hover:text-white"
            )}
          >
            <Sparkles className="h-4 w-4 mr-1" />
            Generated
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        {activeTab === 'library' ? (
          <div className="p-3">
            <div className="grid grid-cols-2 gap-2">
              {filteredItems.map(item => (
                <MediaItem
                  key={item.id}
                  item={item}
                  onDragStart={handleDragStart}
                  onDoubleClick={handleDoubleClick}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="p-3">
            <GeneratedMediaManager onAddToTimeline={onAddToTimeline} />
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default MediaLibrary;
