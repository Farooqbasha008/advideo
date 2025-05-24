
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { TimelineItem } from '../VideoEditor';
import { toast } from 'sonner';
import { getBlobFromIndexedDB } from '@/lib/groqTTS';

interface AudioManagerProps {
  activeAudios: TimelineItem[];
  currentTime: number;
  isPlaying: boolean;
  volume: number;
  muted: boolean;
}

const AudioManager: React.FC<AudioManagerProps> = ({
  activeAudios,
  currentTime,
  isPlaying,
  volume,
  muted
}) => {
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const [loadedAudios, setLoadedAudios] = useState<Set<string>>(new Set());
  const [audioStates, setAudioStates] = useState<Map<string, 'loading' | 'error' | 'ready'>>(new Map());
  const lastPlayPositions = useRef<Map<string, number>>(new Map());

  // Helper function to create new audio element with improved error handling
  const createAudioElement = useCallback(async (audio: TimelineItem) => {
    console.log('Creating new audio element for:', audio.id, audio.src);
    
    if (!audio.src) {
      console.error('Audio source is missing:', audio.id);
      setAudioStates(prev => new Map(prev).set(audio.id, 'error'));
      toast.error('Audio source missing', {
        description: `Could not load audio: ${audio.name} (no source)`,
      });
      return null;
    }
    
    const audioElement = new Audio();
    
    // Set loading state
    setAudioStates(prev => new Map(prev).set(audio.id, 'loading'));
    
    // Add event listeners
    audioElement.addEventListener('loadeddata', () => {
      console.log('Audio loaded successfully:', audio.id);
      setLoadedAudios(prev => new Set(prev).add(audio.id));
      setAudioStates(prev => new Map(prev).set(audio.id, 'ready'));
    });
    
    audioElement.addEventListener('canplaythrough', () => {
      setAudioStates(prev => {
        // Only update if not already set to ready
        if (prev.get(audio.id) !== 'ready') {
          return new Map(prev).set(audio.id, 'ready');
        }
        return prev;
      });
    });
    
    audioElement.addEventListener('error', async (e) => {
      console.error('Audio loading error:', audio.id, e);
      
      // Check if this is a blob URL that might have become invalid
      if (audio.src.startsWith('blob:') && audio.src.includes('#blobId=')) {
        // Extract the blob ID from the URL
        const blobId = audio.src.split('#blobId=')[1];
        if (blobId) {
          try {
            // Try to retrieve the blob from IndexedDB
            const blob = await getBlobFromIndexedDB(blobId);
            if (blob) {
              // Create a new blob URL
              const newUrl = URL.createObjectURL(blob);
              console.log('Retrieved audio blob from IndexedDB:', blobId);
              audioElement.src = newUrl;
              audioElement.load();
              return;
            }
          } catch (retrieveError) {
            console.error('Failed to retrieve audio from IndexedDB:', retrieveError);
          }
        }
      }
      
      setAudioStates(prev => new Map(prev).set(audio.id, 'error'));
      toast.error('Error loading audio', {
        description: `Could not load audio: ${audio.name}`,
      });
    });
    
    // Set preload and source
    audioElement.preload = 'auto';
    
    try {
      // Check if this is a URL with a blobId that we need to handle
      if (audio.src.includes('#blobId=')) {
        const [url, blobIdPart] = audio.src.split('#blobId=');
        if (blobIdPart) {
          try {
            // Try to retrieve the blob from IndexedDB
            const blob = await getBlobFromIndexedDB(blobIdPart);
            if (blob) {
              // Create a new blob URL
              const newUrl = URL.createObjectURL(blob);
              console.log('Retrieved audio blob from IndexedDB:', blobIdPart);
              audioElement.src = newUrl;
            } else {
              // Fall back to the original URL if blob not found
              audioElement.src = url;
            }
          } catch (retrieveError) {
            console.error('Failed to retrieve audio from IndexedDB:', retrieveError);
            audioElement.src = url;
          }
        } else {
          audioElement.src = audio.src;
        }
      } else {
        audioElement.src = audio.src;
      }
      
      // Use crossOrigin for better compatibility
      audioElement.crossOrigin = 'anonymous';
      
      // Add small audio quality improvements
      audioElement.preservesPitch = true;
      
      // Prevent looping - this is crucial to prevent repeating audio
      audioElement.loop = false;
      
      // Lower latency mode when available
      if ('mozAutoplayEnabled' in audioElement) {
        // @ts-ignore - Firefox-specific property
        audioElement.mozAutoplayEnabled = true;
      }
      
      audioElement.load();
      return audioElement;
    } catch (error) {
      console.error('Error setting audio source:', error);
      setAudioStates(prev => new Map(prev).set(audio.id, 'error'));
      toast.error('Invalid audio source', {
        description: `Could not load audio: ${audio.name}`,
      });
      return null;
    }
  }, []);

  // Create, update or remove audio elements as needed
  useEffect(() => {
    console.log('Active audios changed:', activeAudios.length);
    
    // Track which audio IDs we're handling in this effect run
    const currentAudioIds = new Set<string>();
    
    // Process each active audio
    activeAudios.forEach(async (audio) => {
      currentAudioIds.add(audio.id);
      
      // Create new audio element if it doesn't exist
      if (!audioRefs.current.has(audio.id)) {
        const newAudio = await createAudioElement(audio);
        if (newAudio) {
          audioRefs.current.set(audio.id, newAudio);
        }
      } else {
        // Check if the source has changed
        const existingAudio = audioRefs.current.get(audio.id);
        if (existingAudio && existingAudio.src !== audio.src && audio.src) {
          console.log('Audio source changed, recreating element:', audio.id);
          
          // Store current position before recreating
          const currentPos = existingAudio.currentTime;
          lastPlayPositions.current.set(audio.id, currentPos);
          
          existingAudio.pause();
          existingAudio.src = '';
          
          const newAudio = await createAudioElement(audio);
          if (newAudio) {
            audioRefs.current.set(audio.id, newAudio);
          }
        }
      }
    });
    
    // Clean up audio elements that are no longer active
    audioRefs.current.forEach((audio, id) => {
      if (!currentAudioIds.has(id)) {
        console.log('Removing unused audio element:', id);
        audio.pause();
        audio.src = '';
        audioRefs.current.delete(id);
        
        // Clean up state
        setLoadedAudios(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
        
        setAudioStates(prev => {
          const newMap = new Map(prev);
          newMap.delete(id);
          return newMap;
        });
        
        // Clean up last play positions
        lastPlayPositions.current.delete(id);
      }
    });
  }, [activeAudios, createAudioElement]);

  // Improved playback handling with better position tracking and precise seeking
  useEffect(() => {
    activeAudios.forEach(audio => {
      const audioElement = audioRefs.current.get(audio.id);
      if (!audioElement || audioStates.get(audio.id) !== 'ready') return;
      
      try {
        // Calculate position with trim adjustments
        const trimStart = audio.trimStart || 0;
        const relativePosition = Math.max(0, currentTime - audio.start);
        
        // Apply trim start - only play audio after the trim start point
        if (relativePosition < trimStart) {
          if (!audioElement.paused) {
            audioElement.pause();
          }
          return;
        }
        
        // Apply trim end - stop playing when we reach the trim end point
        const trimEnd = audio.trimEnd || 0;
        const effectiveDuration = audio.duration - trimStart - trimEnd;
        if (relativePosition > trimStart + effectiveDuration) {
          if (!audioElement.paused) {
            audioElement.pause();
          }
          return;
        }
        
        // Set the correct position in the audio file (accounting for trim)
        const audioPosition = relativePosition - trimStart;
        
        // Compare with last known position to prevent unnecessary seeking
        // This helps prevent audio stuttering from too frequent seeking
        const lastPosition = lastPlayPositions.current.get(audio.id) || 0;
        
        // Use an adaptive seek threshold - smaller for voiceovers (more precision needed)
        // and larger for other audio types (less frequent seeking)
        let seekThreshold = 0.2; // default
        if (audio.type === 'audio' && audio.name.includes('Voiceover')) {
          seekThreshold = 0.08; // More precise for voiceovers
        }
        
        // Only seek if position difference exceeds threshold
        if (Math.abs(audioElement.currentTime - audioPosition) > seekThreshold) {
          console.log(`Seeking audio ${audio.id} to ${audioPosition}`);
          audioElement.currentTime = Math.max(0, audioPosition);
          lastPlayPositions.current.set(audio.id, audioPosition);
        }
        
        // Apply volume and mute settings
        // Check both global mute and individual audio mute
        const isAudioMuted = muted || audio.muted;
        const clipVolume = (audio.volume || 1) * (isAudioMuted ? 0 : volume);
        audioElement.volume = Math.max(0, Math.min(1, clipVolume)); // Ensure volume is between 0 and 1
        
        // Handle play/pause with improved error handling for voiceovers
        if (isPlaying) {
          if (audioElement.paused) {
            console.log('Playing audio:', audio.id);
            
            // First set the currentTime again to ensure we're at the right position
            // This helps prevent the audio from playing from the wrong position
            audioElement.currentTime = audioPosition;
            
            // Use a promise with proper error handling
            audioElement.play().catch(err => {
              console.error('Failed to play audio:', audio.id, err);
              
              // If there's an error, try reloading the audio element
              if (audio.src.includes('#blobId=')) {
                console.log('Attempting to reload audio from blob storage:', audio.id);
                createAudioElement(audio).then(newAudio => {
                  if (newAudio) {
                    audioRefs.current.set(audio.id, newAudio);
                    
                    // Set the position before playing
                    newAudio.currentTime = audioPosition;
                    
                    newAudio.play().catch(err => {
                      console.error('Still failed to play audio after reload:', err);
                    });
                  }
                });
              }
            });
          }
        } else {
          if (!audioElement.paused) {
            audioElement.pause();
            // Store the current position for resuming later
            lastPlayPositions.current.set(audio.id, audioElement.currentTime);
          }
        }
      } catch (error) {
        console.error('Error controlling audio playback:', audio.id, error);
      }
    });
  }, [activeAudios, currentTime, isPlaying, volume, muted, audioStates, createAudioElement]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('AudioManager unmounting, cleaning up');
      audioRefs.current.forEach((audio) => {
        audio.pause();
        audio.src = '';
      });
      audioRefs.current.clear();
      setLoadedAudios(new Set());
      setAudioStates(new Map());
      lastPlayPositions.current.clear();
    };
  }, []);

  // This component doesn't render anything visible
  return null;
};

export default AudioManager;
