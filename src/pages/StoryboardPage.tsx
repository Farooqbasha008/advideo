import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fal } from "@fal-ai/client";
import StoryboardCanvas from '@/components/StoryboardCanvas';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ChevronLeft, Download, Save, Play, Wand2, Lightbulb, Sparkles, ImageIcon, User, X, Loader2, Film } from 'lucide-react';
import { StoryboardScene, Character } from '@/lib/videoGeneration';
import { ScriptScene } from '@/lib/types';
import { determineShotType, planCameraMovement, maintainContinuity, enhancePromptWithVisualGuidelines } from '@/lib/videoGeneration';
import { generateStoryboardPreview, generateCharacterConsistentImage, generateVideoFromImage, generateInstantCharacterImage } from '@/lib/falai';
import { EnhancedCharacter, getCameraInstructionFromStoryboard } from '@/lib/characterConsistency';
import { cn } from '@/lib/utils';

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
  const [falaiKey, setFalaiKey] = useState<string>('');
  
  // Character consistency state
  const [characterReferenceImage, setCharacterReferenceImage] = useState<string | null>(null);
  const [characterName, setCharacterName] = useState<string>('Main Character');
  const [characterDescription, setCharacterDescription] = useState<string>('');
  const [videoUrls, setVideoUrls] = useState<Record<number, string>>({});
  
  // Add state for model selection
  const [selectedModel, setSelectedModel] = useState<'instant-character' | 'minimax'>('instant-character');
  
  // Add a new state variable to track which model was used for each preview
  const [instantCharacterPreviews, setInstantCharacterPreviews] = useState<Record<number, boolean>>({});
  
  // Add the reordering state and function
  const [reordering, setReordering] = useState(false);
  
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
    
    // Load FAL.ai API key from localStorage if available
    const savedFalaiKey = localStorage.getItem('falai_api_key');
    if (savedFalaiKey) {
      setFalaiKey(savedFalaiKey);
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
  
  // Handle FAL.ai API key update
  const handleSaveFalaiKey = () => {
    if (falaiKey) {
      localStorage.setItem('falai_api_key', falaiKey);
      toast.success('FAL.ai API key saved');
    } else {
      toast.error('Please enter a valid API key');
    }
  };
  
  // Add reference image upload function
  const handleReferenceImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    const file = event.target.files[0];
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Check if we have a FAL API key
      if (!falaiKey) {
        toast.error('FAL.ai API key required');
        setActiveTab('ai');
        setIsLoading(false);
        return;
      }
      
      // Configure the client with the API key
      fal.config({ credentials: falaiKey });
      
      // Upload the file to FAL storage
      const url = await fal.storage.upload(file);
      setCharacterReferenceImage(url);
      
      toast.success('Character reference image uploaded successfully');
    } catch (error) {
      console.error('Error uploading reference image:', error);
      toast.error('Failed to upload reference image');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Modify the handleGeneratePreview function
  const handleGeneratePreview = async (sceneIndex: number): Promise<string | null> => {
    if (!scriptData) return null;
    
    // Check if API key is available
    if (!falaiKey) {
      toast.error('FAL.ai API key required', {
        description: 'Please enter your API key in the AI Assistant tab',
        action: {
          label: 'Go to Settings',
          onClick: () => setActiveTab('ai')
        }
      });
      return null;
    }
    
    setIsLoading(true);
    
    try {
      const scene = scriptData.scenes[sceneIndex];
      const storyboardParams = storyboard[sceneIndex];
      
      // Enhanced prompt with scene details and character description
      let enhancedPrompt = enhancePromptWithVisualGuidelines(
        scene.textToVideoPrompt,
        storyboardParams
      );
      
      // If we have character description, add it to the prompt
      if (characterDescription) {
        enhancedPrompt = `${enhancedPrompt}. Character description: ${characterName} - ${characterDescription}`;
      }
      
      let imageUrl;
      let usedInstantCharacter = false;
      
      // If we have a character reference, use the selected character model
      if (characterReferenceImage) {
        if (selectedModel === 'instant-character') {
          // Use the Instant Character model (higher quality)
          imageUrl = await generateInstantCharacterImage(
            enhancedPrompt,
            characterReferenceImage,
            falaiKey,
            { 
              imageSize: "landscape_16_9",
              numInferenceSteps: 30,
              negativePrompt: "deformed, bad anatomy, disfigured, mutated, ugly, blurry, low quality"
            }
          );
          usedInstantCharacter = true;
        } else {
          // Use the MiniMax Subject Reference model
          imageUrl = await generateCharacterConsistentImage(
            enhancedPrompt,
            characterReferenceImage,
            falaiKey,
            { aspectRatio: "16:9" }
          );
        }
      } else {
        // Otherwise use the standard generation method
        imageUrl = await generateStoryboardPreview(
          storyboardParams,
          scene.textToVideoPrompt,
          falaiKey
        );
      }
      
      // Save the preview URL
      setPreviewUrls(prev => ({
        ...prev,
        [sceneIndex]: imageUrl
      }));
      
      // Track which model was used
      setInstantCharacterPreviews(prev => ({
        ...prev,
        [sceneIndex]: usedInstantCharacter
      }));
      
      toast.success('Preview generated successfully');
      return imageUrl;
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Failed to generate preview', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add function to generate video from a storyboard scene
  const handleGenerateVideoFromScene = async (sceneIndex: number) => {
    if (!scriptData || !previewUrls[sceneIndex]) {
      toast.error('Please generate a preview image first');
      return;
    }
    
    if (!falaiKey) {
      toast.error('FAL.ai API key required');
      setActiveTab('ai');
      return;
    }
    
    setIsLoading(true);
    toast.info(`Generating video for scene ${sceneIndex + 1}...`);
    
    try {
      const scene = scriptData.scenes[sceneIndex];
      const storyboardParams = storyboard[sceneIndex];
      
      // Get the preview image URL for this scene
      const imageUrl = previewUrls[sceneIndex];
      
      // Create an enhanced prompt with camera movement instructions
      const cameraInstruction = getCameraInstructionFromStoryboard(storyboardParams);
      const videoPrompt = `[${cameraInstruction}] ${scene.textToVideoPrompt}`;
      
      // Generate video using the MiniMax Video-01-Director model
      const videoUrl = await generateVideoFromImage(videoPrompt, imageUrl, falaiKey);
      
      // Save the generated video
      setVideoUrls(prev => ({
        ...prev,
        [sceneIndex]: videoUrl
      }));
      
      toast.success('Video generated successfully');
    } catch (error) {
      console.error('Error generating video:', error);
      toast.error('Failed to generate video', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
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
      storyboard: storyboard,
      previewUrls: previewUrls
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
        storyboard: storyboard,
        previewUrls: previewUrls
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
  
  // First, let's add a function to generate all preview images
  const handleGenerateAllPreviews = async () => {
    if (!scriptData || !scriptData.scenes || scriptData.scenes.length === 0) return;
    
    if (!falaiKey) {
      toast.error('FAL.ai API key required', {
        description: 'Please enter your API key in the AI Assistant tab',
        action: {
          label: 'Go to Settings',
          onClick: () => setActiveTab('ai')
        }
      });
      return;
    }
    
    setIsLoading(true);
    toast.info('Generating all preview images. This might take a moment...');
    
    try {
      // Generate previews for each scene sequentially
      for (let i = 0; i < scriptData.scenes.length; i++) {
        await handleGeneratePreview(i);
      }
      
      toast.success('All preview images generated successfully');
    } catch (error) {
      console.error('Error generating all previews:', error);
      toast.error('Failed to generate all previews', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!scriptData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0E0E0E]">
        <p className="text-white">Loading...</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={handleBackToScript} className="mr-2">
          <ChevronLeft className="mr-1" /> Back to Script
        </Button>
        <h1 className="text-2xl font-bold">Visual Storyboard: {scriptData?.title || 'Untitled'}</h1>
      </div>
      
      <Tabs defaultValue="characters" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="characters">Characters</TabsTrigger>
          <TabsTrigger value="storyboard">Storyboard</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="ai">AI Assistant</TabsTrigger>
        </TabsList>
        
        {/* Storyboard Tab */}
        <TabsContent value="storyboard" className="pt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Visual Storyboard</h2>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReordering(!reordering)}
                className={cn(
                  "text-white hover:bg-white/10",
                  reordering && "bg-white/10"
                )}
              >
                {reordering ? "Done Reordering" : "Reorder Scenes"}
              </Button>
              <Button 
                onClick={handleGenerateAllPreviews}
                disabled={isLoading}
                className="bg-[#D7F266] hover:bg-[#D7F266]/90 text-[#151514]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate All Previews
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <StoryboardCanvas
            scenes={scriptData?.scenes || []}
            storyboard={storyboard}
            onUpdateStoryboard={handleUpdateStoryboard}
            onGeneratePreview={handleGeneratePreview}
            onGenerateVideo={handleGenerateVideoFromScene}
            isLoading={isLoading}
            previewUrls={previewUrls}
            videoUrls={videoUrls}
            instantCharacterPreviews={instantCharacterPreviews}
            reordering={reordering}
            setReordering={setReordering}
          />
          
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={handleDownload} disabled={storyboard.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Download Storyboard
            </Button>
            <Button onClick={handleContinueToEditor} disabled={storyboard.length === 0}>
              <Play className="mr-2 h-4 w-4" />
              Continue to Video Editor
            </Button>
          </div>

          {/* Add reminder about Character tab */}
          {!characterReferenceImage && (
            <div className="mt-4 p-3 bg-[#1A1A1A] rounded border border-white/10">
              <div className="flex items-start text-sm">
                <User className="h-4 w-4 text-[#D7F266] mt-0.5 mr-2" />
                <p className="text-white/70">
                  <span className="text-[#D7F266]">Tip:</span> For better character consistency, 
                  <button 
                    onClick={() => setActiveTab("characters")} 
                    className="text-[#D7F266] underline decoration-dotted mx-1"
                  >
                    switch to the Characters tab
                  </button>
                  to add a reference image before generating previews.
                </p>
              </div>
            </div>
          )}
        </TabsContent>
        
        {/* Characters Tab */}
        <TabsContent value="characters" className="space-y-4">
          <div className="bg-[#D7F266]/10 border border-[#D7F266]/30 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <User className="h-5 w-5 text-[#D7F266] mt-0.5 mr-3" />
              <div>
                <h3 className="font-medium text-white mb-1">Welcome to Character Setup</h3>
                <p className="text-sm text-white/80">
                  For consistent characters throughout your video, start by defining your character here before proceeding to the storyboard. 
                  Upload a clear reference image, add descriptive details, and then use the same character across all scenes.
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-black/20 border border-white/10 rounded-lg p-6">
              <h3 className="text-xl font-medium mb-4">Character Reference</h3>
              
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div>
                  <h4 className="font-medium mb-1">Character Model Selection</h4>
                  <p className="text-sm text-white/60">Choose which model to use for character generation</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div 
                    className={`px-3 py-1.5 rounded-md text-sm cursor-pointer transition-colors ${
                      selectedModel === 'instant-character' 
                        ? 'bg-[#D7F266] text-[#151514] font-medium' 
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                    onClick={() => setSelectedModel('instant-character')}
                  >
                    Instant Character
                  </div>
                  <div 
                    className={`px-3 py-1.5 rounded-md text-sm cursor-pointer transition-colors ${
                      selectedModel === 'minimax' 
                        ? 'bg-[#D7F266] text-[#151514] font-medium' 
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                    onClick={() => setSelectedModel('minimax')}
                  >
                    MiniMax
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Character Image Upload */}
                <div className="flex flex-col space-y-4">
                  <Label htmlFor="characterName">Character Name</Label>
                  <Input 
                    id="characterName" 
                    value={characterName}
                    onChange={(e) => setCharacterName(e.target.value)}
                    placeholder="Main Character"
                    className="bg-black/30 border-white/20"
                  />
                  
                  <Label htmlFor="characterDescription">Character Description</Label>
                  <Textarea
                    id="characterDescription"
                    value={characterDescription}
                    onChange={(e) => setCharacterDescription(e.target.value)}
                    placeholder="Describe your character's appearance, clothing, and distinctive features"
                    className="bg-black/30 border-white/20 h-24"
                  />
                  
                  <div className="flex flex-col items-center justify-center bg-black/30 border border-dashed border-white/20 rounded-lg p-6">
                    {characterReferenceImage ? (
                      <div className="relative w-full max-w-xs">
                        <img 
                          src={characterReferenceImage} 
                          alt="Character reference"
                          className="w-full rounded-md shadow-lg"
                        />
                        <Button 
                          variant="destructive" 
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/70 hover:bg-red-600/90"
                          onClick={() => setCharacterReferenceImage(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <User className="h-16 w-16 text-white/20 mb-4" />
                        <p className="text-sm text-white/60 mb-4 text-center">
                          Upload a reference image of your character to maintain consistent appearance across scenes
                        </p>
                        <input
                          type="file"
                          id="characterReferenceUpload"
                          accept="image/*"
                          onChange={handleReferenceImageUpload}
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById('characterReferenceUpload')?.click()}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>Upload Reference Image</>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Character Tips & Preview */}
                <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                  <h4 className="font-medium mb-2 text-white/80">Enhanced Character Generator</h4>
                  <p className="text-sm text-white/70 mb-3">
                    Using fal.ai's Instant Character model for high-quality, consistent character appearances across all scenes.
                  </p>
                  
                  <h5 className="text-sm font-medium text-white/80 mb-1">Tips for Best Results:</h5>
                  <ul className="text-sm text-white/70 space-y-2 mb-4 list-disc pl-5">
                    <li>Use a clear frontal shot of your character with good lighting</li>
                    <li>Choose images with a neutral background to focus on the character</li>
                    <li>Include distinctive clothing or features you want to maintain</li>
                    <li>For AI-generated characters, use consistent reference images</li>
                    <li>Add specific character details in the description field</li>
                  </ul>
                  
                  <div className="mt-4 p-3 bg-[#D7F266]/10 border border-[#D7F266]/30 rounded-md">
                    <p className="text-sm text-[#D7F266] mb-2">
                      <strong>New!</strong> Instant Character technology ensures:
                    </p>
                    <ul className="text-xs text-[#D7F266]/90 list-disc pl-4 space-y-1">
                      <li>Consistent appearance across all scenes</li>
                      <li>High-quality photorealistic results</li>
                      <li>Proper anatomy and proportions</li>
                      <li>Accurate clothing and features preservation</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        {/* Videos Tab */}
        <TabsContent value="videos" className="pt-4">
          {storyboard.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {storyboard.map((scene, index) => {
                const hasVideo = videoUrls[index];
                return (
                  <Card key={`video-${index}`} className="bg-[#1A1A1A] border-white/10">
                    <CardContent className="pt-4">
                      <h4 className="font-medium mb-2">Scene {index + 1}</h4>
                      {hasVideo ? (
                        <div className="aspect-video bg-black/40 rounded-md overflow-hidden">
                          <video 
                            src={videoUrls[index]} 
                            controls
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="aspect-video bg-black/40 rounded-md flex items-center justify-center">
                          <div className="text-center p-4">
                            <Film className="h-8 w-8 mx-auto mb-2 text-white/20" />
                            <p className="text-sm text-white/50">No video generated yet</p>
                            
                            {previewUrls[index] && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-4"
                                onClick={() => handleGenerateVideoFromScene(index)}
                                disabled={isLoading}
                              >
                                Generate Video
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Film className="h-16 w-16 text-white/20 mb-4" />
              <h3 className="text-xl font-medium mb-2">No Storyboard Scenes</h3>
              <p className="text-white/60 mb-4 max-w-md">
                Create a storyboard first in the Storyboard tab, then generate previews before creating videos.
              </p>
            </div>
          )}
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
                {/* FAL.ai API Key Input */}
                <div className="space-y-2">
                  <Label htmlFor="falai_api_key" className="text-white">FAL.ai API Key</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="falai_api_key"
                      type="password"
                      placeholder="Enter your FAL.ai API key for Flux Schnell"
                      value={falaiKey}
                      onChange={(e) => setFalaiKey(e.target.value)}
                      className="flex-1 bg-[#0E0E0E] border-white/20 text-white"
                    />
                    <Button 
                      onClick={handleSaveFalaiKey}
                      className="bg-[#D7F266] hover:bg-[#D7F266]/90 text-[#151514]"
                    >
                      Save
                    </Button>
                  </div>
                  <p className="text-xs text-white/60">
                    Your API key is stored locally and used to generate photorealistic previews with Flux Schnell.
                    <a href="https://fal.ai/models" target="_blank" rel="noopener noreferrer" className="underline ml-2">
                      Get a key at fal.ai
                    </a>
                  </p>
                </div>
              
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
                
                <div className="border-t border-white/10 pt-4 mt-4">
                  <h3 className="text-lg font-medium mb-3 flex items-center">
                    <User className="mr-2 h-4 w-4 text-[#D7F266]" />
                    Advanced Character Models
                  </h3>
                  
                  <div className="bg-black/20 rounded-lg p-4 mb-4">
                    <h4 className="font-medium mb-2">Instant Character Model</h4>
                    <p className="text-sm text-white/70 mb-2">
                      Our new default model for high-quality character generation. Best for:
                    </p>
                    <ul className="text-xs text-white/70 list-disc pl-4 mb-2">
                      <li>Photorealistic character appearances</li>
                      <li>Maintaining consistent identity</li>
                      <li>Higher quality facial features and details</li>
                      <li>Accurate clothing and accessory reproduction</li>
                    </ul>
                    <p className="text-xs text-white/50 italic">
                      Uses fal.ai's Instant Character API to maintain identity across different poses and scenes.
                    </p>
                  </div>
                  
                  <div className="bg-black/20 rounded-lg p-4">
                    <h4 className="font-medium mb-2">MiniMax Subject Reference</h4>
                    <p className="text-sm text-white/70 mb-2">
                      Alternative model with these characteristics:
                    </p>
                    <ul className="text-xs text-white/70 list-disc pl-4 mb-2">
                      <li>Faster generation times</li>
                      <li>Good for stylized character appearances</li>
                      <li>Better for non-human characters</li>
                      <li>Works well with abstract visual styles</li>
                    </ul>
                    <p className="text-xs text-white/50 italic">
                      Uses the MiniMax Subject Reference model which may have less detail but offers creative flexibility.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StoryboardPage; 