
import React, { useState, useEffect } from 'react';
import { Video, Music, Trash2 } from 'lucide-react';
import { TimelineItem } from './VideoEditor';
import { generatedMediaDB } from '@/lib/db';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface GeneratedMediaManagerProps {
  onAddToTimeline: (item: TimelineItem) => void;
}

const GeneratedMediaManager: React.FC<GeneratedMediaManagerProps> = ({ onAddToTimeline }) => {
  const [generatedMedia, setGeneratedMedia] = useState<any[]>([]);

  useEffect(() => {
    // Load generated media from IndexedDB
    const loadGeneratedMedia = async () => {
      try {
        const media = await generatedMediaDB.getAllMedia();
        setGeneratedMedia(media);
      } catch (error) {
        console.error('Error loading generated media:', error);
      }
    };

    loadGeneratedMedia();
  }, []);

  const handleDragStart = (e: React.DragEvent, item: any) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      ...item,
      type: item.type,
      color: item.type === 'video' ? 'bg-yellow-400/70' : 'bg-blue-400/70',
      allowedTrack: item.type === 'video' ? 'track1' : 'track2',
      duration: item.metadata?.duration || 5
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

  const handleDelete = async (id: string) => {
    try {
      await generatedMediaDB.deleteMedia(id);
      setGeneratedMedia(prev => prev.filter(item => item.id !== id));
      toast.success('Media deleted successfully');
    } catch (error) {
      console.error('Error deleting media:', error);
      toast.error('Failed to delete media');
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {generatedMedia.map((item) => (
          <div
            key={item.id}
            className="relative group bg-[#151514] border border-white/20 rounded p-2 cursor-move hover:border-[#D7F266]/50 transition-colors"
            draggable
            onDragStart={(e) => handleDragStart(e, item)}
          >
            <div className="aspect-video bg-black/50 rounded overflow-hidden mb-2">
              {item.type === 'video' ? (
                <img
                  src={item.metadata?.thumbnail || ''}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music size={24} className="text-white/40" />
                </div>
              )}
            </div>
            <div className="text-xs text-white/80 truncate">{item.name}</div>
            <div className="text-[10px] text-white/60">
              {item.type} • {item.metadata?.duration || 0}s
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleDelete(item.id)}
            >
              <Trash2 size={14} className="text-white/60 hover:text-white" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Adding the default export statement that was missing
export default GeneratedMediaManager;
