import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  Camera, 
  Sun, 
  Moon, 
  Sunrise, 
  Sunset, 
  Move, 
  Home,
  Palette,
  ArrowDown,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Image,
  Check,
  XIcon,
  Edit2,
  Trash2,
  Maximize,
  Loader2
} from 'lucide-react';
import { Toast } from '@/components/ui/toast';
import { StoryboardScene } from '@/lib/videoGeneration';
import { ScriptScene } from '@/lib/types';
import { cn } from '@/lib/utils';

interface StoryboardCanvasProps {
  scenes: ScriptScene[];
  storyboard: StoryboardScene[];
  onUpdateStoryboard: (storyboard: StoryboardScene[]) => void;
  onGeneratePreview?: (sceneIndex: number) => Promise<string | null>;
  isLoading?: boolean;
  previewUrls?: Record<number, string>;
}

const StoryboardCanvas: React.FC<StoryboardCanvasProps> = ({
  scenes,
  storyboard,
  onUpdateStoryboard,
  onGeneratePreview,
  isLoading = false,
  previewUrls = {}
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempScene, setTempScene] = useState<StoryboardScene | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState<number | null>(null);
  const [expandedScene, setExpandedScene] = useState<number | null>(null);
  const [reordering, setReordering] = useState(false);

  // Handle edit of a storyboard scene
  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setTempScene({ ...storyboard[index] });
  };

  // Handle saving edit changes
  const handleSaveEdit = () => {
    if (editingIndex !== null && tempScene) {
      const newStoryboard = [...storyboard];
      newStoryboard[editingIndex] = tempScene;
      onUpdateStoryboard(newStoryboard);
      setEditingIndex(null);
      setTempScene(null);
    }
  };

  // Handle canceling edit
  const handleCancelEdit = () => {
    setEditingIndex(null);
    setTempScene(null);
  };

  // Handle change in storyboard scene property
  const handleChangeProperty = (property: string, value: any) => {
    if (tempScene) {
      if (property.includes('.')) {
        // Handle nested properties
        const [parent, child] = property.split('.');
        setTempScene({
          ...tempScene,
          [parent]: {
            ...tempScene[parent as keyof StoryboardScene] as any,
            [child]: value
          }
        });
      } else {
        setTempScene({
          ...tempScene,
          [property]: value
        });
      }
    }
  };

  // Generate preview for a scene
  const handleGeneratePreview = async (index: number) => {
    if (onGeneratePreview) {
      setIsGeneratingPreview(index);
      try {
        await onGeneratePreview(index);
      } catch (error) {
        console.error('Failed to generate preview:', error);
      } finally {
        setIsGeneratingPreview(null);
      }
    }
  };

  // Reorder scenes
  const moveScene = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === storyboard.length - 1)
    ) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newStoryboard = [...storyboard];
    const scene = newStoryboard[index];
    newStoryboard.splice(index, 1);
    newStoryboard.splice(newIndex, 0, scene);
    
    onUpdateStoryboard(newStoryboard);
  };

  // Toggle scene expansion for detailed view
  const toggleExpand = (index: number) => {
    if (expandedScene === index) {
      setExpandedScene(null);
    } else {
      setExpandedScene(index);
    }
  };

  // Render camera movement icon based on value
  const getCameraMovementIcon = (movement: string) => {
    switch (movement) {
      case 'pan': return <ArrowRight className="h-4 w-4" />;
      case 'tilt': return <ArrowUp className="h-4 w-4" />;
      case 'tracking': return <ArrowRight className="h-4 w-4 animate-pulse" />;
      case 'static':
      default:
        return <Move className="h-4 w-4" />;
    }
  };

  // Render time of day icon
  const getTimeOfDayIcon = (timeOfDay: string) => {
    switch (timeOfDay) {
      case 'night': return <Moon className="h-4 w-4" />;
      case 'dawn': return <Sunrise className="h-4 w-4" />;
      case 'dusk': return <Sunset className="h-4 w-4" />;
      case 'day':
      default:
        return <Sun className="h-4 w-4" />;
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">Visual Storyboard</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReordering(!reordering)}
            className={cn(
              "text-white hover:bg-white/10",
              reordering && "bg-white/10"
            )}
          >
            {reordering ? "Done Reordering" : "Reorder Scenes"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {storyboard.map((scene, index) => (
          <Card 
            key={index} 
            className={cn(
              "bg-[#1A1A1A] border-white/10 text-white transition-all duration-200",
              expandedScene === index ? "col-span-1 md:col-span-2 lg:col-span-3" : "",
              editingIndex === index && "border-[#D7F266]/50"
            )}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-white/70 mr-1">Scene {index + 1}:</span>
                  {scenes[index]?.setting || "Unknown Setting"}
                </div>
                <div className="flex items-center space-x-1">
                  {reordering ? (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveScene(index, 'up')}
                        disabled={index === 0}
                        className="h-8 w-8 hover:bg-white/10"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveScene(index, 'down')}
                        disabled={index === storyboard.length - 1}
                        className="h-8 w-8 hover:bg-white/10"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleExpand(index)}
                        className="h-8 w-8 hover:bg-white/10"
                      >
                        <Maximize className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => editingIndex === index ? handleCancelEdit() : handleEdit(index)}
                        className="h-8 w-8 hover:bg-white/10"
                      >
                        {editingIndex === index ? <XIcon className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
                      </Button>
                    </>
                  )}
                </div>
              </CardTitle>
              <CardDescription className="text-white/60 line-clamp-2">
                {scenes[index]?.textToVideoPrompt || "No visual description"}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {/* Preview Image */}
              <div className="aspect-video rounded overflow-hidden bg-black/50 mb-4 relative">
                {previewUrls[index] ? (
                  <img 
                    src={previewUrls[index]} 
                    alt={`Scene ${index + 1} preview`} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Image className="h-8 w-8 text-white/30" />
                  </div>
                )}
                
                {isGeneratingPreview === index && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                )}
                
                {!isGeneratingPreview && !isLoading && onGeneratePreview && !previewUrls[index] && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGeneratePreview(index)}
                    className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 border-white/20 text-white"
                  >
                    Generate Preview
                  </Button>
                )}
              </div>

              {editingIndex === index && tempScene ? (
                <div className="space-y-3 bg-black/20 p-3 rounded">
                  <div>
                    <Label htmlFor={`shotType-${index}`} className="text-xs text-white/70">Shot Type</Label>
                    <Select
                      value={tempScene.shotType}
                      onValueChange={(value) => handleChangeProperty('shotType', value)}
                    >
                      <SelectTrigger className="bg-[#0E0E0E] border-white/10 text-white">
                        <SelectValue placeholder="Select shot type" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0E0E0E] border-white/10 text-white">
                        <SelectItem value="wide">Wide Shot</SelectItem>
                        <SelectItem value="medium">Medium Shot</SelectItem>
                        <SelectItem value="close-up">Close-Up</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor={`cameraMovement-${index}`} className="text-xs text-white/70">Camera Movement</Label>
                    <Select
                      value={tempScene.cameraMovement}
                      onValueChange={(value) => handleChangeProperty('cameraMovement', value)}
                    >
                      <SelectTrigger className="bg-[#0E0E0E] border-white/10 text-white">
                        <SelectValue placeholder="Select camera movement" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0E0E0E] border-white/10 text-white">
                        <SelectItem value="static">Static</SelectItem>
                        <SelectItem value="pan">Pan</SelectItem>
                        <SelectItem value="tilt">Tilt</SelectItem>
                        <SelectItem value="tracking">Tracking</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor={`environmentType-${index}`} className="text-xs text-white/70">Environment</Label>
                    <Select
                      value={tempScene.environmentType}
                      onValueChange={(value) => handleChangeProperty('environmentType', value)}
                    >
                      <SelectTrigger className="bg-[#0E0E0E] border-white/10 text-white">
                        <SelectValue placeholder="Select environment" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0E0E0E] border-white/10 text-white">
                        <SelectItem value="interior">Interior</SelectItem>
                        <SelectItem value="exterior">Exterior</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor={`timeOfDay-${index}`} className="text-xs text-white/70">Time of Day</Label>
                    <Select
                      value={tempScene.timeOfDay}
                      onValueChange={(value) => handleChangeProperty('timeOfDay', value)}
                    >
                      <SelectTrigger className="bg-[#0E0E0E] border-white/10 text-white">
                        <SelectValue placeholder="Select time of day" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0E0E0E] border-white/10 text-white">
                        <SelectItem value="day">Day</SelectItem>
                        <SelectItem value="night">Night</SelectItem>
                        <SelectItem value="dawn">Dawn</SelectItem>
                        <SelectItem value="dusk">Dusk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor={`lighting-${index}`} className="text-xs text-white/70">Lighting Conditions</Label>
                    <Input
                      id={`lighting-${index}`}
                      value={tempScene.lightingConditions}
                      onChange={(e) => handleChangeProperty('lightingConditions', e.target.value)}
                      className="bg-[#0E0E0E] border-white/10 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`colorPalette-${index}`} className="text-xs text-white/70">Color Palette</Label>
                    <Input
                      id={`colorPalette-${index}`}
                      value={tempScene.visualContinuity.colorPalette}
                      onChange={(e) => handleChangeProperty('visualContinuity.colorPalette', e.target.value)}
                      className="bg-[#0E0E0E] border-white/10 text-white"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelEdit}
                      className="text-white hover:bg-white/10"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSaveEdit}
                      className="bg-[#D7F266] hover:bg-[#D7F266]/90 text-[#151514]"
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <div className="bg-[#0E0E0E] px-2 py-1 rounded-md text-xs flex items-center gap-1">
                      <Camera className="h-3 w-3 text-[#D7F266]" />
                      <span>{scene.shotType}</span>
                    </div>
                    
                    <div className="bg-[#0E0E0E] px-2 py-1 rounded-md text-xs flex items-center gap-1">
                      {getCameraMovementIcon(scene.cameraMovement)}
                      <span>{scene.cameraMovement}</span>
                    </div>
                    
                    <div className="bg-[#0E0E0E] px-2 py-1 rounded-md text-xs flex items-center gap-1">
                      {scene.environmentType === 'interior' ? (
                        <Home className="h-3 w-3 text-[#D7F266]" />
                      ) : (
                        <Home className="h-3 w-3 text-[#D7F266]" />
                      )}
                      <span>{scene.environmentType}</span>
                    </div>
                    
                    <div className="bg-[#0E0E0E] px-2 py-1 rounded-md text-xs flex items-center gap-1">
                      {getTimeOfDayIcon(scene.timeOfDay)}
                      <span>{scene.timeOfDay}</span>
                    </div>
                  </div>

                  {expandedScene === index && (
                    <div className="mt-4 space-y-3 bg-black/20 p-3 rounded">
                      <div>
                        <Label className="text-xs text-white/70">Lighting</Label>
                        <p className="text-sm text-white/80">{scene.lightingConditions}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-white/70">Visual Continuity</Label>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Palette className="h-3 w-3 text-[#D7F266]" />
                            <p className="text-xs text-white/80">{scene.visualContinuity.colorPalette}</p>
                          </div>
                          <p className="text-xs text-white/80">
                            {scene.visualContinuity.atmosphericConditions} • {scene.visualContinuity.locationConsistency}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-white/70">Script Description</Label>
                        <p className="text-sm text-white/80 line-clamp-4">{scenes[index]?.textToVideoPrompt}</p>
                      </div>
                      
                      {scenes[index]?.voiceoverPrompt && (
                        <div>
                          <Label className="text-xs text-white/70">Voiceover</Label>
                          <p className="text-sm text-white/80 line-clamp-2">{scenes[index].voiceoverPrompt}</p>
                        </div>
                      )}
                      
                      {scenes[index]?.backgroundMusicPrompt && (
                        <div>
                          <Label className="text-xs text-white/70">Music</Label>
                          <p className="text-sm text-white/80 line-clamp-2">{scenes[index].backgroundMusicPrompt}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>

            <CardFooter className="pt-0">
              <div className="w-full flex justify-between items-center text-xs text-white/50">
                <span>Shot {index + 1} of {storyboard.length}</span>
                {!editingIndex && !reordering && onGeneratePreview && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleGeneratePreview(index)}
                    disabled={isGeneratingPreview !== null}
                    className="text-xs h-7 hover:bg-white/10 text-white/70 hover:text-white"
                  >
                    {isGeneratingPreview === index ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3 mr-1" />
                    )}
                    Refresh Preview
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default StoryboardCanvas; 