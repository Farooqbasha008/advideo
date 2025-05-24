
/**
 * Groq PlayAI Text-to-Speech API integration
 */

// Default model to use for TTS
const DEFAULT_TTS_MODEL = 'playai-tts';

// Default voice ID for TTS (Groq requires '-PlayAI' suffix which is added automatically)
const DEFAULT_VOICE = 'Fritz'; // Groq supports various voices

// IndexedDB for storing audio blobs
const DB_NAME = 'audio-blobs';
const STORE_NAME = 'blobs';

/**
 * Speech generation options
 */
export interface SpeechGenerationOptions {
  voiceId?: string;
  model?: string;
  speed?: number;
  stability?: number;
  trimSilence?: boolean; // Option to trim silence from the beginning and end of audio
}

/**
 * Initialize the IndexedDB database for storing audio blobs
 */
async function initBlobDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onerror = () => reject(new Error('Failed to open IndexedDB'));
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    
    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };
  });
}

/**
 * Store an audio blob in IndexedDB for persistence across page refreshes
 * @param blob The audio blob to store
 * @param text The text used to generate the audio (for reference)
 * @returns A Promise that resolves to the blob ID
 */
async function storeBlobInIndexedDB(blob: Blob, text: string): Promise<string> {
  try {
    const db = await initBlobDB();
    const id = `audio-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const item = {
        id,
        blob,
        text,
        dateCreated: new Date()
      };
      
      const request = store.add(item);
      
      request.onsuccess = () => {
        resolve(id);
        db.close();
      };
      
      request.onerror = () => {
        reject(new Error('Failed to store audio blob in IndexedDB'));
        db.close();
      };
    });
  } catch (error) {
    console.error('Error storing blob in IndexedDB:', error);
    throw error;
  }
}

/**
 * Retrieve an audio blob from IndexedDB by its ID
 * @param blobId The ID of the blob to retrieve
 * @returns A Promise that resolves to the audio blob or null if not found
 */
export async function getBlobFromIndexedDB(blobId: string): Promise<Blob | null> {
  try {
    const db = await initBlobDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(blobId);
      
      request.onsuccess = (event) => {
        const result = (event.target as IDBRequest).result;
        if (result) {
          resolve(result.blob);
        } else {
          resolve(null);
        }
        db.close();
      };
      
      request.onerror = () => {
        reject(new Error('Failed to retrieve audio blob from IndexedDB'));
        db.close();
      };
    });
  } catch (error) {
    console.error('Error retrieving blob from IndexedDB:', error);
    return null;
  }
}

/**
 * Generate speech using Groq's PlayAI text-to-speech API
 * @param text The text to convert to speech
 * @param apiKey The Groq API key
 * @param options Additional options for speech generation
 * @returns A Promise that resolves to an audio URL
 */
export async function generateSpeech(
  text: string,
  apiKey: string,
  options: SpeechGenerationOptions = {}
): Promise<string> {
  if (!apiKey) {
    throw new Error('Groq API key is required');
  }

  const voiceId = options.voiceId || DEFAULT_VOICE;
  const model = options.model || DEFAULT_TTS_MODEL;
  const speed = options.speed || 1.0;
  const stability = options.stability || 0.5;

  try {
    // Clean up the text to improve TTS quality
    // Remove excessive whitespace and normalize punctuation
    const cleanedText = text
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\.{2,}/g, '.')
      .replace(/\!\s*\!/g, '!')
      .replace(/\?\s*\?/g, '?');

    // Add strategic pauses for better flow by ensuring commas and periods have space after
    const formattedText = cleanedText
      .replace(/,([^\s])/g, ', $1')
      .replace(/\.([^\s])/g, '. $1');
    
    // Make the API call to Groq PlayAI for text-to-speech
    // Append '-PlayAI' suffix to voice ID as required by Groq API
    const formattedVoiceId = `${voiceId}-PlayAI`;
    
    const response = await fetch(`https://api.groq.com/openai/v1/audio/speech`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        input: formattedText,
        voice: formattedVoiceId,
        speed: speed,
        // Additional parameters can be added as Groq's API evolves
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Groq API error: ${errorData || response.statusText}`);
    }

    // Get the audio blob
    const audioBlob = await response.blob();
    
    // Apply silence trimming if enabled with improved settings
    const finalBlob = options.trimSilence ? 
      await trimSilenceFromAudio(audioBlob) : 
      audioBlob;
    
    // Store the blob in IndexedDB for persistence across page refreshes
    const blobId = await storeBlobInIndexedDB(finalBlob, formattedText);
    
    // Create a URL for immediate use
    const audioUrl = URL.createObjectURL(finalBlob);
    
    // Return the URL with the blob ID as a query parameter
    // This allows us to retrieve the blob from IndexedDB when the URL becomes invalid
    return `${audioUrl}#blobId=${blobId}`;
  } catch (error) {
    console.error('Error generating speech with Groq PlayAI:', error);
    throw error;
  }
}

/**
 * Trims silence from the beginning and end of an audio blob with improved quality
 * @param audioBlob The audio blob to process
 * @returns A Promise that resolves to a processed audio blob with silence removed
 */
async function trimSilenceFromAudio(audioBlob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Create an audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a file reader to read the blob
    const fileReader = new FileReader();
    
    fileReader.onload = async (event) => {
      try {
        // Decode the audio data
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Get the audio data
        const channelData = audioBuffer.getChannelData(0); // Use the first channel
        
        // Define the silence threshold (adjusted for better results)
        const silenceThreshold = 0.003; // Lower threshold to keep more audio content
        
        // Find the start and end points (trim silence)
        let startIndex = 0;
        let endIndex = channelData.length - 1;
        
        // Find the first non-silent sample from the beginning
        while (startIndex < channelData.length && Math.abs(channelData[startIndex]) < silenceThreshold) {
          startIndex++;
        }
        
        // Find the last non-silent sample from the end
        while (endIndex > startIndex && Math.abs(channelData[endIndex]) < silenceThreshold) {
          endIndex--;
        }
        
        // Add a buffer (200ms) to avoid cutting off speech too abruptly at the beginning
        const bufferSamplesStart = audioBuffer.sampleRate * 0.2;
        startIndex = Math.max(0, startIndex - bufferSamplesStart);
        
        // Add a larger buffer at the end (300ms) to ensure we don't cut off trailing audio
        const endBufferSamples = audioBuffer.sampleRate * 0.3;
        endIndex = Math.min(channelData.length - 1, endIndex + endBufferSamples);
        
        // Create a new buffer with the trimmed audio
        const trimmedLength = endIndex - startIndex + 1;
        const trimmedBuffer = audioContext.createBuffer(
          audioBuffer.numberOfChannels,
          trimmedLength,
          audioBuffer.sampleRate
        );
        
        // Copy the trimmed audio data to the new buffer
        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
          const channelData = audioBuffer.getChannelData(channel);
          const trimmedChannelData = trimmedBuffer.getChannelData(channel);
          
          for (let i = 0; i < trimmedLength; i++) {
            trimmedChannelData[i] = channelData[startIndex + i];
          }
        }
        
        // Convert the trimmed buffer back to a blob with enhanced processing
        const offlineContext = new OfflineAudioContext(
          trimmedBuffer.numberOfChannels,
          trimmedBuffer.length,
          trimmedBuffer.sampleRate
        );
        
        const source = offlineContext.createBufferSource();
        source.buffer = trimmedBuffer;
        
        // Add gentle fade in and fade out to prevent clicks and pops
        const gainNode = offlineContext.createGain();
        
        // Better fade curve for professional sound
        gainNode.gain.setValueAtTime(0.0, 0);
        gainNode.gain.linearRampToValueAtTime(1.0, 0.03); // 30ms fade in
        gainNode.gain.setValueAtTime(1.0, trimmedBuffer.duration - 0.1);
        gainNode.gain.linearRampToValueAtTime(0.0, trimmedBuffer.duration); // 100ms fade out
        
        // Add a subtle compression for more professional sound
        const compressor = offlineContext.createDynamicsCompressor();
        compressor.threshold.value = -20;
        compressor.knee.value = 10;
        compressor.ratio.value = 3;
        compressor.attack.value = 0.02;
        compressor.release.value = 0.1;
        
        source.connect(gainNode);
        gainNode.connect(compressor);
        compressor.connect(offlineContext.destination);
        
        source.start(0);
        
        const renderedBuffer = await offlineContext.startRendering();
        
        // Convert the rendered buffer to a WAV blob
        const wavBlob = audioBufferToWav(renderedBuffer);
        resolve(wavBlob);
      } catch (error) {
        console.error('Error processing audio:', error);
        // If there's an error, return the original blob
        resolve(audioBlob);
      } finally {
        audioContext.close();
      }
    };
    
    fileReader.onerror = () => {
      console.error('Error reading audio file');
      resolve(audioBlob); // Return original on error
    };
    
    fileReader.readAsArrayBuffer(audioBlob);
  });
}

/**
 * Converts an AudioBuffer to a WAV Blob
 * @param buffer The AudioBuffer to convert
 * @returns A Blob containing the WAV data
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChannels = buffer.numberOfChannels;
  const length = buffer.length * numOfChannels * 2;
  const sampleRate = buffer.sampleRate;
  
  // Create the WAV file header
  const wavDataView = new DataView(new ArrayBuffer(44 + length));
  
  // "RIFF" chunk descriptor
  writeString(wavDataView, 0, 'RIFF');
  wavDataView.setUint32(4, 36 + length, true);
  writeString(wavDataView, 8, 'WAVE');
  
  // "fmt " sub-chunk
  writeString(wavDataView, 12, 'fmt ');
  wavDataView.setUint32(16, 16, true); // subchunk1size
  wavDataView.setUint16(20, 1, true); // audio format (PCM)
  wavDataView.setUint16(22, numOfChannels, true);
  wavDataView.setUint32(24, sampleRate, true);
  wavDataView.setUint32(28, sampleRate * numOfChannels * 2, true); // byte rate
  wavDataView.setUint16(32, numOfChannels * 2, true); // block align
  wavDataView.setUint16(34, 16, true); // bits per sample
  
  // "data" sub-chunk
  writeString(wavDataView, 36, 'data');
  wavDataView.setUint32(40, length, true);
  
  // Write the PCM samples
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      wavDataView.setInt16(offset, value, true);
      offset += 2;
    }
  }
  
  return new Blob([wavDataView], { type: 'audio/wav' });
}

/**
 * Helper function to write a string to a DataView
 */
function writeString(dataView: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    dataView.setUint8(offset + i, string.charCodeAt(i));
  }
}

export const GROQ_VOICES = [
  { id: 'Aaliyah', name: 'Aaliyah' },
  { id: 'Adelaide', name: 'Adelaide' },
  { id: 'Angelo', name: 'Angelo' },
  { id: 'Arista', name: 'Arista' },
  { id: 'Atlas', name: 'Atlas' },
  { id: 'Basil', name: 'Basil' },
  { id: 'Briggs', name: 'Briggs' },
  { id: 'Calum', name: 'Calum' },
  { id: 'Celeste', name: 'Celeste' },
  { id: 'Cheyenne', name: 'Cheyenne' },
  { id: 'Chip', name: 'Chip' },
  { id: 'Cillian', name: 'Cillian' },
  { id: 'Deedee', name: 'Deedee' },
  { id: 'Eleanor', name: 'Eleanor' },
  { id: 'Fritz', name: 'Fritz' },
  { id: 'Gail', name: 'Gail' },
  { id: 'Indigo', name: 'Indigo' },
  { id: 'Jennifer', name: 'Jennifer' },
  { id: 'Judy', name: 'Judy' },
  { id: 'Mamaw', name: 'Mamaw' },
  { id: 'Mason', name: 'Mason' },
  { id: 'Mikail', name: 'Mikail' },
  { id: 'Mitch', name: 'Mitch' },
  { id: 'Nia', name: 'Nia' },
  { id: 'Quinn', name: 'Quinn' },
  { id: 'Ruby', name: 'Ruby' },
  { id: 'Thunder', name: 'Thunder' },
];
