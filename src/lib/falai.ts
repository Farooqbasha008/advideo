import { fal } from "@fal-ai/client";
import { StoryboardScene } from './videoGeneration';
import { enhancePromptWithVisualGuidelines } from './videoGeneration';

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

interface FluxImageOptions {
  width?: number;
  height?: number;
  num_inference_steps?: number;
  seed?: number;
  num_images?: number;
  negativePrompt?: string;
}

interface FluxImageResponse {
  images: Array<{
    url: string;
    width: number;
    height: number;
    content_type: string;
  }>;
  prompt: string;
  seed: number;
  timings: any;
  has_nsfw_concepts: boolean[];
}

// Define proper types for the fal.ai Flux Schnell client response
interface FluxSchnellOutput {
  images: Array<{
    url: string;
    width: number;
    height: number;
    content_type: string;
  }>;
  prompt: string;
  seed: number;
  timings: any;
  has_nsfw_concepts: boolean[];
}

/**
 * Available video generation models
 */
export enum VideoModel {
  MINIMAX_DIRECTOR = 'minimax-director',
  LTX_VIDEO = 'ltx-video-13b'
}

/**
 * Generate a video using the Wan text-to-video model from fal.ai
 * @param prompt Text prompt for video generation
 * @param apiKey fal.ai API key
 * @param options Additional generation options
 * @returns URL to the generated video
 */
export async function generateWanVideo(
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
      }
      throw error;
    }
  } catch (error) {
    console.error('Error generating video with Pika:', error);
    throw error;
  }
}

/**
 * Generate an image using fal.ai Flux Schnell model
 * @param prompt Text prompt for image generation
 * @param apiKey fal.ai API key
 * @param options Additional generation options
 * @returns URL to the generated image
 */
export const generateImage = async (
  prompt: string,
  apiKey: string,
  options: FluxImageOptions = {}
): Promise<string> => {
  if (!apiKey) {
    throw new Error('FAL.AI API key is required');
  }
  
  // Set default image size if not provided
  const width = options.width || 1024;
  const height = options.height || 768;
  
  // Set default number of inference steps
  const num_inference_steps = options.num_inference_steps || 4;
  
  try {
    console.log('Generating image with prompt:', prompt);
    
    // Configure the client with the API key
    fal.config({
      credentials: apiKey
    });
    
    // Use the fal client to make the request
    const result = await fal.subscribe('fal-ai/flux/schnell', {
      input: {
        prompt: prompt,
        image_size: {
          width,
          height
        },
        num_inference_steps,
        num_images: options.num_images || 1,
        seed: options.seed,
        enable_safety_checker: true
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log('Processing: ', update.logs);
        }
      },
    });
    
    // Log the full response for debugging
    console.log('Flux Schnell API response:', JSON.stringify(result, null, 2));
    
    // Extract the image URL using proper typing
    // The client returns result.data which contains the actual response
    const responseData = result.data as FluxSchnellOutput;
    if (!responseData?.images || responseData.images.length === 0) {
      throw new Error('No images were generated');
    }
    
    return responseData.images[0].url;
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
};

/**
 * Generate an image for a storyboard scene using Flux Schnell model
 * @param scene The storyboard scene details
 * @param scriptPrompt The original script prompt for this scene
 * @param apiKey fal.ai API key
 * @returns URL to the generated image
 */
export const generateStoryboardPreview = async (
  scene: StoryboardScene,
  scriptPrompt: string,
  apiKey: string
): Promise<string> => {
  // Enhance the script prompt with visual guidelines from the storyboard
  const enhancedPrompt = enhancePromptWithVisualGuidelines(scriptPrompt, scene);
  
  // Add some quality improvements for photorealistic results
  const finalPrompt = `${enhancedPrompt}. Photorealistic, high quality, detailed, 8K resolution, cinematic lighting`;
  
  // Set negative prompts to avoid common issues
  const negativePrompt = "deformed, bad anatomy, disfigured, poorly drawn face, mutation, mutated, extra limb, ugly, text, watermark";
  
  // Generate the image with appropriate aspect ratio based on shot type
  let width = 1024;
  let height = 768;
  
  if (scene.shotType === 'wide') {
    // 16:9 aspect ratio for wide shots
    width = 1024;
    height = 576;
  } else if (scene.shotType === 'close-up') {
    // More squared format for close-ups
    width = 768;
    height = 768;
  }
  
  return generateImage(finalPrompt, apiKey, {
    width,
    height,
    num_inference_steps: 4, // Balance between quality and speed
    negativePrompt
  });
};

/**
 * Default video generation function that uses the most appropriate model
 * Currently defaults to using Flux Schnell for image generation
 */
export const generateVideo = async (
  prompt: string,
  apiKey: string,
  options: any = {}
): Promise<string> => {
  // For now, we'll generate a static image with Flux Schnell
  // In the future, this could be expanded to select the appropriate video model
  
  // Add video-specific enhancements to the prompt
  const enhancedPrompt = `${prompt}. Cinematic frame, film still, movie scene, professional photography, high quality`;
  
  return generateImage(enhancedPrompt, apiKey, {
    width: 1024,
    height: 576, // 16:9 aspect ratio
    num_inference_steps: 4
  });
};

/**
 * Generate an image using fal.ai MiniMax Subject Reference model for consistent character appearance
 * @param prompt Text prompt for image generation
 * @param referenceImageUrl URL of the character reference image
 * @param apiKey fal.ai API key
 * @param options Additional generation options
 * @returns URL to the generated image
 */
export const generateCharacterConsistentImage = async (
  prompt: string,
  referenceImageUrl: string,
  apiKey: string,
  options: {
    aspectRatio?: string;
    numImages?: number;
  } = {}
): Promise<string> => {
  if (!apiKey) {
    throw new Error('FAL.AI API key is required');
  }
  
  try {
    console.log('Generating image with character consistency via MiniMax');
    
    // Configure the client with the API key
    fal.config({
      credentials: apiKey
    });
    
    // Use the MiniMax model with subject reference
    const result = await fal.subscribe('fal-ai/minimax/image-01/subject-reference', {
      input: {
        prompt,
        image_url: referenceImageUrl,
        aspect_ratio: options.aspectRatio || "16:9",
        num_images: options.numImages || 1
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });
    
    // Extract the image URL from the response
    if (!result.data?.images || result.data.images.length === 0) {
      throw new Error('No images were generated');
    }
    
    return result.data.images[0].url;
  } catch (error) {
    console.error('Error generating character-consistent image:', error);
    throw error;
  }
};

/**
 * Generate video from an image using MiniMax Video-01-Director model or LTX Video model
 * This model allows for camera movement instructions for dynamic shots
 * @param prompt Text prompt for video generation, can include camera instructions in [brackets]
 * @param imageUrl URL of the image to use as the first frame
 * @param apiKey fal.ai API key
 * @param model The video generation model to use
 * @returns URL to the generated video
 */
export const generateVideoFromImage = async (
  prompt: string,
  imageUrl: string,
  apiKey: string,
  model: VideoModel = VideoModel.MINIMAX_DIRECTOR
): Promise<string> => {
  if (!apiKey) {
    throw new Error('FAL.AI API key is required');
  }
  
  try {
    // Configure the client with the API key
    fal.config({
      credentials: apiKey
    });
    
    // Enhance the prompt with photorealistic and cinematic terms if model is MiniMax
    let enhancedPrompt = prompt;
    let modelEndpoint = '';
    
    if (model === VideoModel.MINIMAX_DIRECTOR) {
      console.log('Generating video from image via MiniMax Director');
      modelEndpoint = 'fal-ai/minimax/video-01-director/image-to-video';
      
      // Check if prompt already has descriptors for visual quality, and if not, add them
      if (!prompt.toLowerCase().includes('photorealistic') && 
          !prompt.toLowerCase().includes('realism') && 
          !prompt.toLowerCase().includes('cinematic quality')) {
        
        // Extract camera movement information to tailor enhancement
        const hasCameraMovement = 
          prompt.includes('[Push in]') || 
          prompt.includes('[Pull out]') || 
          prompt.includes('[Pan') || 
          prompt.includes('[Tilt') || 
          prompt.includes('[Tracking');
          
        if (hasCameraMovement) {
          // For dynamic camera movement, add appropriate descriptors
          enhancedPrompt = `${prompt}. Photorealistic quality, natural fluid motion, detailed textures, realistic lighting and shadows, cinematic depth, proper motion physics`;
        } else {
          // For more static scenes, focus on detail and realism
          enhancedPrompt = `${prompt}. Photorealistic quality, natural motion, detailed textures and materials, realistic lighting, natural depth of field`;
        }
      }
      
      console.log('Enhanced video prompt:', enhancedPrompt);
    } else if (model === VideoModel.LTX_VIDEO) {
      console.log('Generating video from image via LTX Video 13B');
      modelEndpoint = 'fal-ai/ltx-video-13b-distilled/image-to-video';
      // LTX model doesn't need prompt enhancement
      enhancedPrompt = prompt;
    }
    
    // Create input parameters based on the selected model
    const inputParams = model === VideoModel.MINIMAX_DIRECTOR 
      ? {
          prompt: enhancedPrompt,
          image_url: imageUrl,
          prompt_optimizer: true
        }
      : {
          prompt: enhancedPrompt,
          image_url: imageUrl
        };
    
    // Use the selected model endpoint
    const result = await fal.subscribe(modelEndpoint, {
      input: inputParams,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });
    
    // Extract the video URL from the response
    if (!result.data?.video?.url) {
      throw new Error('No video was generated');
    }
    
    return result.data.video.url;
  } catch (error) {
    console.error(`Error generating video from image with ${model}:`, error);
    throw error;
  }
};

/**
 * Generate an image using fal.ai Instant Character model for high-quality character images
 * @param prompt Text prompt for image generation
 * @param referenceImageUrl URL of the character reference image
 * @param apiKey fal.ai API key
 * @param options Additional generation options
 * @returns URL to the generated image
 */
export const generateInstantCharacterImage = async (
  prompt: string,
  referenceImageUrl: string,
  apiKey: string,
  options: {
    imageSize?: string | { width: number; height: number };
    scale?: number;
    negativePrompt?: string;
    numInferenceSteps?: number;
  } = {}
): Promise<string> => {
  if (!apiKey) {
    throw new Error('FAL.AI API key is required');
  }
  
  try {
    console.log('Generating high-quality character image via Instant Character model');
    
    // Configure the client with the API key
    fal.config({
      credentials: apiKey
    });
    
    // Set default options
    const scale = options.scale || 1;
    const imageSize = options.imageSize || "landscape_16_9";
    const negativePrompt = options.negativePrompt || "deformed, bad anatomy, disfigured, mutated, ugly, blurry";
    const numInferenceSteps = options.numInferenceSteps || 30;
    
    // Use the Instant Character model
    const result = await fal.subscribe('fal-ai/instant-character', {
      input: {
        prompt,
        image_url: referenceImageUrl,
        scale,
        image_size: imageSize,
        negative_prompt: negativePrompt,
        num_inference_steps: numInferenceSteps,
        num_images: 1,
        enable_safety_checker: true
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log("Processing image...");
          update.logs?.map((log) => log.message).forEach(console.log);
        }
      },
    });
    
    // Log the response for debugging
    console.log('Instant Character API response:', JSON.stringify(result, null, 2));
    
    // Extract the image URL from the response
    if (!result.data?.images || result.data.images.length === 0) {
      throw new Error('No images were generated');
    }
    
    return result.data.images[0].url;
  } catch (error) {
    console.error('Error generating character image with Instant Character:', error);
    throw error;
  }
};
