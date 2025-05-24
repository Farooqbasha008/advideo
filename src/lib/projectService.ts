
import { supabase } from '@/integrations/supabase/client';
import { TimelineItem } from '@/components/VideoEditor/VideoEditor';

export interface Project {
  id?: string;
  name: string;
  duration: number;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Save a project to Supabase
 */
export async function saveProject(
  projectName: string,
  timelineItems: TimelineItem[],
  duration: number
): Promise<{ project: Project; success: boolean; error?: string }> {
  try {
    // First, check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        project: { name: projectName, duration },
        success: false,
        error: 'User not authenticated. Project saved locally only.'
      };
    }
    
    // Insert or update project
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: projectName,
        duration,
        user_id: user.id
      })
      .select()
      .single();
      
    if (projectError) throw projectError;
    
    // Add timeline items
    if (timelineItems.length > 0) {
      const timelineItemsToInsert = timelineItems.map(item => ({
        project_id: projectData.id,
        name: item.name,
        item_type: item.type,
        track_id: item.trackId,
        start: item.start,
        duration: item.duration,
        color: item.color,
        src: item.src,
        thumbnail: item.thumbnail,
        volume: item.volume || 1
      }));
      
      const { error: timelineError } = await supabase
        .from('timeline_items')
        .insert(timelineItemsToInsert);
        
      if (timelineError) throw timelineError;
    }
    
    return {
      project: projectData,
      success: true
    };
  } catch (error) {
    console.error('Error saving project:', error);
    return {
      project: { name: projectName, duration },
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error saving project'
    };
  }
}

/**
 * Load a project from Supabase
 */
export async function loadProject(projectId: string): Promise<{
  project: Project | null;
  timelineItems: TimelineItem[];
  success: boolean;
  error?: string;
}> {
  try {
    // Get project details
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
      
    if (projectError) throw projectError;
    
    // Get timeline items
    const { data: timelineItemsData, error: timelineError } = await supabase
      .from('timeline_items')
      .select('*')
      .eq('project_id', projectId);
      
    if (timelineError) throw timelineError;
    
    // Convert to TimelineItem format
    const timelineItems: TimelineItem[] = timelineItemsData.map(item => ({
      id: item.id,
      trackId: item.track_id,
      start: item.start,
      duration: item.duration,
      type: item.item_type as 'video' | 'audio' | 'image',
      name: item.name,
      color: item.color || '#3498db',
      src: item.src,
      thumbnail: item.thumbnail,
      volume: item.volume
    }));
    
    return {
      project: projectData,
      timelineItems,
      success: true
    };
  } catch (error) {
    console.error('Error loading project:', error);
    return {
      project: null,
      timelineItems: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error loading project'
    };
  }
}

/**
 * Get all projects for the current user
 */
export async function getUserProjects(): Promise<{
  projects: Project[];
  success: boolean;
  error?: string;
}> {
  try {
    // First, check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        projects: [],
        success: false,
        error: 'User not authenticated'
      };
    }
    
    // Get all projects for the user
    const { data: projectsData, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
      
    if (error) throw error;
    
    return {
      projects: projectsData,
      success: true
    };
  } catch (error) {
    console.error('Error getting user projects:', error);
    return {
      projects: [],
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error getting projects'
    };
  }
}

/**
 * Save user preferences
 */
export async function saveUserPreferences({
  theme,
  defaultVolume,
  timelineScale
}: {
  theme?: string;
  defaultVolume?: number;
  timelineScale?: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // First, check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }
    
    // Check if user preferences already exist
    const { data: existing } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();
      
    const payload = {
      user_id: user.id,
      theme,
      default_volume: defaultVolume,
      timeline_scale: timelineScale
    };
    
    let error;
    
    if (existing) {
      // Update existing preferences
      const { error: updateError } = await supabase
        .from('user_preferences')
        .update(payload)
        .eq('user_id', user.id);
        
      error = updateError;
    } else {
      // Insert new preferences
      const { error: insertError } = await supabase
        .from('user_preferences')
        .insert(payload);
        
      error = insertError;
    }
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Error saving user preferences:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error saving preferences'
    };
  }
}

/**
 * Load user preferences
 */
export async function getUserPreferences(): Promise<{
  preferences: {
    theme?: string;
    defaultVolume?: number;
    timelineScale?: number;
  };
  success: boolean;
  error?: string;
}> {
  try {
    // First, check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        preferences: {},
        success: false,
        error: 'User not authenticated'
      };
    }
    
    // Get user preferences
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error;
    
    return {
      preferences: data ? {
        theme: data.theme,
        defaultVolume: data.default_volume,
        timelineScale: data.timeline_scale
      } : {},
      success: true
    };
  } catch (error) {
    console.error('Error loading user preferences:', error);
    return {
      preferences: {},
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error loading preferences'
    };
  }
}
