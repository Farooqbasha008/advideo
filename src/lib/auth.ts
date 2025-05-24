import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useAuth = () => {
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error: any) {
      toast.error("Authentication failed", {
        description: error.message
      });
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      toast.error("Failed to sign out", {
        description: error.message
      });
      return { success: false, error: error.message };
    }
  };

  return {
    signIn,
    signOut
  };
}; 