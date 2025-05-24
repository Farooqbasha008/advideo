import { ElevenLabsClient } from 'elevenlabs';

interface SpeechOptions {
  voiceId?: string;
}

interface SoundOptions {
  type: 'bgm' | 'sfx';
  duration: number;
}

let elevenLabsClient: ElevenLabsClient | null = null;

function getClient(apiKey: string) {
  if (!elevenLabsClient) {
    elevenLabsClient = new ElevenLabsClient({ apiKey });
  }
  return elevenLabsClient;
}

export async function generateSpeech(
  text: string,
  apiKey: string,
  options: SpeechOptions = {}
): Promise<string> {
  const { voiceId = 'default' } = options;
  
  try {
    // TODO: Implement voice generation
    const mockUrl = `https://example.com/speech-${Date.now()}.mp3`;
    return mockUrl;
  } catch (error) {
    console.error('Error generating speech:', error);
    throw new Error('Failed to generate speech with ElevenLabs');
  }
}

export async function generateSound(
  prompt: string,
  apiKey: string,
  options: SoundOptions
): Promise<string> {
  if (!prompt || !apiKey) {
    throw new Error('Prompt and API key are required');
  }

  try {
    const client = getClient(apiKey);
    const response = await client.textToSoundEffects.convert({
      text: prompt
    });

    // Convert the stream to an array buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response) {
      chunks.push(new Uint8Array(chunk));
    }
    
    // Concatenate all chunks into a single array buffer
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    
    // Convert to blob and create URL
    const blob = new Blob([result.buffer], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    return url;
  } catch (error) {
    console.error('Error generating sound:', error);
    throw error instanceof Error 
      ? error 
      : new Error('Failed to generate sound with ElevenLabs');
  }
}
