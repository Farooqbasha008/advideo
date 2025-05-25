import { Character } from './videoGeneration';
import { StoryboardScene } from './videoGeneration';

/**
 * Enhanced character interface with additional traits for consistency
 */
export interface EnhancedCharacter extends Character {
  traits?: {
    personality: string[];
    speechPattern: string;
    gestureStyle: string;
    facialExpressions: string[];
    mannerisms: string[];
  };
  referenceImageUrl?: string;
}

/**
 * Generate a prompt segment that helps maintain character consistency
 * @param character The character to describe
 * @param sceneContext The context of the scene
 * @returns A prompt segment for character consistency
 */
export const createCharacterConsistencyPrompt = (
  character: EnhancedCharacter,
  sceneContext: string
): string => {
  let prompt = `Character ${character.description}: `;
  
  if (character.visualAttributes) {
    prompt += `${character.visualAttributes.gender || ''} ${character.visualAttributes.ageRange || ''}, `;
    prompt += `wearing ${character.visualAttributes.clothing || 'casual clothing'}, `;
    
    if (character.visualAttributes.distinctiveFeatures) {
      prompt += `with distinctive features: ${character.visualAttributes.distinctiveFeatures}. `;
    }
  }
  
  if (character.traits) {
    if (character.traits.personality && character.traits.personality.length > 0) {
      prompt += `Personality: ${character.traits.personality.join(', ')}. `;
    }
    
    if (character.traits.gestureStyle) {
      prompt += `Uses ${character.traits.gestureStyle} gestures. `;
    }
    
    if (character.traits.facialExpressions && character.traits.facialExpressions.length > 0) {
      prompt += `Facial expressions: ${character.traits.facialExpressions.join(', ')}. `;
    }
  }
  
  return prompt;
};

/**
 * Convert storyboard parameters to camera movement instructions for MiniMax
 * @param scene The storyboard scene
 * @returns Camera movement instructions formatted for MiniMax
 */
export const getCameraInstructionFromStoryboard = (scene: StoryboardScene): string => {
  // Map camera movements to MiniMax Director instructions
  const cameraMap: Record<string, string> = {
    'static': 'Static shot',
    'pan': 'Pan right',
    'tilt': 'Tilt up',
    'tracking': 'Follow'
  };
  
  // Get the base camera movement
  const baseMovement = cameraMap[scene.cameraMovement] || 'Static shot';
  
  // Add secondary movement based on shot type
  let secondaryMovement = '';
  if (scene.shotType === 'close-up') {
    secondaryMovement = ', Push in';
  } else if (scene.shotType === 'wide') {
    secondaryMovement = ', Pull out';
  }
  
  return `${baseMovement}${secondaryMovement}`;
}; 