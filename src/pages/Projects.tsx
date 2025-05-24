
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { getUserProjects } from '@/lib/projectService';
import { ArrowLeft, Clock, Film, MoreVertical, Loader2, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  
  // Check authentication status on load
  React.useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
      }
    };
    
    checkUser();
    
    // Subscribe to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  
  // Fetch projects
  const { data: projectsData, isLoading, error, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: getUserProjects,
    enabled: !!user,
  });
  
  const deleteProject = async (projectId: string) => {
    try {
      // First delete associated timeline items
      const { error: timelineError } = await supabase
        .from('timeline_items')
        .delete()
        .eq('project_id', projectId);
        
      if (timelineError) throw timelineError;
      
      // Then delete the project
      const { error: projectError } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);
        
      if (projectError) throw projectError;
      
      toast.success('Project deleted');
      refetch();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };
  
  return (
    <div className="min-h-screen bg-[#151514] text-[#F7F8F6]">
      <header className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center">
          <Link to="/" className="mr-4">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-[#D7F266]">My Projects</h1>
        </div>
        <Button 
          className="bg-[#D7F266] hover:bg-[#D7F266]/90 text-[#151514]"
          onClick={() => navigate('/editor')}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </header>
      
      <main className="container max-w-7xl mx-auto py-8 px-4">
        {!user ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-[#242423] p-8 rounded-lg border border-white/10 max-w-md">
              <h2 className="text-xl font-bold mb-4">Sign in to view your projects</h2>
              <p className="text-white/70 mb-6">
                Create an account or sign in to save and access your video projects from anywhere.
              </p>
              <Button 
                className="bg-[#D7F266] hover:bg-[#D7F266]/90 text-[#151514]"
                onClick={() => navigate('/editor')}
              >
                Continue to Editor
              </Button>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#D7F266]" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400">Error loading projects</p>
            <Button 
              variant="outline" 
              className="mt-4 border-white/20"
              onClick={() => refetch()}
            >
              Try Again
            </Button>
          </div>
        ) : projectsData?.projects && projectsData.projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projectsData.projects.map((project) => (
              <Card key={project.id} className="bg-[#242423] border-white/10">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-[#F7F8F6]">{project.name}</CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-[#242423] border-white/10 text-[#F7F8F6]">
                        <DropdownMenuItem 
                          className="cursor-pointer hover:bg-[#333333]"
                          onClick={() => {
                            if (project.id) {
                              deleteProject(project.id);
                            }
                          }}
                        >
                          Delete Project
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardDescription className="text-white/50 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {project.created_at ? formatDistanceToNow(new Date(project.created_at), { addSuffix: true }) : 'Unknown date'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-[#151514] rounded-md flex items-center justify-center">
                    <Film className="h-10 w-10 text-white/20" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full bg-[#D7F266] hover:bg-[#D7F266]/90 text-[#151514]"
                    onClick={() => {
                      navigate(`/editor/${project.id}`);
                    }}
                  >
                    Open Project
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-[#242423] p-8 rounded-lg border border-white/10 max-w-md">
              <h2 className="text-xl font-bold mb-4">No projects yet</h2>
              <p className="text-white/70 mb-6">
                Create your first video project to get started.
              </p>
              <Button 
                className="bg-[#D7F266] hover:bg-[#D7F266]/90 text-[#151514]"
                onClick={() => navigate('/editor')}
              >
                Create New Project
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProjectsPage;
