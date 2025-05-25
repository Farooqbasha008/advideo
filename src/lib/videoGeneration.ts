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
): StoryboardScene['shotType'] => {
  // For the first scene, establish with a wide shot
  if (sceneIndex === 0) {
    return 'wide';
  }
  
  // For the last scene, end with either wide for conclusive feel or close-up for impact
  if (sceneIndex === totalScenes - 1) {
    // For commercial videos, ending with close-up is often more effective for CTA
    return 'close-up';
  }
  
  // For dramatic moments or key product reveals, use close-up
  if (sceneIndex % 3 === 0) { // Every third scene for variety
    return 'close-up';
  }
  
  // For transitions and secondary information, use medium shots
  if (sceneIndex % 2 === 0) {
    return 'medium';
  }
  
  // Default to wide shot for other scenes
  return 'wide';
};

export const planCameraMovement = (
  shotType: StoryboardScene['shotType'],
  previousMovement?: StoryboardScene['cameraMovement']
): StoryboardScene['cameraMovement'] => {
  // Avoid jarring transitions from one movement type to another
  if (previousMovement === 'tracking' || previousMovement === 'pan') {
    return 'static'; // Rest after a dynamic shot
  }
  
  // Close-ups work well with static or slight movements
  if (shotType === 'close-up') {
    return Math.random() > 0.7 ? 'static' : 'tilt';
  }
  
  // Wide shots work well with panning to showcase environment
  if (shotType === 'wide') {
    return Math.random() > 0.5 ? 'pan' : 'static';
  }
  
  // Medium shots can handle tracking shots for following action
  if (shotType === 'medium') {
    return Math.random() > 0.6 ? 'tracking' : 'static';
  }
  
  return 'static';
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

export const generateScenePrompt = (
  sceneDescription: string,
  storyboardParams: StoryboardScene
): string => {
  return `${sceneDescription}
  Shot type: ${storyboardParams.shotType}. 
  Camera movement: ${storyboardParams.cameraMovement}. 
  ${storyboardParams.environmentType} scene during ${storyboardParams.timeOfDay}
  with ${storyboardParams.lightingConditions}.
  Visual style: ${storyboardParams.visualContinuity.colorPalette}.
  ${storyboardParams.visualContinuity.atmosphericConditions}.
  `
};

export const enhancePromptWithVisualGuidelines = (
  basePrompt: string,
  storyboard: StoryboardScene
): string => {
  return `${basePrompt.trim()}. ${storyboard.shotType} shot with ${storyboard.cameraMovement} camera movement. ${storyboard.environmentType} setting during ${storyboard.timeOfDay} with ${storyboard.lightingConditions}. Visual style: ${storyboard.visualContinuity.colorPalette}`;
};

export const getShotRecommendations = (
  purpose: 'product' | 'service' | 'brand' | 'testimonial'
): Array<{ type: string; description: string }> => {
  switch (purpose) {
    case 'product':
      return [
        { type: 'close-up', description: 'Show product details and features' },
        { type: 'medium', description: 'Show product in use by customer' },
        { type: 'wide', description: 'Show product in context or environment' }
      ];
    case 'service':
      return [
        { type: 'medium', description: 'Focus on service provider and customer interaction' },
        { type: 'wide', description: 'Show service environment and atmosphere' },
        { type: 'close-up', description: 'Show customer reactions and satisfaction' }
      ];
    case 'brand':
      return [
        { type: 'wide', description: 'Establish brand presence and scale' },
        { type: 'medium', description: 'Show brand values through actions' },
        { type: 'close-up', description: 'Highlight brand details and craftsmanship' }
      ];
    case 'testimonial':
      return [
        { type: 'medium', description: 'Frame speaker with comfortable headroom' },
        { type: 'close-up', description: 'Show emotional expressions and reactions' },
        { type: 'wide', description: 'Show speaker in relevant environment' }
      ];
    default:
      return [
        { type: 'balanced', description: 'Mix of shot types for visual variety' },
        { type: 'dynamic', description: 'Incorporate camera movement for energy' },
        { type: 'consistent', description: 'Maintain visual style across all scenes' }
      ];
  }
};