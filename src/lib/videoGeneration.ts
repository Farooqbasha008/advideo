export interface StoryboardScene {
  shotType: 'wide' | 'medium' | 'close-up';
  cameraMovement: 'static' | 'pan' | 'tilt' | 'tracking';
  environmentType: 'interior' | 'exterior';
  timeOfDay: 'day' | 'night' | 'dawn' | 'dusk';
  lightingConditions: string;
  visualContinuity: {
    colorPalette: string;
    atmosphericConditions: string;
    locationConsistency: string;
  };
}

export interface Character {
  id: string;
  description: string;
  visualAttributes: {
    gender: string;
    ageRange: string;
    bodyType: string;
    clothing: string;
    distinctiveFeatures: string;
  };
  shotGuidelines: {
    preferredAngles: string[];
    avoidedAngles: string[];
    minimumShotSize: 'wide' | 'medium' | 'close-up';
  };
}

export const sceneGenerationRules = {
  characters: {
    do: [
      "Show characters from medium or wide shots",
      "Focus on body language and gestures",
      "Use silhouettes and creative angles",
      "Emphasize environment interaction",
      "Use symbolic representation"
    ],
    dont: [
      "Avoid direct face close-ups",
      "Avoid complex character interactions",
      "Avoid rapid character movements",
      "Avoid detailed facial expressions",
      "Avoid multiple characters in close proximity"
    ]
  },
  environments: {
    do: [
      "Use establishing shots",
      "Maintain consistent lighting",
      "Keep key environmental elements constant",
      "Use atmospheric effects for continuity",
      "Create depth with layered elements"
    ],
    dont: [
      "Avoid complex dynamic environments",
      "Avoid drastic lighting changes",
      "Avoid busy backgrounds",
      "Avoid rapid scene transitions",
      "Avoid inconsistent weather conditions"
    ]
  }
};

export const generateEnhancedPrompt = (
  scene: StoryboardScene, 
  style: string,
  characters?: Character[]
): string => {
  const characterGuidelines = characters?.map(char => `
    Character ${char.id}: 
    ${char.description}, 
    shown from ${char.shotGuidelines.minimumShotSize} shot or wider,
    wearing ${char.visualAttributes.clothing}
  `).join('\n') || '';

  return `
    ${scene.environmentType === 'interior' ? 'Interior' : 'Exterior'} scene, 
    ${scene.timeOfDay}, 
    ${scene.shotType} shot,
    Camera: ${scene.cameraMovement} movement,
    
    Environment: Clean, simple setting with ${scene.lightingConditions} lighting,
    Color palette: ${scene.visualContinuity.colorPalette},
    Atmosphere: ${scene.visualContinuity.atmosphericConditions},
    
    ${characterGuidelines}
    
    Subject positioning: Rule of thirds, ${scene.shotType === 'wide' ? 'clear silhouette' : 'medium framing'},
    Movement: Slow, deliberate, controlled,
    
    Style: ${style}, cinematic quality, 8K resolution,
    Technical: Shallow depth of field, slight film grain,
    
    Negative prompt: close-up faces, rapid movements, complex backgrounds, inconsistent lighting
  `.trim();
};

export const maintainContinuity = (
  currentScene: StoryboardScene,
  previousScene?: StoryboardScene
): StoryboardScene['visualContinuity'] => {
  if (!previousScene) {
    return currentScene.visualContinuity;
  }

  return {
    colorPalette: previousScene.visualContinuity.colorPalette,
    atmosphericConditions: 
      currentScene.environmentType === previousScene.environmentType 
        ? previousScene.visualContinuity.atmosphericConditions 
        : currentScene.visualContinuity.atmosphericConditions,
    locationConsistency: 
      currentScene.environmentType === previousScene.environmentType 
        ? previousScene.visualContinuity.locationConsistency 
        : `Transitioning from ${previousScene.environmentType} to ${currentScene.environmentType}`
  };
};

export const determineShotType = (
  sceneIndex: number,
  totalScenes: number
): 'wide' | 'medium' | 'close-up' => {
  // Start with establishing shot
  if (sceneIndex === 0) return 'wide';
  
  // End with wider context
  if (sceneIndex === totalScenes - 1) return 'medium';
  
  // Alternate between medium and wide shots for variety
  // Avoid close-ups due to AI limitations with faces
  return sceneIndex % 2 === 0 ? 'medium' : 'wide';
};

export const planCameraMovement = (
  shotType: string,
  previousMovement?: string
): 'static' | 'pan' | 'tilt' | 'tracking' => {
  // Avoid consecutive similar movements
  if (previousMovement === 'pan') return 'static';
  if (previousMovement === 'tracking') return 'static';
  
  // Choose appropriate movement for shot type
  switch (shotType) {
    case 'wide':
      return 'pan';
    case 'medium':
      return 'tracking';
    default:
      return 'static';
  }
};

export const createEnvironmentProfile = (
  scenes: StoryboardScene[]
): { [key: string]: any } => {
  return {
    mainPalette: scenes[0].visualContinuity.colorPalette,
    timeProgression: scenes.map(scene => scene.timeOfDay),
    weatherConditions: scenes[0].visualContinuity.atmosphericConditions,
    lightingStyle: scenes[0].lightingConditions
  };
};

export interface EnhancedVideoOptions {
  negativePrompt?: string;
  cfg_scale?: number;
  num_inference_steps?: number;
  seed?: number;
}