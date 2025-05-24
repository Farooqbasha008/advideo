import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Scissors, Plus, Trash2, ZoomIn, ZoomOut, Clock, Undo, Redo, ChevronLeft, ChevronRight, ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TimelineItem } from './VideoEditor';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TimelineProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  items: TimelineItem[];
  onRemoveItem: (id: string) => void;
  onUpdateItem?: (item: TimelineItem) => void;
  scale?: number; // Pixels per second
  onSelectItem?: (item: TimelineItem | null) => void;
  selectedItem?: TimelineItem | null;
}

const INITIAL_SCALE = 80; // pixels per second

const Timeline = ({
  currentTime,
  duration,
  isPlaying,
  onPlayPause,
  onSeek,
  items,
  onRemoveItem,
  onUpdateItem,
  scale = INITIAL_SCALE,
  onSelectItem,
  selectedItem
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null); // Reference for the scrollable container
  const [tracks] = useState(['Video', 'Audio 1', 'Audio 2', 'Voiceover']);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartPos, setDragStartPos] = useState({ start: 0, trackId: '' });
  const [draggedItem, setDraggedItem] = useState<TimelineItem | null>(null);
  const [showVolumeControl, setShowVolumeControl] = useState<string | null>(null);
  const [showTrimControl, setShowTrimControl] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<'start' | 'end' | null>(null);
  const [resizeItem, setResizeItem] = useState<TimelineItem | null>(null);
  const [resizeStartPos, setResizeStartPos] = useState(0);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showPositionTooltip, setShowPositionTooltip] = useState(false);
  
  // Calculate timeline width based on duration
  const timelineWidth = Math.max(duration * scale, 1000);
  
  // Generate time markers
  const timeMarkers = [];
  const markerInterval = scale <= 40 ? 5 : scale <= 80 ? 2 : 1; // Seconds
  const markerCount = Math.ceil(duration / markerInterval);
  
  for (let i = 0; i <= markerCount; i++) {
    const time = i * markerInterval;
    timeMarkers.push(time);
  }
  
  // Handle scrolling synchronization
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleScroll = (e: Event) => {
      const scrollLeft = (e.target as HTMLElement).scrollLeft;
      
      // Find all scrollable elements and sync their scroll position
      const scrollables = document.querySelectorAll('.timeline-scroll-sync');
      scrollables.forEach(scrollable => {
        if (scrollable !== e.target) {
          (scrollable as HTMLElement).scrollLeft = scrollLeft;
        }
      });
    };
    
    // Add scroll event listener to all scrollable elements
    const scrollables = document.querySelectorAll('.timeline-scroll-sync');
    scrollables.forEach(scrollable => {
      scrollable.addEventListener('scroll', handleScroll);
    });
    
    return () => {
      const scrollables = document.querySelectorAll('.timeline-scroll-sync');
      scrollables.forEach(scrollable => {
        scrollable.removeEventListener('scroll', handleScroll);
      });
    };
  }, []);
  
  // Handle timeline click for seeking
  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const clickedTime = (offsetX / scale);
    
    onSeek(Math.max(0, Math.min(clickedTime, duration)));
  };
  
  // Handle item click for selection
  const handleItemClick = (e: React.MouseEvent, item: TimelineItem) => {
    e.stopPropagation();
    if (onSelectItem) {
      onSelectItem(item);
    }
  };
  
  // Handle item drag start
  const handleItemDragStart = (e: React.MouseEvent, item: TimelineItem) => {
    e.preventDefault();
    // Don't start drag if we're resizing
    if (isResizing) return;
    
    setIsDragging(true);
    setDraggedItem(item);
    setDragStartX(e.clientX);
    setDragStartY(e.clientY);
    setDragStartPos({ start: item.start, trackId: item.trackId });
    
    if (onSelectItem) {
      onSelectItem(item);
    }
    
    document.addEventListener('mousemove', handleItemDragMove);
    document.addEventListener('mouseup', handleItemDragEnd);
  };
  
  // Handle item drag move
  const handleItemDragMove = (e: MouseEvent) => {
    if (!isDragging || !draggedItem || !timelineRef.current) return;
    
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    
    // Calculate new start time based on mouse movement
    const deltaTime = dx / scale;
    let newStart = Math.max(0, dragStartPos.start + deltaTime);
    
    // Calculate new track based on vertical movement
    const trackHeight = 40; // Height of each track in pixels
    const trackOffset = Math.round(dy / trackHeight);
    const tracksCount = tracks.length;
    const trackIndex = Math.max(0, Math.min(tracksCount - 1, parseInt(dragStartPos.trackId.replace('track', '')) - 1 + trackOffset));
    const newTrackId = `track${trackIndex + 1}`;
    
    // Get all items in the target track except the one being dragged
    const itemsInTargetTrack = items
      .filter(item => item.id !== draggedItem.id && item.trackId === newTrackId)
      .sort((a, b) => a.start - b.start);
    
    let validPosition = true;
    
    if (itemsInTargetTrack.length > 0) {
      // Check if new position would overlap with any existing item
      for (const item of itemsInTargetTrack) {
        if (newStart < (item.start + item.duration) && 
            (newStart + draggedItem.duration) > item.start) {
          validPosition = false;
          
          // Try to find a valid position
          // Option 1: Before the current item if there's space
          if (newStart <= item.start && item.start >= draggedItem.duration) {
            newStart = Math.max(0, item.start - draggedItem.duration);
            validPosition = true;
            break;
          }
          
          // Option 2: After the current item
          const afterItemPos = item.start + item.duration;
          
          // Check if placing after this item would overlap with the next item
          const nextItem = itemsInTargetTrack.find(next => 
            next.id !== item.id && next.start > item.start
          );
          
          if (!nextItem || (afterItemPos + draggedItem.duration <= nextItem.start)) {
            newStart = afterItemPos;
            validPosition = true;
            break;
          }
        }
      }
      
      // If still not valid, try to place at the beginning or end of the track
      if (!validPosition) {
        // Try at the beginning if there's space
        const firstItem = itemsInTargetTrack[0];
        if (firstItem && firstItem.start >= draggedItem.duration) {
          newStart = 0;
          validPosition = true;
        } else {
          // Place after the last item
          const lastItem = itemsInTargetTrack[itemsInTargetTrack.length - 1];
          newStart = lastItem.start + lastItem.duration;
          validPosition = true;
        }
      }
    }
    
    // Only update if we found a valid position
    if (validPosition) {
      // Apply snapping if enabled
      if (snapEnabled) {
        const snapThreshold = 5; // pixels
        const snapPoints = [];
        
        // Add time markers as snap points
        timeMarkers.forEach(time => {
          snapPoints.push(time * scale);
        });
        
        // Add item edges as snap points
        itemsInTargetTrack.forEach(item => {
          snapPoints.push(item.start * scale);
          snapPoints.push((item.start + item.duration) * scale);
        });
        
        // Find closest snap point
        const newStartPos = newStart * scale;
        const closestPoint = snapPoints.find(point => Math.abs(point - newStartPos) < snapThreshold);
        
        if (closestPoint !== undefined) {
          const snappedTime = closestPoint / scale;
          
          // Verify snapped position doesn't cause overlap
          const wouldOverlap = itemsInTargetTrack.some(item => 
            snappedTime < (item.start + item.duration) && 
            (snappedTime + draggedItem.duration) > item.start
          );
          
          if (!wouldOverlap) {
            newStart = snappedTime;
          }
        }
      }
      
      // Update the dragged item position
      const updatedItem = {
        ...draggedItem,
        start: newStart,
        trackId: newTrackId
      };
      
      if (onUpdateItem) {
        onUpdateItem(updatedItem);
      }
    }
  };
  
  // Handle item drag end
  const handleItemDragEnd = () => {
    setIsDragging(false);
    setDraggedItem(null);
    
    document.removeEventListener('mousemove', handleItemDragMove);
    document.removeEventListener('mouseup', handleItemDragEnd);
  };
  
  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent, item: TimelineItem, direction: 'start' | 'end') => {
    e.stopPropagation();
    e.preventDefault();
    
    setIsResizing(true);
    setResizeDirection(direction);
    setResizeItem(item);
    setResizeStartPos(e.clientX);
    
    // Add event listeners for mouse move and mouse up
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };
  
  // Handle resize move
  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing || !resizeItem || !resizeDirection || !timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const timeDelta = (e.clientX - resizeStartPos) / scale;
    
    // Calculate new position and duration
    let newStart = resizeItem.start;
    let newDuration = resizeItem.duration;
    
    // Check for overlapping items in the same track
    const overlappingItems = items.filter(item => 
      item.id !== resizeItem.id && 
      item.trackId === resizeItem.trackId
    );
    
    if (resizeDirection === 'start') {
      // Resizing from the start (left side)
      const proposedStart = Math.max(0, resizeItem.start + timeDelta);
      const proposedDuration = Math.max(0.5, resizeItem.duration - timeDelta);
      
      // Check if new position would overlap with other items
      const wouldOverlap = overlappingItems.some(item => 
        proposedStart < (item.start + item.duration) && 
        (proposedStart + proposedDuration) > item.start
      );
      
      if (!wouldOverlap) {
        newStart = proposedStart;
        newDuration = proposedDuration;
      }
    } else {
      // Resizing from the end (right side)
      const proposedDuration = Math.max(0.5, resizeItem.duration + timeDelta);
      
      // Check if new duration would overlap with other items
      const wouldOverlap = overlappingItems.some(item => 
        (newStart + proposedDuration) > item.start && 
        newStart < (item.start + item.duration)
      );
      
      if (!wouldOverlap) {
        newDuration = proposedDuration;
      }
    }
    
    // Update mouse position for tooltip
    setMousePosition({ x: e.clientX, y: e.clientY });
    setShowPositionTooltip(true);
    
    // Apply snapping if enabled
    if (snapEnabled) {
      const snapThreshold = 5; // pixels
      const snapPoints = [];
      
      // Add time markers as snap points
      timeMarkers.forEach(time => {
        snapPoints.push(time * scale);
      });
      
      // Add other items' edges as snap points
      overlappingItems.forEach(item => {
        snapPoints.push(item.start * scale);
        snapPoints.push((item.start + item.duration) * scale);
      });
      
      // Find closest snap point
      if (resizeDirection === 'start') {
        const startPos = newStart * scale;
        const closestPoint = snapPoints.find(point => Math.abs(point - startPos) < snapThreshold);
        if (closestPoint !== undefined) {
          const snappedTime = closestPoint / scale;
          // Verify snapped position doesn't cause overlap
          const wouldOverlap = overlappingItems.some(item => 
            snappedTime < (item.start + item.duration) && 
            (snappedTime + newDuration) > item.start
          );
          
          if (!wouldOverlap) {
            newDuration = resizeItem.start + resizeItem.duration - snappedTime;
            newStart = snappedTime;
          }
        }
      } else {
        const endPos = (newStart + newDuration) * scale;
        const closestPoint = snapPoints.find(point => Math.abs(point - endPos) < snapThreshold);
        if (closestPoint !== undefined) {
          const proposedDuration = (closestPoint / scale) - newStart;
          // Verify snapped duration doesn't cause overlap
          const wouldOverlap = overlappingItems.some(item => 
            (newStart + proposedDuration) > item.start && 
            newStart < (item.start + item.duration)
          );
          
          if (!wouldOverlap) {
            newDuration = proposedDuration;
          }
        }
      }
    }
    
    // Update the item with new values if they've changed
    if (onUpdateItem && (newStart !== resizeItem.start || newDuration !== resizeItem.duration)) {
      onUpdateItem({
        ...resizeItem,
        start: newStart,
        duration: newDuration
      });
    }
    
    // Update resize start position for next move
    setResizeStartPos(e.clientX);
  };
  
  // Handle resize end
  const handleResizeEnd = () => {
    setIsResizing(false);
    setResizeDirection(null);
    setResizeItem(null);
    setShowPositionTooltip(false);
    
    // Remove event listeners
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
    
    if (resizeItem) {
      toast.success('Clip trimmed', {
        description: `${resizeItem.name} has been adjusted`
      });
    }
  };
  
  // Handle drag over for tracks
  const handleTrackDragOver = (e: React.DragEvent, trackId: string) => {
    e.preventDefault();
    
    // Add a hover effect to the track
    e.currentTarget.classList.add('bg-editor-hover/30');
    
    // Get position information
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const dropTime = Math.max(0, offsetX / scale);
    
    // Update the UI to show where the item will be dropped
    // You could add a position indicator or highlight available gaps here
    // This could be implemented with a state variable and visual element
    
    // For now, just add a custom data attribute with the drop position
    e.currentTarget.setAttribute('data-drop-time', dropTime.toString());
  };
  
  // Handle drag leave for tracks
  const handleTrackDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-editor-hover/30');
  };
  
  // Handle drop on timeline track
  const handleTrackDrop = (e: React.DragEvent, trackId: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-editor-hover/30');
    
    try {
      const itemData = e.dataTransfer.getData('application/json');
      
      if (!itemData) {
        toast.error('Invalid item data');
        return;
      }
      
      const droppedItem = JSON.parse(itemData);
      
      // Check if the item has an allowedTrack restriction
      if (droppedItem.allowedTrack && droppedItem.allowedTrack !== trackId) {
        toast.error('Cannot place item', {
          description: `This item can only be placed in the ${droppedItem.allowedTrack === 'track1' ? 'video' : 'audio'} track`
        });
        return;
      }
      
      // Get track number
      const trackNumber = parseInt(trackId.replace('track', ''));
      
      // Determine track type based on track number
      const isVideoTrack = trackNumber <= 1; // First track is video
      const isAudioTrack = trackNumber >= 2 && trackNumber <= 4; // Tracks 2-4 are audio
      
      // Identify item type from either its type property or other characteristics
      let itemType = droppedItem.type?.toLowerCase();
      
      // If type isn't explicitly set, try to determine it from other properties
      if (!itemType) {
        if (droppedItem.src?.match(/\.(mp4|mov|avi|webm)$/i)) {
          itemType = 'video';
        } else if (droppedItem.src?.match(/\.(mp3|wav|ogg|m4a)$/i)) {
          itemType = 'audio';
        } else if (droppedItem.src?.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          itemType = 'image';
        }
      }
      
      // Validation for track compatibility
      if (isVideoTrack && itemType === 'audio') {
        toast.error('Cannot place audio item on video track', {
          description: 'Please use an audio track instead'
        });
        return;
      }
      
      if (isAudioTrack && itemType === 'video') {
        toast.error('Cannot place video item on audio track', {
          description: 'Please use a video track instead'
        });
        return;
      }
      
      // Calculate item duration - ensure we have a numeric value
      const itemDuration = droppedItem.duration ? 
        (typeof droppedItem.duration === 'string' ? 
          parseInt(droppedItem.duration.split(':')[1]) || 5 : 
          droppedItem.duration) : 
        5;
      
      // Find all items in this track and sort them by start time
      const itemsInTrack = items
        .filter(item => item.trackId === trackId)
        .sort((a, b) => a.start - b.start);
      
      // Determine drop position - at start if track is empty, or after last item
      let dropPosition = 0;
      
      if (itemsInTrack.length > 0) {
        // Find the last item in the track and place after it
        const lastItem = itemsInTrack[itemsInTrack.length - 1];
        dropPosition = lastItem.start + lastItem.duration;
      }
      
      // Create the new timeline item
      const newItem: TimelineItem = {
        id: `timeline-${Date.now()}`,
        trackId,
        start: dropPosition,
        duration: itemDuration,
        type: itemType || 'video',
        name: droppedItem.name,
        color: droppedItem.color || 'bg-yellow-400/70',
        src: droppedItem.src,
        thumbnail: droppedItem.thumbnail,
        volume: 1.0
      };
      
      // Dispatch the event to add the new item to the timeline
      const customEvent = new CustomEvent('add-timeline-item', { 
        detail: newItem
      });
      window.dispatchEvent(customEvent);
      
      toast.success('Item added to timeline', {
        description: `Added ${newItem.name} to the timeline`
      });
    } catch (error) {
      toast.error('Error dropping item', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
      console.error('Error dropping item:', error);
    }
  };
  
  // Handle item delete
  const handleItemDelete = (id: string) => {
    onRemoveItem(id);
    toast.success('Item removed from timeline');
    if (onSelectItem && selectedItem?.id === id) {
      onSelectItem(null);
    }
  };
  
  // Handle volume change for individual audio or video clip
  const handleVolumeChange = (id: string, newVolume: number) => {
    const item = items.find(i => i.id === id);
    if (item && onUpdateItem) {
      onUpdateItem({
        ...item,
        volume: newVolume
      });
      
      toast.success(`${item.type.charAt(0).toUpperCase() + item.type.slice(1)} volume updated`, {
        description: `Volume set to ${Math.round(newVolume * 100)}%`
      });
    }
  };
  
  // Toggle volume control for an item
  const toggleVolumeControl = (id: string) => {
    setShowVolumeControl(prev => prev === id ? null : id);
    // Close trim control if open
    if (showTrimControl === id) {
      setShowTrimControl(null);
    }
  };
  
  // Toggle mute for an item
  const handleToggleMute = (id: string) => {
    const item = items.find(i => i.id === id);
    if (item && onUpdateItem) {
      onUpdateItem({
        ...item,
        muted: !item.muted
      });
      
      toast.success(`${item.muted ? 'Unmuted' : 'Muted'} ${item.type}`, {
        description: item.muted ? 'Audio enabled' : 'Audio disabled'
      });
    }
  };
  
  // Toggle trim control for an item
  const toggleTrimControl = (id: string) => {
    setShowTrimControl(prev => prev === id ? null : id);
    // Close volume control if open
    if (showVolumeControl === id) {
      setShowVolumeControl(null);
    }
  };
  
  // Handle trim adjustment
  const handleTrimChange = (id: string, type: 'start' | 'end', value: number) => {
    const item = items.find(i => i.id === id);
    if (item && onUpdateItem) {
      const updatedItem = { ...item };
      
      if (type === 'start') {
        updatedItem.trimStart = value;
      } else {
        updatedItem.trimEnd = value;
      }
      
      onUpdateItem(updatedItem);
      toast.success(`Trim ${type} adjusted`, {
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} trim set to ${value.toFixed(1)}s`
      });
    }
  };
  
  // Handle keyboard shortcuts for fine-tuning selected item position
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!selectedItem || !onUpdateItem) return;
    
    const nudgeAmount = e.shiftKey ? 1 : 0.1; // 1 second with shift, 0.1 second without
    let newItem = { ...selectedItem };
    let updated = false;
    
    // Get overlapping items in the same track
    const overlappingItems = items.filter(item => 
      item.id !== selectedItem.id && 
      item.trackId === selectedItem.trackId
    );
    
    const checkOverlap = (start: number, duration: number) => {
      return overlappingItems.some(item => 
        start < (item.start + item.duration) && 
        (start + duration) > item.start
      );
    };
    
    switch (e.key) {
      case 'ArrowLeft':
        // Move item left
        const newStartLeft = Math.max(0, newItem.start - nudgeAmount);
        if (!checkOverlap(newStartLeft, newItem.duration)) {
          newItem.start = newStartLeft;
          updated = true;
        }
        break;
      case 'ArrowRight':
        // Move item right
        const newStartRight = newItem.start + nudgeAmount;
        if (!checkOverlap(newStartRight, newItem.duration)) {
          newItem.start = newStartRight;
          updated = true;
        }
        break;
      case '[':
      case '{':
        // Decrease duration from start
        if (newItem.duration > 0.5) {
          const decrease = Math.min(nudgeAmount, newItem.duration - 0.5);
          const newStart = newItem.start + decrease;
          const newDuration = newItem.duration - decrease;
          if (!checkOverlap(newStart, newDuration)) {
            newItem.start = newStart;
            newItem.duration = newDuration;
            updated = true;
          }
        }
        break;
      case ']':
      case '}':
        // Increase duration from start
        const newStartExpand = Math.max(0, newItem.start - nudgeAmount);
        const newDurationExpand = newItem.duration + nudgeAmount;
        if (!checkOverlap(newStartExpand, newDurationExpand)) {
          newItem.start = newStartExpand;
          newItem.duration = newDurationExpand;
          updated = true;
        }
        break;
      case '-':
      case '_':
        // Decrease duration from end
        if (newItem.duration > 0.5) {
          newItem.duration = Math.max(0.5, newItem.duration - nudgeAmount);
          updated = true;
        }
        break;
      case '=':
      case '+':
        // Increase duration from end
        newItem.duration = newItem.duration + nudgeAmount;
        updated = true;
        break;
    }
    
    if (updated) {
      e.preventDefault();
      onUpdateItem(newItem);
      toast.info(`Item ${e.shiftKey ? 'moved/resized by 1s' : 'fine-tuned by 0.1s'}`);
    }
  }, [selectedItem, onUpdateItem, items]);
  
  // Add keyboard event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  // Update playhead position when currentTime changes
  useEffect(() => {
    if (playheadRef.current) {
      playheadRef.current.style.transform = `translateX(${currentTime * scale}px)`;
    }
  }, [currentTime, scale]);
  
  // Listen for timeline-item-add events
  useEffect(() => {
    const handleTimelineItemAdd = (e: CustomEvent<TimelineItem>) => {
      const customEvent = new CustomEvent('add-timeline-item', { 
        detail: e.detail
      });
      window.dispatchEvent(customEvent);
    };
    
    document.addEventListener('timeline-item-add', handleTimelineItemAdd as EventListener);
    
    return () => {
      document.removeEventListener('timeline-item-add', handleTimelineItemAdd as EventListener);
    };
  }, []);
  
  // Get track identifier
  const getTrackId = (index: number) => `track${index + 1}`;
  
  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#151514]">
      {/* Timeline controls */}
      <div className="flex items-center h-8 px-4 border-b border-white/10 bg-[#151514]/70">
        <div className="flex items-center space-x-2">
          <button 
            className="button-icon w-7 h-7 hover:bg-[#D7F266]/20 rounded-full transition-all"
            onClick={onPlayPause}
          >
            {isPlaying ? <Pause size={14} className="text-[#F7F8F6]" /> : <Play size={14} className="text-[#F7F8F6] ml-0.5" />}
          </button>
          
          <div className="text-[#F7F8F6]/80 text-xs font-medium">
            {`${Math.floor(currentTime / 60).toString().padStart(2, '0')}:${Math.floor(currentTime % 60).toString().padStart(2, '0')} / ${Math.floor(duration / 60).toString().padStart(2, '0')}:${Math.floor(duration % 60).toString().padStart(2, '0')}`}
          </div>
        </div>
        
        <div className="flex-1" />
      </div>
      
      {/* Timeline ruler */}
      <div className="flex h-6 border-b border-white/10 bg-[#151514]/80 relative overflow-hidden">
        <div className="w-16 bg-[#151514] border-r border-white/10 shrink-0 flex items-center justify-center">
          <Clock size={12} className="mr-1 text-[#F7F8F6]/50" />
          <span className="text-xs text-[#F7F8F6]/70">Time</span>
        </div>
        <div 
          className="flex select-none overflow-hidden timeline-scroll-sync"
          style={{ width: timelineWidth }}
          ref={containerRef}
        >
          <div style={{ width: timelineWidth, height: '100%' }} className="flex">
            {timeMarkers.map(time => (
              <div 
                key={time} 
                className="time-marker text-xs text-[#F7F8F6]/60" 
                style={{ width: `${markerInterval * scale}px` }}
              >
                {`${Math.floor(time / 60).toString().padStart(2, '0')}:${Math.floor(time % 60).toString().padStart(2, '0')}`}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Timeline tracks */}
      <div className="flex-1 flex flex-row overflow-hidden">
        {/* Track labels */}
        <div className="w-16 shrink-0 bg-[#151514] border-r border-white/10">
          {tracks.map((track, index) => (
            <div 
              key={index} 
              className={cn(
                "timeline-track flex items-center justify-start px-2 text-[#F7F8F6]/70 text-xs h-10",
                index === 0 ? "bg-yellow-950/30" : // Video track
                index < 3 ? "bg-blue-950/30" : // Audio tracks
                "bg-green-950/30" // Voiceover track
              )}
            >
              {track}
            </div>
          ))}
        </div>
        
        {/* Timeline */}
        <div className="flex-1 overflow-x-auto timeline-scroll-sync">
          <div 
            ref={timelineRef}
            className="relative overflow-y-hidden"
            style={{ width: timelineWidth, minHeight: '100%' }}
            onClick={handleTimelineClick}
          >
            {/* Playhead */}
            <div ref={playheadRef} className="playhead">
              <div className="absolute -top-1 -left-[5px] w-[10px] h-[10px] bg-[#D7F266] rounded-full" />
              <div className="absolute top-[9px] bottom-0 w-px bg-[#D7F266]" />
            </div>
            
            {/* Track backgrounds */}
            {tracks.map((_, index) => (
              <div 
                key={`track-${index}`}
                className={cn(
                  "timeline-track h-10",
                  index === 0 ? "bg-yellow-950/10" : // Video track
                  index < 3 ? "bg-blue-950/10" : // Audio tracks
                  "bg-green-950/10" // Voiceover track
                )}
                onDragOver={(e) => handleTrackDragOver(e, getTrackId(index))}
                onDragLeave={handleTrackDragLeave}
                onDrop={(e) => handleTrackDrop(e, getTrackId(index))}
              />
            ))}
            
            {/* 1-second interval vertical grid lines */}
            {timeMarkers.map(time => (
              <div 
                key={`grid-${time}`}
                className="absolute top-0 bottom-0 w-px bg-white/5"
                style={{ left: `${time * scale}px` }}
              />
            ))}
            
            {/* Timeline items */}
            {items.map(item => {
              const trackIndex = parseInt(item.trackId.replace('track', '')) - 1;
              const isSelected = selectedItem?.id === item.id;
              
              return (
                <div
                  key={item.id}
                  className={cn(
                    "absolute timeline-item h-8 flex flex-col justify-center px-2 text-white z-10 group cursor-move",
                    item.color,
                    isDragging && draggedItem?.id === item.id && "opacity-50",
                    isSelected && "ring-2 ring-[#D7F266] ring-offset-0"
                  )}
                  style={{
                    top: `${trackIndex * 40 + 1}px`,
                    left: `${item.start * scale}px`,
                    width: `${item.duration * scale}px`,
                  }}
                  onClick={(e) => handleItemClick(e, item)}
                  onMouseDown={(e) => handleItemDragStart(e, item)}
                >
                  {/* Left resize handle */}
                  <div 
                    className="absolute left-0 top-0 w-2 h-full cursor-w-resize opacity-0 group-hover:opacity-100 hover:bg-white/20"
                    onMouseDown={(e) => handleResizeStart(e, item, 'start')}
                  />
                  
                  {/* Right resize handle */}
                  <div 
                    className="absolute right-0 top-0 w-2 h-full cursor-e-resize opacity-0 group-hover:opacity-100 hover:bg-white/20"
                    onMouseDown={(e) => handleResizeStart(e, item, 'end')}
                  />
                  
                  <div className="flex justify-between items-center w-full">
                    <p className="text-xs font-medium truncate">{item.name}</p>
                    <div className="flex items-center gap-1">
                      {(item.type === 'audio' || item.type === 'video') && (
                        <>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleVolumeControl(item.id);
                            }}
                            className="text-white/70 hover:text-white"
                            title="Adjust volume"
                          >
                            <Volume2 size={12} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleMute(item.id);
                            }}
                            className={`${item.muted ? 'text-[#D7F266]/70' : 'text-white/70'} hover:text-white`}
                            title={item.muted ? 'Unmute' : 'Mute'}
                          >
                            {item.muted ? <VolumeX size={12} /> : <Volume2 size={12} className="opacity-50" />}
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTrimControl(item.id);
                            }}
                            className="text-white/70 hover:text-white"
                            title="Trim audio"
                          >
                            <Scissors size={12} />
                          </button>
                        </>
                      )}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleItemDelete(item.id);
                        }}
                        className="text-white/70 hover:text-white"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Time indicator */}
                  <div className="absolute -bottom-5 left-0 text-[10px] text-white/70 opacity-0 group-hover:opacity-100">
                    {formatTime(item.start)}
                  </div>
                  
                  {/* Duration indicator */}
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-white/70 opacity-0 group-hover:opacity-100">
                    {formatTime(item.duration)}
                  </div>
                  
                  {/* Individual volume control */}
                  {(item.type === 'audio' || item.type === 'video') && showVolumeControl === item.id && (
                    <div className="mt-1 px-1">
                      <Slider
                        value={[item.volume || 1]}
                        min={0}
                        max={1}
                        step={0.1}
                        onValueChange={(value) => handleVolumeChange(item.id, value[0])}
                        className="h-1"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="text-[10px] text-white/80 text-center mt-0.5">
                        {Math.round((item.volume || 1) * 100)}%
                      </div>
                    </div>
                  )}
                  
                  {/* Trim controls */}
                  {(item.type === 'audio' || item.type === 'video') && showTrimControl === item.id && (
                    <div className="mt-1 px-1 space-y-2">
                      <div>
                        <div className="flex justify-between text-[10px] text-white/80 mb-0.5">
                          <span>Trim Start: {(item.trimStart || 0).toFixed(1)}s</span>
                        </div>
                        <Slider
                          value={[item.trimStart || 0]}
                          min={0}
                          max={Math.max(item.duration / 2, 5)}
                          step={0.1}
                          onValueChange={(value) => handleTrimChange(item.id, 'start', value[0])}
                          className="h-1"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-[10px] text-white/80 mb-0.5">
                          <span>Trim End: {(item.trimEnd || 0).toFixed(1)}s</span>
                        </div>
                        <Slider
                          value={[item.trimEnd || 0]}
                          min={0}
                          max={Math.max(item.duration / 2, 5)}
                          step={0.1}
                          onValueChange={(value) => handleTrimChange(item.id, 'end', value[0])}
                          className="h-1"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to format time in MM:SS format
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default Timeline;