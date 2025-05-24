/**
 * Voice descriptions for Groq Cloud TTS voices
 * This file contains detailed descriptions of each voice to help users select the most appropriate voice for their content.
 */

export interface VoiceDescription {
  id: string;
  name: string;
  description: string;
  gender: 'male' | 'female' | 'neutral';
  ageGroup: 'child' | 'young' | 'adult' | 'senior';
  characteristics: string[];
  suitableFor: string[];
}

export const VOICE_DESCRIPTIONS: VoiceDescription[] = [
  {
    id: 'Aaliyah',
    name: 'Aaliyah',
    description: 'Warm and friendly female voice with a slight accent. Clear articulation with a gentle tone.',
    gender: 'female',
    ageGroup: 'adult',
    characteristics: ['warm', 'friendly', 'clear', 'gentle'],
    suitableFor: ['narration', 'educational content', 'customer service']
  },
  {
    id: 'Adelaide',
    name: 'Adelaide',
    description: 'Sophisticated female voice with a refined accent. Elegant and articulate with excellent pronunciation.',
    gender: 'female',
    ageGroup: 'adult',
    characteristics: ['sophisticated', 'refined', 'elegant', 'articulate'],
    suitableFor: ['luxury brand content', 'documentaries', 'formal presentations']
  },
  {
    id: 'Angelo',
    name: 'Angelo',
    description: 'Deep and resonant male voice with a confident tone. Authoritative with clear enunciation.',
    gender: 'male',
    ageGroup: 'adult',
    characteristics: ['deep', 'resonant', 'confident', 'authoritative'],
    suitableFor: ['corporate videos', 'announcements', 'documentary narration']
  },
  {
    id: 'Arista',
    name: 'Arista',
    description: 'Bright and energetic female voice with a modern sound. Enthusiastic and engaging.',
    gender: 'female',
    ageGroup: 'young',
    characteristics: ['bright', 'energetic', 'modern', 'enthusiastic'],
    suitableFor: ['advertisements', 'social media content', 'product demonstrations']
  },
  {
    id: 'Atlas',
    name: 'Atlas',
    description: 'Strong and commanding male voice with a deep resonance. Serious and authoritative.',
    gender: 'male',
    ageGroup: 'adult',
    characteristics: ['strong', 'commanding', 'deep', 'serious'],
    suitableFor: ['movie trailers', 'dramatic narration', 'action sequences']
  },
  {
    id: 'Basil',
    name: 'Basil',
    description: 'Warm and conversational male voice with a slight British accent. Friendly and approachable.',
    gender: 'male',
    ageGroup: 'adult',
    characteristics: ['warm', 'conversational', 'British', 'friendly'],
    suitableFor: ['audiobooks', 'podcasts', 'educational content']
  },
  {
    id: 'Briggs',
    name: 'Briggs',
    description: 'Rugged and mature male voice with character. Distinctive and memorable with a slight rasp.',
    gender: 'male',
    ageGroup: 'adult',
    characteristics: ['rugged', 'mature', 'distinctive', 'raspy'],
    suitableFor: ['character voiceovers', 'rugged commercials', 'nature documentaries']
  },
  {
    id: 'Calum',
    name: 'Calum',
    description: 'Youthful and energetic male voice with a contemporary sound. Casual and relatable.',
    gender: 'male',
    ageGroup: 'young',
    characteristics: ['youthful', 'energetic', 'contemporary', 'casual'],
    suitableFor: ['youth-oriented content', 'gaming videos', 'casual explainers']
  },
  {
    id: 'Celeste',
    name: 'Celeste',
    description: 'Ethereal and soothing female voice with a melodic quality. Calming and pleasant.',
    gender: 'female',
    ageGroup: 'adult',
    characteristics: ['ethereal', 'soothing', 'melodic', 'calming'],
    suitableFor: ['meditation guides', 'relaxation content', 'bedtime stories']
  },
  {
    id: 'Cheyenne',
    name: 'Cheyenne',
    description: 'Vibrant and expressive female voice with a youthful energy. Dynamic and engaging.',
    gender: 'female',
    ageGroup: 'young',
    characteristics: ['vibrant', 'expressive', 'youthful', 'dynamic'],
    suitableFor: ['children\'s content', 'animated videos', 'upbeat presentations']
  },
  {
    id: 'Chip',
    name: 'Chip',
    description: 'Friendly and approachable male voice with a casual tone. Conversational and relatable.',
    gender: 'male',
    ageGroup: 'adult',
    characteristics: ['friendly', 'approachable', 'casual', 'conversational'],
    suitableFor: ['explainer videos', 'tutorials', 'casual presentations']
  },
  {
    id: 'Cillian',
    name: 'Cillian',
    description: 'Smooth and sophisticated male voice with a slight Irish accent. Charming and articulate.',
    gender: 'male',
    ageGroup: 'adult',
    characteristics: ['smooth', 'sophisticated', 'Irish', 'charming'],
    suitableFor: ['luxury brand content', 'storytelling', 'historical documentaries']
  },
  {
    id: 'Deedee',
    name: 'Deedee',
    description: 'Cheerful and bubbly female voice with a bright tone. Enthusiastic and uplifting.',
    gender: 'female',
    ageGroup: 'young',
    characteristics: ['cheerful', 'bubbly', 'bright', 'enthusiastic'],
    suitableFor: ['children\'s content', 'upbeat commercials', 'positive announcements']
  },
  {
    id: 'Eleanor',
    name: 'Eleanor',
    description: 'Elegant and mature female voice with a refined quality. Sophisticated and authoritative.',
    gender: 'female',
    ageGroup: 'adult',
    characteristics: ['elegant', 'mature', 'refined', 'sophisticated'],
    suitableFor: ['corporate presentations', 'luxury brand content', 'formal narration']
  },
  {
    id: 'Fritz',
    name: 'Fritz',
    description: 'Clear and professional male voice with excellent articulation. Neutral and versatile.',
    gender: 'male',
    ageGroup: 'adult',
    characteristics: ['clear', 'professional', 'articulate', 'neutral'],
    suitableFor: ['business presentations', 'instructional content', 'general narration']
  },
  {
    id: 'Gail',
    name: 'Gail',
    description: 'Warm and motherly female voice with a nurturing quality. Comforting and trustworthy.',
    gender: 'female',
    ageGroup: 'adult',
    characteristics: ['warm', 'motherly', 'nurturing', 'comforting'],
    suitableFor: ['family-oriented content', 'healthcare information', 'comforting narratives']
  },
  {
    id: 'Indigo',
    name: 'Indigo',
    description: 'Smooth and calming gender-neutral voice with a modern sound. Balanced and inclusive.',
    gender: 'neutral',
    ageGroup: 'adult',
    characteristics: ['smooth', 'calming', 'modern', 'balanced'],
    suitableFor: ['inclusive content', 'modern presentations', 'mindfulness guides']
  },
  {
    id: 'Jennifer',
    name: 'Jennifer',
    description: 'Professional and clear female voice with a confident tone. Articulate and trustworthy.',
    gender: 'female',
    ageGroup: 'adult',
    characteristics: ['professional', 'clear', 'confident', 'articulate'],
    suitableFor: ['business presentations', 'news reading', 'informational content']
  },
  {
    id: 'Judy',
    name: 'Judy',
    description: 'Friendly and approachable female voice with a warm tone. Conversational and relatable.',
    gender: 'female',
    ageGroup: 'adult',
    characteristics: ['friendly', 'approachable', 'warm', 'conversational'],
    suitableFor: ['customer service messages', 'casual explainers', 'friendly tutorials']
  },
  {
    id: 'Mamaw',
    name: 'Mamaw',
    description: 'Warm and elderly female voice with a grandmotherly quality. Comforting and wise.',
    gender: 'female',
    ageGroup: 'senior',
    characteristics: ['warm', 'elderly', 'grandmotherly', 'wise'],
    suitableFor: ['storytelling', 'nostalgic content', 'comforting narratives']
  },
  {
    id: 'Mason',
    name: 'Mason',
    description: 'Strong and confident male voice with a modern sound. Clear and professional.',
    gender: 'male',
    ageGroup: 'adult',
    characteristics: ['strong', 'confident', 'modern', 'professional'],
    suitableFor: ['corporate videos', 'product demonstrations', 'professional presentations']
  },
  {
    id: 'Mikail',
    name: 'Mikail',
    description: 'Deep and authoritative male voice with a multicultural accent. Commanding and distinctive.',
    gender: 'male',
    ageGroup: 'adult',
    characteristics: ['deep', 'authoritative', 'multicultural', 'commanding'],
    suitableFor: ['international content', 'authoritative presentations', 'documentary narration']
  },
  {
    id: 'Mitch',
    name: 'Mitch',
    description: 'Casual and relatable male voice with a friendly tone. Conversational and approachable.',
    gender: 'male',
    ageGroup: 'adult',
    characteristics: ['casual', 'relatable', 'friendly', 'conversational'],
    suitableFor: ['casual explainers', 'everyday tutorials', 'friendly presentations']
  },
  {
    id: 'Nia',
    name: 'Nia',
    description: 'Smooth and confident female voice with a modern sound. Professional and articulate.',
    gender: 'female',
    ageGroup: 'adult',
    characteristics: ['smooth', 'confident', 'modern', 'professional'],
    suitableFor: ['business presentations', 'professional narration', 'corporate content']
  },
  {
    id: 'Quinn',
    name: 'Quinn',
    description: 'Youthful and energetic gender-neutral voice with a contemporary sound. Fresh and engaging.',
    gender: 'neutral',
    ageGroup: 'young',
    characteristics: ['youthful', 'energetic', 'contemporary', 'fresh'],
    suitableFor: ['youth-oriented content', 'modern presentations', 'social media content']
  },
  {
    id: 'Ruby',
    name: 'Ruby',
    description: 'Warm and friendly female voice with a slight rasp. Distinctive and characterful.',
    gender: 'female',
    ageGroup: 'adult',
    characteristics: ['warm', 'friendly', 'raspy', 'distinctive'],
    suitableFor: ['character voiceovers', 'storytelling', 'distinctive narration']
  },
  {
    id: 'Thunder',
    name: 'Thunder',
    description: 'Deep and powerful male voice with a dramatic quality. Intense and commanding.',
    gender: 'male',
    ageGroup: 'adult',
    characteristics: ['deep', 'powerful', 'dramatic', 'intense'],
    suitableFor: ['movie trailers', 'dramatic announcements', 'action content']
  }
];

/**
 * Get a voice description by ID
 * @param id The voice ID to look up
 * @returns The voice description or undefined if not found
 */
export function getVoiceDescription(id: string): VoiceDescription | undefined {
  return VOICE_DESCRIPTIONS.find(voice => voice.id === id);
}

/**
 * Get a formatted description string for a voice
 * @param id The voice ID to look up
 * @returns A formatted description string or a default message if voice not found
 */
export function getFormattedVoiceDescription(id: string): string {
  const voice = getVoiceDescription(id);
  if (!voice) return 'Voice description not available';
  
  return `${voice.name}: ${voice.description} Best for: ${voice.suitableFor.join(', ')}.`;
}

/**
 * Find voices suitable for specific content types
 * @param contentType The type of content to find voices for
 * @returns An array of voice descriptions suitable for the content type
 */
export function findVoicesForContent(contentType: string): VoiceDescription[] {
  return VOICE_DESCRIPTIONS.filter(voice => 
    voice.suitableFor.some(type => 
      type.toLowerCase().includes(contentType.toLowerCase())
    )
  );
}

/**
 * Get voice recommendations based on text content
 * @param text The text content to analyze
 * @returns An array of recommended voices with reasons
 */
export function getVoiceRecommendations(text: string): Array<{voice: VoiceDescription, reason: string}> {
  const recommendations: Array<{voice: VoiceDescription, reason: string}> = [];
  const textLower = text.toLowerCase();
  
  // Check for content types in the text
  const contentTypes = [
    { type: 'story', keywords: ['once upon a time', 'story', 'tale', 'adventure', 'journey'] },
    { type: 'business', keywords: ['company', 'business', 'professional', 'corporate', 'industry'] },
    { type: 'educational', keywords: ['learn', 'education', 'study', 'course', 'tutorial', 'guide'] },
    { type: 'children', keywords: ['child', 'kid', 'young', 'play', 'fun', 'colorful'] },
    { type: 'dramatic', keywords: ['dramatic', 'intense', 'action', 'exciting', 'thriller'] },
    { type: 'calm', keywords: ['calm', 'relax', 'peaceful', 'soothing', 'gentle', 'meditation'] }
  ];
  
  // Find matching content types
  const matchedTypes = contentTypes.filter(ct => 
    ct.keywords.some(keyword => textLower.includes(keyword))
  );
  
  // Get voice recommendations based on content types
  matchedTypes.forEach(ct => {
    const voices = findVoicesForContent(ct.type);
    voices.forEach(voice => {
      if (!recommendations.some(r => r.voice.id === voice.id)) {
        recommendations.push({
          voice,
          reason: `Good match for ${ct.type} content`
        });
      }
    });
  });
  
  // If no specific recommendations, add some general ones based on text length and complexity
  if (recommendations.length === 0) {
    // For short texts, recommend clear and concise voices
    if (text.length < 100) {
      const clearVoices = VOICE_DESCRIPTIONS.filter(v => 
        v.characteristics.includes('clear') || v.characteristics.includes('articulate')
      );
      clearVoices.slice(0, 3).forEach(voice => {
        recommendations.push({
          voice,
          reason: 'Good for short, clear messages'
        });
      });
    } 
    // For longer texts, recommend engaging voices
    else {
      const engagingVoices = VOICE_DESCRIPTIONS.filter(v => 
        v.characteristics.includes('engaging') || v.characteristics.includes('warm')
      );
      engagingVoices.slice(0, 3).forEach(voice => {
        recommendations.push({
          voice,
          reason: 'Good for longer content that needs to maintain engagement'
        });
      });
    }
  }
  
  // Limit to top 3 recommendations
  return recommendations.slice(0, 3);
}