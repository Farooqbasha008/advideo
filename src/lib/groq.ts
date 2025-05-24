import { generateSpeech } from './groqTTS';

/**
 * Groq API integration for LLM capabilities and script generation
 */

// Default model to use for LLM
const DEFAULT_LLM_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';
const DEFAULT_MODEL = 'qwen-qwq-32b'; // Alternative model

/**
 * Script generation options
 */
export interface ScriptGenerationOptions {
  format?: 'openclap' | 'standard';
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

/**
 * Dialogue line in a script scene
 */
export interface DialogueLine {
  character: string;
  line: string;
}

/**
 * Scene in a generated script
 */
export interface ScriptScene {
  sceneNumber: number;
  setting: string;
  visualPrompt: string; // Detailed visual description for text-to-video
  audioDescription?: string; // Description for sound effects
  musicDescription?: string; // Description for background music
  dialogue: DialogueLine[];
}

/**
 * Complete generated script
 */
export interface GeneratedScript {
  title: string;
  logline: string;
  scenes: ScriptScene[];
}

/*
 * Interface for image generation parameters
 */
interface ImageGenerationParams {
  negativePrompt: string;
  steps: number;
  cfgScale: number;
}

// TTS functionality moved to groqTTS.ts
export { generateSpeech };
export type { SpeechGenerationOptions } from './groqTTS';

/**
 * Generate a script using Groq's LLM API
 * @param prompt The text prompt describing the video to generate
 * @param apiKey The Groq API key
 * @param options Additional options for script generation
 * @returns A Promise that resolves to a structured script
 */
export async function generateScript(
  prompt: string,
  apiKey: string,
  options: ScriptGenerationOptions = {}
): Promise<GeneratedScript> {
  if (!apiKey) {
    throw new Error('Groq API key is required');
  }

  const format = options.format || 'openclap';
  const temperature = options.temperature || 0.7;
  const maxTokens = options.maxTokens || 2048;
  const model = options.model || DEFAULT_LLM_MODEL;

  try {
    // Create the system prompt
    const systemPrompt = `You are a professional video script writer. Your task is to create detailed, production-ready scripts based on user prompts.`;
    
    // Create the user prompt
    const userPrompt = `Create a professional ${format === 'openclap' ? 'OpenClap format' : ''} script for a video with the following description: ${prompt}. 
    Include detailed visual descriptions for each scene that can be used for text-to-video generation.
    Also include audio descriptions for sound effects and music suggestions for each scene.`;
    
    // Make the API call to Groq
    const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: temperature,
        max_tokens: maxTokens
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse the response to extract the script
    return parseScriptFromResponse(content, format);
  } catch (error) {
    console.error('Error generating script with Groq:', error);
    throw error;
  }
}

/**
 * Generate a chat response using Groq's LLM API
 * @param messages Array of chat messages with roles and content
 * @param apiKey The Groq API key
 * @param systemPrompt Optional system prompt to guide the model
 * @param options Additional options for generation
 * @returns A Promise that resolves to the model's response text
 */
export async function generateChatResponse(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  apiKey: string,
  systemPrompt?: string,
  options: Omit<ScriptGenerationOptions, 'format'> = {}
): Promise<string> {
  if (!apiKey) {
    throw new Error('Groq API key is required');
  }

  const temperature = options.temperature || 0.7;
  const maxTokens = options.maxTokens || 4096;
  const model = options.model || DEFAULT_LLM_MODEL;

  try {
    // Prepare messages for the API call
    const apiMessages = [];
    
    // Add system message if provided
    if (systemPrompt) {
      apiMessages.push({
        role: 'system',
        content: systemPrompt
      });
    }
    
    // Add conversation history
    messages.filter(msg => msg.role !== 'system').forEach(msg => {
      apiMessages.push({
        role: msg.role,
        content: msg.content
      });
    });
    
    // Make the API call to Groq
    const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: apiMessages,
        temperature: temperature,
        max_tokens: maxTokens
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Groq API error: ${errorData || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating chat response with Groq:', error);
    throw error;
  }
}

/**
 * Get optimized parameters for image generation using Groq LLM
 * @param prompt The text prompt for image generation
 * @param dimensions The dimensions of the image (e.g., "512x512")
 * @param apiKey The Groq API key
 * @returns A Promise that resolves to optimized image generation parameters
 */
export async function getOptimizedParams(
  prompt: string,
  dimensions: string,
  apiKey: string,
  model: string = DEFAULT_MODEL
): Promise<ImageGenerationParams> {
  if (!apiKey) {
    // Return default parameters if no API key is provided
    return {
      negativePrompt: '',
      steps: 30,
      cfgScale: 7.5
    };
  }

  try {
    // Prepare the system message and user prompt for the LLM
    const systemMessage = "You are an AI assistant specialized in optimizing parameters for image generation. Based on the user's prompt and desired image dimensions, suggest the best parameters for stable diffusion image generation.";
    
    const userPrompt = `Given the following prompt: "${prompt}" and dimensions: ${dimensions}, provide the optimal parameters for image generation. Return only a JSON object with these fields: negativePrompt (string), steps (number between 20-50), and cfgScale (number between 5-10).`;

    // Make the API call to Groq
    const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse the JSON response from the LLM
    try {
      // Extract JSON object from the response if it's wrapped in text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;
      const params = JSON.parse(jsonStr);
      
      return {
        negativePrompt: params.negativePrompt || '',
        steps: Math.min(Math.max(params.steps || 30, 20), 50), // Ensure steps is between 20-50
        cfgScale: Math.min(Math.max(params.cfgScale || 7.5, 5), 10) // Ensure cfgScale is between 5-10
      };
    } catch (parseError) {
      console.error('Error parsing LLM response:', parseError);
      // Return default parameters if parsing fails
      return {
        negativePrompt: '',
        steps: 30,
        cfgScale: 7.5
      };
    }
  } catch (error) {
    console.error('Error calling Groq API:', error);
    // Return default parameters if API call fails
    return {
      negativePrompt: '',
      steps: 30,
      cfgScale: 7.5
    };
  }
}

/**
 * Parse a text response from Groq into a structured script
 * @param response The text response from Groq
 * @param format The script format
 * @returns A structured script object
 */
function parseScriptFromResponse(response: string, format: string): GeneratedScript {
  // This is a simplified parser that would need to be adapted based on the actual response format
  try {
    // First, try to parse as JSON if the response is in JSON format
    try {
      const jsonScript = JSON.parse(response);
      if (jsonScript.title && jsonScript.scenes) {
        return jsonScript as GeneratedScript;
      }
    } catch (jsonError) {
      // Not JSON, continue with text parsing
    }
    
    // Text-based parsing for non-JSON responses
    const lines = response.split('\n').filter(line => line.trim() !== '');
    
    // Extract title (usually the first line)
    const title = lines[0].replace(/^#\s*|Title:\s*/i, '').trim();
    
    // Extract logline (usually after title)
    let loglineIndex = lines.findIndex(line => 
      line.toLowerCase().includes('logline') || 
      line.toLowerCase().includes('description')
    );
    
    const logline = loglineIndex > 0 ? 
      lines[loglineIndex].replace(/^.*?:\s*/i, '').trim() : 
      'No logline provided';
    
    // Extract scenes
    const scenes: ScriptScene[] = [];
    let currentScene: Partial<ScriptScene> | null = null;
    let inDialogue = false;
    let currentDialogue: DialogueLine[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Scene header detection
      const sceneMatch = line.match(/^(SCENE|Scene|INT\/EXT)\s*(\d+)?\s*[:\-]?\s*(.*)$/i);
      if (sceneMatch || line.match(/^##+\s*Scene/i)) {
        // Save previous scene if exists
        if (currentScene && currentScene.sceneNumber !== undefined) {
          scenes.push({
            sceneNumber: currentScene.sceneNumber,
            setting: currentScene.setting || '',
            visualPrompt: currentScene.visualPrompt || '',
            audioDescription: currentScene.audioDescription,
            musicDescription: currentScene.musicDescription,
            dialogue: currentScene.dialogue || []
          });
        }
        
        // Start new scene
        currentScene = {
          sceneNumber: scenes.length + 1,
          setting: '',
          visualPrompt: '',
          dialogue: []
        };
        
        if (sceneMatch) {
          if (sceneMatch[2]) {
            currentScene.sceneNumber = parseInt(sceneMatch[2]);
          }
          currentScene.setting = sceneMatch[3] || '';
        }
        
        inDialogue = false;
        currentDialogue = [];
        continue;
      }
      
      if (!currentScene) {
        currentScene = {
          sceneNumber: 1,
          setting: '',
          visualPrompt: '',
          dialogue: []
        };
      }
      
      // Visual description
      if (line.match(/^(Visual|VISUAL|Visual Description|VISUAL DESCRIPTION):/i)) {
        currentScene.visualPrompt = line.replace(/^.*?:\s*/i, '').trim();
        continue;
      }
      
      // Audio description
      if (line.match(/^(Audio|AUDIO|Sound|SOUND|SFX|Sound Effects):/i)) {
        currentScene.audioDescription = line.replace(/^.*?:\s*/i, '').trim();
        continue;
      }
      
      // Music description
      if (line.match(/^(Music|MUSIC|Background Music|BACKGROUND MUSIC):/i)) {
        currentScene.musicDescription = line.replace(/^.*?:\s*/i, '').trim();
        continue;
      }
      
      // Dialogue detection
      const characterMatch = line.match(/^([A-Z][A-Z\s]+)(?:\(.*?\))?:\s*(.*)$/i);
      if (characterMatch) {
        inDialogue = true;
        currentDialogue.push({
          character: characterMatch[1].trim(),
          line: characterMatch[2].trim()
        });
        continue;
      }
      
      // Continue dialogue or description
      if (inDialogue && line && currentDialogue.length > 0) {
        // Append to the last dialogue line
        currentDialogue[currentDialogue.length - 1].line += ' ' + line;
      } else if (line && !line.startsWith('#') && !line.match(/^[A-Z]+:/i)) {
        // Append to visual description if not a header or specific label
        currentScene.visualPrompt = (currentScene.visualPrompt || '') + ' ' + line;
      }
    }
    
    // Add the last scene
    if (currentScene && currentScene.sceneNumber !== undefined) {
      if (currentDialogue.length > 0) {
        currentScene.dialogue = currentDialogue;
      }
      
      scenes.push({
        sceneNumber: currentScene.sceneNumber,
        setting: currentScene.setting || '',
        visualPrompt: currentScene.visualPrompt || '',
        audioDescription: currentScene.audioDescription,
        musicDescription: currentScene.musicDescription,
        dialogue: currentScene.dialogue || []
      });
    }
    
    return {
      title,
      logline,
      scenes
    };
  } catch (error) {
    console.error('Error parsing script from response:', error);
    // Return a minimal valid script structure
    return {
      title: 'Generated Script',
      logline: 'A script generated from the provided prompt.',
      scenes: [{
        sceneNumber: 1,
        setting: 'Default setting',
        visualPrompt: 'Default visual description',
        dialogue: []
      }]
    };
  }
}
