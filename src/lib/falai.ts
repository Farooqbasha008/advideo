import { fal } from "@fal-ai/client";

interface ScriptGenerationOptions {
  duration?: number;
  negativePrompt?: string;
  aspectRatio?: '16:9' | '9:16';
}

interface PikaGenerationOptions {
  duration?: number;
  negative_prompt?: string;
  aspect_ratio?: '16:9' | '9:16' | '1:1' | '4:5' | '5:4' | '3:2' | '2:3';
  resolution?: '720p' | '1080p';
  seed?: number;
}

// Define possible response formats based on API documentation
interface FalApiResponse {
  // Format 1: As per documentation
  video?: {
    url: string;
  };
  seed?: number;
  
  // Format 2: Artifacts array format
  artifacts?: Array<{
    url?: string;
  }>;
  
  // Format 3: Data wrapper format
  data?: {
    video?: {
      url: string;
    };
  };
}

export async function generateVideo(
  prompt: string,
  apiKey: string,
  options: ScriptGenerationOptions = {}
): Promise<string> {
  const { 
    duration = 5, 
    negativePrompt = 'close-up faces, blurry, low quality, distorted faces, rapid movements, complex backgrounds, inconsistent lighting',
    aspectRatio = '16:9'
  } = options;

  if (!apiKey) {
    throw new Error('Fal.ai API key is required');
  }

  try {
    fal.config({ credentials: apiKey });

    // Log the request for debugging
    console.log('Sending request to Fal.ai with prompt:', prompt);
    
    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Video generation timed out after 10 minutes. The service might be experiencing high load.'));
      }, 600000); // 10 minute timeout
    });
    
    try {
      // Execute the video generation with a timeout
      const result = await Promise.race([
        fal.subscribe('fal-ai/wan/v2.1/1.3b/text-to-video', {
          input: {
            prompt,
            negative_prompt: negativePrompt,
            num_inference_steps: 30,
            guidance_scale: 5, // Updated to recommended value
            seed: Math.floor(Math.random() * 1000000),
            aspect_ratio: aspectRatio,
            shift: 5, // Added shift parameter
            sampler: 'unipc' // Added sampler parameter
          },
          pollInterval: 5000,
          logs: true
        }),
        timeoutPromise
      ]);

      if (!result) {
        throw new Error('No response from API');
      }

      // Log the full response for debugging
      console.log('Fal.ai API response:', JSON.stringify(result, null, 2));

      // Try multiple possible response formats
      const response = result as FalApiResponse;
      
      // Check for different possible URL locations in the response
      let videoUrl = response.video?.url;
      
      if (!videoUrl && response.artifacts && response.artifacts.length > 0) {
        videoUrl = response.artifacts[0]?.url;
      }
      
      if (!videoUrl && response.data?.video?.url) {
        videoUrl = response.data.video.url;
      }

      if (!videoUrl) {
        console.error('Unable to find video URL in response:', response);
        throw new Error('No video URL in the response');
      }

      return videoUrl;
    } catch (error) {
      console.error('Error generating video:', error);
      if (error instanceof Error) {
        // Handle specific API errors
        if (error.message.includes('API key')) {
          throw new Error('Invalid API key. Please check your Fal.ai API key and try again.');
        }
        if (error.message.includes('rate limit')) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
      }
      throw error;
    }
  } catch (error) {
    console.error('Error generating video:', error);
    throw error;
  }
}

/**
 * Generate a video using the Pika v2.2 text-to-video model from fal.ai
 * 
 * @param prompt Text description of the video to generate
 * @param apiKey Fal.ai API key
 * @param options Generation options including duration, negative prompt, aspect ratio, and resolution
 * @returns Promise that resolves to the URL of the generated video
 */
export async function generatePikaVideo(
  prompt: string,
  apiKey: string,
  options: PikaGenerationOptions = {}
): Promise<string> {
  const { 
    duration = 5, 
    negative_prompt = 'close-up faces, blurry, low quality, distorted faces, rapid movements, complex backgrounds, inconsistent lighting',
    aspect_ratio = '16:9',
    resolution = '720p',
    seed = Math.floor(Math.random() * 1000000)
  } = options;

  if (!apiKey) {
    throw new Error('Fal.ai API key is required');
  }

  try {
    fal.config({ credentials: apiKey });

    // Log the request for debugging
    console.log('Sending request to Pika v2.2 with prompt:', prompt);
    
    // Create a timeout promise for longer generation time
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Video generation timed out after 15 minutes. The service might be experiencing high load.'));
      }, 900000); // 15 minute timeout for higher quality
    });
    
    try {
      // Execute the Pika video generation with a timeout
      const result = await Promise.race([
        fal.subscribe('fal-ai/pika/v2.2/text-to-video', {
          input: {
            prompt,
            negative_prompt,
            aspect_ratio,
            resolution,
            duration,
            seed
          },
          pollInterval: 5000,
          logs: true,
          onQueueUpdate: (update) => {
            if (update.status === "IN_PROGRESS") {
              update.logs.map((log) => log.message).forEach(console.log);
            }
          },
        }),
        timeoutPromise
      ]);

      if (!result) {
        throw new Error('No response from API');
      }

      // Log the full response for debugging
      console.log('Pika v2.2 API response:', JSON.stringify(result, null, 2));

      // Try multiple possible response formats based on Pika documentation
      const response = result as FalApiResponse;
      
      // Check for different possible URL locations in the response
      // Primary format according to Pika docs
      let videoUrl = response.video?.url;
      
      // Alternative formats
      if (!videoUrl && response.data?.video?.url) {
        videoUrl = response.data.video.url;
      }
      
      if (!videoUrl && response.artifacts && response.artifacts.length > 0) {
        videoUrl = response.artifacts[0]?.url;
      }

      if (!videoUrl) {
        console.error('Unable to find video URL in Pika response:', response);
        throw new Error('No video URL in the response');
      }

      return videoUrl;
    } catch (error) {
      console.error('Error generating video with Pika:', error);
      if (error instanceof Error) {
        // Handle specific API errors
        if (error.message.includes('API key')) {
          throw new Error('Invalid API key. Please check your Fal.ai API key and try again.');
        }
        if (error.message.includes('rate limit')) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        // Add any Pika-specific error handling here
      }
      throw error;
    }
  } catch (error) {
    console.error('Error generating video with Pika:', error);
    throw error;
  }
}
