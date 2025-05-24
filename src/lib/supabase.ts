/**
 * Supabase client configuration and helper functions
 */
import { createClient } from '@supabase/supabase-js';
// Add to package.json: "@supabase/supabase-js": "^2.39.0"

// Initialize the Supabase client
export const supabaseClient = (supabaseUrl: string, supabaseKey: string) => {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL and key are required');
  }
  
  return createClient(supabaseUrl, supabaseKey);
};

/**
 * Save a video script project to Supabase
 * @param projectData The project data to save
 * @param userId The user ID (if authenticated)
 * @returns A Promise that resolves to the saved project data
 */
export async function saveProject(projectData: any, supabaseUrl: string, supabaseKey: string, userId?: string) {
  try {
    const supabase = supabaseClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
      .from('projects')
      .insert({
        title: projectData.title || 'Untitled Project',
        content: projectData,
        user_id: userId || null,
        created_at: new Date().toISOString(),
      })
      .select();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving project to Supabase:', error);
    throw error;
  }
}

/**
 * Get all projects for a user from Supabase
 * @param userId The user ID (if authenticated)
 * @returns A Promise that resolves to the user's projects
 */
export async function getUserProjects(supabaseUrl: string, supabaseKey: string, userId?: string) {
  try {
    const supabase = supabaseClient(supabaseUrl, supabaseKey);
    
    let query = supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting projects from Supabase:', error);
    throw error;
  }
}