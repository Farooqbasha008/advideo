
import React from 'react';
import { Maximize, MinusCircle, PlusCircle, Volume2, VolumeX, Undo, Redo, Scissors, RotateCcw, RotateCw } from 'lucide-react';

interface PreviewControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleFullscreen: () => void;
  onToggleMute: () => void;
  volume: number;
  muted: boolean;
  onVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
}

const PreviewControls: React.FC<PreviewControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onToggleFullscreen,
  onToggleMute,
  volume,
  muted,
  onVolumeChange,
  currentTime,
  duration,
  isPlaying
}) => {
  return (
    <>
      <div className="flex items-center justify-between p-2 bg-theme-dark/70 border-b border-theme-light/10">
        <div className="flex items-center space-x-1">
          <button className="button-icon p-1">
            <Undo size={14} />
          </button>
          <button className="button-icon p-1">
            <Redo size={14} />
          </button>
          <div className="h-4 w-px bg-theme-light/20 mx-1"></div>
          <button className="button-icon p-1">
            <Scissors size={14} />
          </button>
          <button className="button-icon p-1">
            <RotateCcw size={14} />
          </button>
          <button className="button-icon p-1">
            <RotateCw size={14} />
          </button>
        </div>
        
        <div className="text-xs font-medium text-theme-light/70">
          {isPlaying ? "Playing" : "Paused"} | {`${Math.floor(currentTime / 60)}:${Math.floor(currentTime % 60).toString().padStart(2, '0')} / ${Math.floor(duration / 60)}:${Math.floor(duration % 60).toString().padStart(2, '0')}`}
        </div>
        
        <div className="flex items-center space-x-1">
          <button 
            className="button-icon p-1"
            onClick={onToggleMute}
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={onVolumeChange}
            className="w-20 h-1 bg-theme-light/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-theme-primary [&::-webkit-slider-thumb]:rounded-full"
          />
        </div>
      </div>
    </>
  );
};

export default PreviewControls;
