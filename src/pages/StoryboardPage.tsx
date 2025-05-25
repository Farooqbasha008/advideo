import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import StoryboardCanvas from '@/components/StoryboardCanvas';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ChevronLeft, Download, Save, Play, Wand2, Lightbulb, Sparkles } from 'lucide-react';
import { StoryboardScene } from '@/lib/videoGeneration';
import { ScriptScene } from '@/lib/types';
import { determineShotType, planCameraMovement, maintainContinuity } from '@/lib/videoGeneration';

interface StoryboardPageState {
  script: {
    title: string;
    logline: string;
    style: string;
    duration: string;
    scriptSummary: string;
    scenes: ScriptScene[];
  };
  storyboard?: StoryboardScene[];
}

const StoryboardPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get script data from navigation state
  const [scriptData, setScriptData] = useState<StoryboardPageState['script'] | null>(null);
  const [storyboard, setStoryboard] = useState<StoryboardScene[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<Record<number, string>>({});
  const [activeTab, setActiveTab] = useState<string>('storyboard');
  const [aiPrompt, setAiPrompt] = useState<string>('');
  
  // Initialize from location state
  useEffect(() => {
    if (location.state?.script) {
      setScriptData(location.state.script);
      
      // If storyboard is provided, use it
      if (location.state.storyboard && location.state.storyboard.length > 0) {
        setStoryboard(location.state.storyboard);
      } else {
        // Otherwise generate a new storyboard from script
        generateInitialStoryboard(location.state.script);
      }
    } else {
      // No script data provided, redirect to script generation
      toast.error("No script data found");
      navigate('/script-generation');
    }
  }, [location, navigate]);
  
  // Generate initial storyboard from script
  const generateInitialStoryboard = (script: StoryboardPageState['script']) => {
    if (!script || !script.scenes || script.scenes.length === 0) return;
    
    const newStoryboard = script.scenes.map((scene, index) => {
      const shotType = determineShotType(index, script.scenes.length);
      const previousScene = index > 0 ? storyboard[index - 1] : undefined;
      
      const storyboardScene: StoryboardScene = {
        shotType,
        cameraMovement: planCameraMovement(shotType, previousScene?.cameraMovement),
        environmentType: 'interior',
        timeOfDay: 'day',
        lightingConditions: 'Natural lighting with dramatic shadows',
        visualContinuity: {
          colorPalette: 'Natural, cinematic colors',
          atmosphericConditions: 'clear',
          locationConsistency: 'establishing'
        }
      };
      
      return storyboardScene;
    });
    
    setStoryboard(newStoryboard);
  };
  
  // Handle storyboard update
  const handleUpdateStoryboard = (newStoryboard: StoryboardScene[]) => {
    setStoryboard(newStoryboard);
  };
  
  // Generate preview for a scene
  const handleGeneratePreview = async (sceneIndex: number): Promise<string | null> => {
    if (!scriptData) return null;
    
    setIsLoading(true);
    
    try {
      // In a real implementation, this would call an AI image generation service
      // For now, we'll simulate with a placeholder image
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      
      const scene = scriptData.scenes[sceneIndex];
      const storyboardParams = storyboard[sceneIndex];
      
      // Construct a more detailed prompt based on script and storyboard parameters
      const enhancedPrompt = `${scene.textToVideoPrompt} 
      Shot type: ${storyboardParams.shotType}. 
      Camera movement: ${storyboardParams.cameraMovement}. 
      ${storyboardParams.environmentType} scene during ${storyboardParams.timeOfDay} 
      with ${storyboardParams.lightingConditions}. 
      Visual style: ${storyboardParams.visualContinuity.colorPalette}.`;
      
      // For demo, generate a placeholder image URL
      // In production, this would be the result of the AI image generation
      const imageUrl = `https://picsum.photos/seed/${encodeURIComponent(enhancedPrompt.substring(0, 20))}/800/450`;
      
      // Save the preview URL
      setPreviewUrls(prev => ({
        ...prev,
        [sceneIndex]: imageUrl
      }));
      
      return imageUrl;
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Failed to generate preview');
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle AI assistance for visual refinement
  const handleAiAssist = async () => {
    if (!aiPrompt) {
      toast.error('Please enter a prompt for AI assistance');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simulate API call to AI service
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Example response from AI (in production this would come from an actual API)
      const aiSuggestions = [
        "Try using low-angle shots for the product scenes to make them appear more dominant",
        "Consider a cooler color palette for the nighttime scenes to enhance the mood",
        "For the transition sequences, smooth tracking shots would create continuity",
        "Add subtle lens flare effects to highlight key product moments"
      ];
      
      const suggestionText = aiSuggestions.join('\n\n');
      
      toast.success('AI suggestions received', {
        description: 'Check the AI Assistant tab for details'
      });
      
      // Update AI prompt with suggestions
      setAiPrompt(prev => `${prev}\n\n--- AI SUGGESTIONS ---\n\n${suggestionText}`);
      
      // Switch to AI tab
      setActiveTab('ai');
      
    } catch (error) {
      toast.error('Failed to get AI assistance');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle download of storyboard
  const handleDownload = () => {
    if (!scriptData) return;
    
    const downloadData = {
      script: scriptData,
      storyboard: storyboard
    };
    
    const blob = new Blob([JSON.stringify(downloadData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scriptData.title.replace(/\s+/g, '_')}_storyboard.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Storyboard downloaded');
  };
  
  // Continue to video editor
  const handleContinueToEditor = () => {
    navigate('/editor', {
      state: {
        script: scriptData,
        storyboard: storyboard
      }
    });
  };
  
  // Go back to script generation
  const handleBackToScript = () => {
    navigate('/script-generation', {
      state: {
        returnWithStoryboard: true,
        script: scriptData,
        storyboard: storyboard
      }
    });
  };
  
  if (!scriptData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0E0E0E]">
        <p className="text-white">Loading...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#1A1A1A]">
        <div className="container mx-auto py-4 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToScript}
                className="h-8 w-8 rounded-full hover:bg-white/10"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">{scriptData.title}</h1>
                <p className="text-sm text-white/60">{scriptData.logline}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="border-white/10 hover:bg-white/10"
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button
                onClick={handleContinueToEditor}
                className="bg-[#D7F266] hover:bg-[#D7F266]/90 text-[#151514]"
              >
                <Play className="h-4 w-4 mr-1" />
                Continue to Editor
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto py-6 px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto mb-6">
            <TabsTrigger value="script">Script</TabsTrigger>
            <TabsTrigger value="storyboard">Storyboard</TabsTrigger>
            <TabsTrigger value="ai">AI Assistant</TabsTrigger>
          </TabsList>
          
          {/* Script Tab */}
          <TabsContent value="script" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-[#1A1A1A] border-white/10 col-span-1 md:col-span-2">
                <CardContent className="p-4">
                  <h2 className="text-lg font-semibold mb-2">Script Summary</h2>
                  <p className="text-white/70 mb-4">{scriptData.scriptSummary}</p>
                  
                  <h3 className="text-md font-semibold mb-2">Scene Breakdown</h3>
                  <div className="space-y-3">
                    {scriptData.scenes.map((scene, index) => (
                      <div key={index} className="p-3 rounded bg-[#0E0E0E] border border-white/10">
                        <h4 className="text-sm font-medium text-white mb-1">Scene {scene.sceneNumber}: {scene.setting}</h4>
                        <div className="space-y-1">
                          <p className="text-xs text-white/70"><span className="text-[#D7F266]">Visual:</span> {scene.textToVideoPrompt}</p>
                          {scene.voiceoverPrompt && (
                            <p className="text-xs text-white/70"><span className="text-[#D7F266]">Voice:</span> {scene.voiceoverPrompt}</p>
                          )}
                          <p className="text-xs text-white/70"><span className="text-[#D7F266]">Music:</span> {scene.backgroundMusicPrompt}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-[#1A1A1A] border-white/10">
                <CardContent className="p-4">
                  <h2 className="text-lg font-semibold mb-2">Script Details</h2>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-white/70">Title</p>
                      <p className="text-sm">{scriptData.title}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/70">Logline</p>
                      <p className="text-sm">{scriptData.logline}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/70">Style</p>
                      <p className="text-sm">{scriptData.style}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/70">Duration</p>
                      <p className="text-sm">{scriptData.duration}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/70">Total Scenes</p>
                      <p className="text-sm">{scriptData.scenes.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Storyboard Tab */}
          <TabsContent value="storyboard" className="space-y-4">
            <StoryboardCanvas 
              scenes={scriptData.scenes}
              storyboard={storyboard}
              onUpdateStoryboard={handleUpdateStoryboard}
              onGeneratePreview={handleGeneratePreview}
              isLoading={isLoading}
              previewUrls={previewUrls}
            />
          </TabsContent>
          
          {/* AI Assistant Tab */}
          <TabsContent value="ai" className="space-y-4">
            <Card className="bg-[#1A1A1A] border-white/10">
              <CardContent className="p-4">
                <div className="flex items-center mb-4">
                  <Sparkles className="h-5 w-5 text-[#D7F266] mr-2" />
                  <h2 className="text-lg font-semibold">AI Visual Enhancement</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="aiPrompt" className="text-white">Ask AI for visual refinement suggestions</Label>
                    <Textarea
                      id="aiPrompt"
                      placeholder="Describe what you want to enhance or ask for specific visual suggestions..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="min-h-[120px] bg-[#0E0E0E] border-white/20 text-white"
                    />
                  </div>
                  
                  <Button
                    onClick={handleAiAssist}
                    disabled={isLoading || !aiPrompt}
                    className="bg-[#D7F266] hover:bg-[#D7F266]/90 text-[#151514] w-full"
                  >
                    {isLoading ? (
                      <>
                        <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4 mr-2" />
                        Get AI Suggestions
                      </>
                    )}
                  </Button>
                  
                  <div className="border-t border-white/10 pt-4 mt-6">
                    <div className="flex items-center mb-4">
                      <Lightbulb className="h-4 w-4 text-[#D7F266] mr-2" />
                      <h3 className="text-sm font-medium">Quick Suggestion Prompts</h3>
                    </div>
                    
                    <div className="space-y-2">
                      {[
                        "Help me improve the visual continuity between scenes",
                        "Suggest better camera angles for product shots",
                        "How can I make the lighting more cinematic?",
                        "Recommend color grading for a more professional look"
                      ].map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          className="text-xs w-full justify-start hover:bg-white/10 border border-white/10"
                          onClick={() => setAiPrompt(suggestion)}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default StoryboardPage; 