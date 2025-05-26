import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Download, Folder, Loader2, Music, FileText } from 'lucide-react';
import { StoryboardScene } from '@/lib/videoGeneration';
import { ScriptScene } from '@/lib/types';
import { generateSpeech } from '@/lib/groqTTS';
import { generateSound } from '@/lib/elevenlabs';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface AssetExporterProps {
  isOpen: boolean;
  onClose: () => void;
  scriptData: {
    title: string;
    scenes: ScriptScene[];
  };
  storyboard: StoryboardScene[];
  previewUrls: Record<number, string>;
  videoUrls: Record<number, string>;
}

type AssetType = 'preview' | 'video' | 'voiceover' | 'background';
type ExportProgress = Record<number, Record<AssetType, { status: 'pending' | 'processing' | 'completed' | 'error', url?: string }>>;

const AssetExporter: React.FC<AssetExporterProps> = ({
  isOpen,
  onClose,
  scriptData,
  storyboard,
  previewUrls,
  videoUrls
}) => {
  const [groqApiKey, setGroqApiKey] = useState<string>('');
  const [elevenlabsApiKey, setElevenlabsApiKey] = useState<string>('');
  const [selectedVoice, setSelectedVoice] = useState<string>('Fritz');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress>({});
  const [overallProgress, setOverallProgress] = useState<number>(0);
  const [currentStage, setCurrentStage] = useState<string>('');
  const [zipFile, setZipFile] = useState<Blob | null>(null);
  const [sceneZipFiles, setSceneZipFiles] = useState<Record<number, Blob>>({});
  const [processingSceneDownload, setProcessingSceneDownload] = useState<number | null>(null);

  // Load API keys from localStorage
  useEffect(() => {
    const savedGroqKey = localStorage.getItem('groq_api_key');
    if (savedGroqKey) {
      setGroqApiKey(savedGroqKey);
    }
    
    const savedElevenlabsKey = localStorage.getItem('elevenlabs_api_key');
    if (savedElevenlabsKey) {
      setElevenlabsApiKey(savedElevenlabsKey);
    }
  }, []);

  // Save API keys to localStorage
  const handleSaveGroqKey = () => {
    localStorage.setItem('groq_api_key', groqApiKey);
    toast.success('Groq API key saved');
  };

  const handleSaveElevenlabsKey = () => {
    localStorage.setItem('elevenlabs_api_key', elevenlabsApiKey);
    toast.success('ElevenLabs API key saved');
  };

  // Calculate overall export progress
  useEffect(() => {
    if (!isExporting || Object.keys(exportProgress).length === 0) return;

    const scenes = Object.values(exportProgress);
    const totalItems = scenes.length * 4; // preview, video, voiceover, background music per scene
    let completedItems = 0;

    scenes.forEach(scene => {
      Object.values(scene).forEach(asset => {
        if (asset.status === 'completed') {
          completedItems++;
        }
      });
    });

    const calculatedProgress = Math.floor((completedItems / totalItems) * 100);
    setOverallProgress(calculatedProgress);
  }, [exportProgress, isExporting]);

  // Initialize export progress tracking
  const initExportProgress = () => {
    const progress: ExportProgress = {};
    
    scriptData.scenes.forEach((_, index) => {
      progress[index] = {
        preview: { 
          status: previewUrls[index] ? 'completed' : 'pending', 
          url: previewUrls[index] 
        },
        video: { 
          status: videoUrls[index] ? 'completed' : 'pending',
          url: videoUrls[index]
        },
        voiceover: { status: 'pending' },
        background: { status: 'pending' }
      };
    });
    
    return progress;
  };

  // Function to create a scene zip file
  const createSceneZip = async (sceneIndex: number): Promise<Blob> => {
    const scene = scriptData.scenes[sceneIndex];
    const zip = new JSZip();
    const sceneFolder = zip.folder(`scene-${sceneIndex + 1}`);
    
    if (!sceneFolder) {
      throw new Error(`Failed to create folder for scene ${sceneIndex + 1}`);
    }

    // Add assets to the zip file
    const assets = exportProgress[sceneIndex];
    if (!assets) {
      throw new Error(`No assets found for scene ${sceneIndex + 1}`);
    }

    // Add visual content - prioritize video over image when available
    if (assets.video.status === 'completed' && assets.video.url) {
      // If video is available, use it as the primary visual
      const response = await fetch(assets.video.url);
      const blob = await response.blob();
      sceneFolder.file('visual.mp4', blob);
    } else if (assets.preview.status === 'completed' && assets.preview.url) {
      // Otherwise fall back to the image
      const response = await fetch(assets.preview.url);
      const blob = await response.blob();
      sceneFolder.file('visual.jpg', blob);
    }

    // Add voiceover if available
    if (assets.voiceover.status === 'completed' && assets.voiceover.url) {
      const response = await fetch(assets.voiceover.url);
      const blob = await response.blob();
      sceneFolder.file('voiceover.mp3', blob);
    }

    // Add background music if available
    if (assets.background.status === 'completed' && assets.background.url) {
      const response = await fetch(assets.background.url);
      const blob = await response.blob();
      sceneFolder.file('bgmusic.mp3', blob);
    }

    // Add a scene info JSON file
    const sceneInfo = {
      sceneNumber: scene.sceneNumber,
      setting: scene.setting,
      voiceoverPrompt: scene.voiceoverPrompt,
      backgroundMusicPrompt: scene.backgroundMusicPrompt,
      textToVideoPrompt: scene.textToVideoPrompt,
      storyboardParams: storyboard[sceneIndex],
      exportDate: new Date().toISOString()
    };
    sceneFolder.file('scene-info.json', JSON.stringify(sceneInfo, null, 2));

    // Generate the zip file
    return await zip.generateAsync({ type: 'blob' });
  };

  // Handle downloading a single scene
  const handleDownloadScene = async (sceneIndex: number) => {
    try {
      setProcessingSceneDownload(sceneIndex);
      // Check if we already have the scene zip file cached
      if (sceneZipFiles[sceneIndex]) {
        saveAs(sceneZipFiles[sceneIndex], `scene-${sceneIndex + 1}.zip`);
      } else {
        // Create the scene zip file
        const sceneZip = await createSceneZip(sceneIndex);
        
        // Cache the zip file
        setSceneZipFiles(prev => ({
          ...prev,
          [sceneIndex]: sceneZip
        }));
        
        // Download the zip file
        saveAs(sceneZip, `scene-${sceneIndex + 1}.zip`);
      }
      toast.success(`Scene ${sceneIndex + 1} downloaded successfully`);
    } catch (error) {
      console.error(`Error downloading scene ${sceneIndex + 1}:`, error);
      toast.error(`Failed to download scene ${sceneIndex + 1}`, {
        description: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    } finally {
      setProcessingSceneDownload(null);
    }
  };

  // Handle starting the export process
  const startExport = async () => {
    if (!scriptData || scriptData.scenes.length === 0) {
      toast.error('No scenes to export');
      return;
    }

    if (!groqApiKey) {
      toast.error('Groq API key is required for voiceover generation');
      return;
    }

    if (!elevenlabsApiKey) {
      toast.error('ElevenLabs API key is required for background music generation');
      return;
    }

    setIsExporting(true);
    const initialProgress = initExportProgress();
    setExportProgress(initialProgress);
    
    try {
      const zip = new JSZip();
      const projectFolder = zip.folder(scriptData.title.replace(/\s+/g, '_'));
      
      if (!projectFolder) {
        throw new Error('Failed to create project folder');
      }

      // Clear existing scene zip files
      setSceneZipFiles({});

      for (let i = 0; i < scriptData.scenes.length; i++) {
        const scene = scriptData.scenes[i];
        const sceneFolder = projectFolder.folder(`scene-${i + 1}`);
        
        if (!sceneFolder) {
          throw new Error(`Failed to create folder for scene ${i + 1}`);
        }

        // Process existing assets first (preview images)
        setCurrentStage(`Processing scene ${i + 1} visuals`);
        
        // Handle visual content - prioritize video over image
        if (videoUrls[i]) {
          try {
            const videoResponse = await fetch(videoUrls[i]);
            const videoBlob = await videoResponse.blob();
            sceneFolder.file(`visual.mp4`, videoBlob);
            
            setExportProgress(prev => ({
              ...prev,
              [i]: {
                ...prev[i],
                video: { status: 'completed', url: videoUrls[i] }
              }
            }));
          } catch (error) {
            console.error(`Error processing video for scene ${i + 1}:`, error);
            setExportProgress(prev => ({
              ...prev,
              [i]: {
                ...prev[i],
                video: { status: 'error' }
              }
            }));
          }
        } else if (previewUrls[i]) {
          try {
            const imageResponse = await fetch(previewUrls[i]);
            const imageBlob = await imageResponse.blob();
            sceneFolder.file(`visual.jpg`, imageBlob);
            
            setExportProgress(prev => ({
              ...prev,
              [i]: {
                ...prev[i],
                preview: { status: 'completed', url: previewUrls[i] }
              }
            }));
          } catch (error) {
            console.error(`Error processing preview for scene ${i + 1}:`, error);
            setExportProgress(prev => ({
              ...prev,
              [i]: {
                ...prev[i],
                preview: { status: 'error' }
              }
            }));
          }
        }

        // Generate voiceover with Groq
        setCurrentStage(`Generating voiceover for scene ${i + 1}`);
        setExportProgress(prev => ({
          ...prev,
          [i]: {
            ...prev[i],
            voiceover: { status: 'processing' }
          }
        }));
        
        try {
          const voicePrompt = scene.voiceoverPrompt;
          const voiceUrl = await generateSpeech(
            voicePrompt, 
            groqApiKey,
            { 
              voiceId: selectedVoice,
              trimSilence: true 
            }
          );
          
          const voiceResponse = await fetch(voiceUrl);
          const voiceBlob = await voiceResponse.blob();
          sceneFolder.file(`voiceover.mp3`, voiceBlob);
          
          setExportProgress(prev => ({
            ...prev,
            [i]: {
              ...prev[i],
              voiceover: { status: 'completed', url: voiceUrl }
            }
          }));
        } catch (error) {
          console.error(`Error generating voiceover for scene ${i + 1}:`, error);
          setExportProgress(prev => ({
            ...prev,
            [i]: {
              ...prev[i],
              voiceover: { status: 'error' }
            }
          }));
        }

        // Generate background music with ElevenLabs
        setCurrentStage(`Generating background music for scene ${i + 1}`);
        setExportProgress(prev => ({
          ...prev,
          [i]: {
            ...prev[i],
            background: { status: 'processing' }
          }
        }));
        
        try {
          // Enhance the music prompt with more specific musical terms
          const originalPrompt = scene.backgroundMusicPrompt;
          const enhancedMusicPrompt = `Cinematic background music: ${originalPrompt}. 5-second musical piece with clear atmosphere, high-quality orchestral sound suitable for video soundtrack.`;
          
          const musicUrl = await generateSound(
            enhancedMusicPrompt, 
            elevenlabsApiKey,
            { 
              type: 'bgm',
              duration: 5 // Set to 5 seconds to match scene duration
            }
          );
          
          const musicResponse = await fetch(musicUrl);
          const musicBlob = await musicResponse.blob();
          sceneFolder.file(`bgmusic.mp3`, musicBlob);
          
          setExportProgress(prev => ({
            ...prev,
            [i]: {
              ...prev[i],
              background: { status: 'completed', url: musicUrl }
            }
          }));
        } catch (error) {
          console.error(`Error generating background music for scene ${i + 1}:`, error);
          setExportProgress(prev => ({
            ...prev,
            [i]: {
              ...prev[i],
              background: { status: 'error' }
            }
          }));
        }

        // Create individual scene zip file
        try {
          const sceneZip = await createSceneZip(i);
          setSceneZipFiles(prev => ({
            ...prev,
            [i]: sceneZip
          }));
        } catch (error) {
          console.error(`Error creating zip for scene ${i + 1}:`, error);
        }
      }

      // Create a manifest JSON file with project information
      const manifest = {
        title: scriptData.title,
        scenes: scriptData.scenes.map((scene, index) => ({
          sceneNumber: scene.sceneNumber,
          setting: scene.setting,
          hasPreview: !!previewUrls[index],
          hasVideo: !!videoUrls[index],
          storyboardParams: storyboard[index]
        })),
        exportDate: new Date().toISOString()
      };
      
      projectFolder.file('manifest.json', JSON.stringify(manifest, null, 2));

      // Generate zip file
      setCurrentStage('Creating downloadable package');
      const content = await zip.generateAsync({ type: 'blob' });
      setZipFile(content);
      
      setCurrentStage('Export complete!');
      toast.success('Export completed successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed', {
        description: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Handle download of the zip file
  const handleDownload = () => {
    if (!zipFile) return;
    
    const safeProjectName = scriptData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    saveAs(zipFile, `${safeProjectName}_assets.zip`);
  };

  // Function to get status icon
  const getStatusIcon = (status: 'pending' | 'processing' | 'completed' | 'error') => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />;
      case 'completed':
        return <div className="h-4 w-4 rounded-full bg-green-500" />;
      case 'error':
        return <div className="h-4 w-4 rounded-full bg-red-500" />;
      case 'pending':
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-500" />;
    }
  };

  // Check if a scene is downloadable (all assets are completed or some failed but at least one is completed)
  const isSceneDownloadable = (assets: Record<AssetType, { status: string, url?: string }>) => {
    const statuses = Object.values(assets).map(asset => asset.status);
    const hasCompleted = statuses.includes('completed');
    const allPendingOrCompleted = statuses.every(status => ['completed', 'pending'].includes(status));
    
    return hasCompleted && !isExporting && !allPendingOrCompleted;
  };

  // Reset export state when closing
  const handleClose = () => {
    if (isExporting) {
      const confirmed = window.confirm('Export in progress. Are you sure you want to cancel?');
      if (!confirmed) return;
    }
    
    setIsExporting(false);
    setExportProgress({});
    setOverallProgress(0);
    setCurrentStage('');
    setZipFile(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-[#151514] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Export Project Assets</DialogTitle>
        </DialogHeader>
        
        {!isExporting && !zipFile ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="groq_api_key">Groq API Key (for voiceovers)</Label>
              <div className="flex space-x-2">
                <input
                  id="groq_api_key"
                  type="password"
                  placeholder="Enter your Groq API key"
                  value={groqApiKey}
                  onChange={(e) => setGroqApiKey(e.target.value)}
                  className="flex-1 h-9 px-3 py-2 text-sm rounded-md bg-[#1A1A19] border border-white/20 text-white"
                />
                <Button 
                  onClick={handleSaveGroqKey}
                  className="bg-[#D7F266] hover:bg-[#D7F266]/90 text-[#151514]"
                >
                  Save
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="voice">TTS Voice</Label>
              <Select 
                value={selectedVoice} 
                onValueChange={setSelectedVoice}
              >
                <SelectTrigger id="voice" className="bg-[#1A1A19] border-white/20">
                  <SelectValue placeholder="Select voice" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A19] border-white/20">
                  <SelectItem value="Fritz">Fritz (Default)</SelectItem>
                  <SelectItem value="Aaliyah">Aaliyah</SelectItem>
                  <SelectItem value="Cillian">Cillian</SelectItem>
                  <SelectItem value="Eleanor">Eleanor</SelectItem>
                  <SelectItem value="Jennifer">Jennifer</SelectItem>
                  <SelectItem value="Mason">Mason</SelectItem>
                  <SelectItem value="Quinn">Quinn</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="elevenlabs_api_key">ElevenLabs API Key (for background music)</Label>
              <div className="flex space-x-2">
                <input
                  id="elevenlabs_api_key"
                  type="password"
                  placeholder="Enter your ElevenLabs API key"
                  value={elevenlabsApiKey}
                  onChange={(e) => setElevenlabsApiKey(e.target.value)}
                  className="flex-1 h-9 px-3 py-2 text-sm rounded-md bg-[#1A1A19] border border-white/20 text-white"
                />
                <Button 
                  onClick={handleSaveElevenlabsKey}
                  className="bg-[#D7F266] hover:bg-[#D7F266]/90 text-[#151514]"
                >
                  Save
                </Button>
              </div>
            </div>
            
            <div className="pt-4 border-t border-white/10">
              <h3 className="text-sm font-medium mb-2">Assets to export:</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <div className="w-6 h-6 flex items-center justify-center text-[#D7F266] mr-2">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span>Preview images {Object.values(previewUrls).filter(Boolean).length} / {scriptData.scenes.length}</span>
                </div>
                
                <div className="flex items-center">
                  <div className="w-6 h-6 flex items-center justify-center text-[#D7F266] mr-2">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span>Videos {Object.values(videoUrls).filter(Boolean).length} / {scriptData.scenes.length}</span>
                </div>
                
                <div className="flex items-center">
                  <div className="w-6 h-6 flex items-center justify-center text-[#D7F266] mr-2">
                    <Music className="w-4 h-4" />
                  </div>
                  <span>Voiceovers (will be generated) {scriptData.scenes.length}</span>
                </div>
                
                <div className="flex items-center">
                  <div className="w-6 h-6 flex items-center justify-center text-[#D7F266] mr-2">
                    <Music className="w-4 h-4" />
                  </div>
                  <span>Background music (will be generated) {scriptData.scenes.length}</span>
                </div>
              </div>
            </div>
          </div>
        ) : zipFile ? (
          <div className="py-6 flex flex-col items-center justify-center space-y-4">
            <Folder className="w-16 h-16 text-[#D7F266]" />
            <h3 className="text-lg font-semibold text-center">Export Complete!</h3>
            <p className="text-white/80 text-center">
              Your project assets have been prepared for download.
            </p>
          </div>
        ) : (
          <div className="py-6 space-y-4">
            <div className="flex flex-col items-center justify-center space-y-2">
              <h3 className="text-lg font-semibold">{currentStage}</h3>
              <Progress value={overallProgress} className="w-full h-2 bg-white/10" />
              <p className="text-sm text-white/70">{overallProgress}% complete</p>
            </div>
            
            <div className="max-h-[200px] overflow-y-auto border border-white/10 rounded-md p-2 bg-black/20">
              {Object.entries(exportProgress).map(([sceneIndex, assets]) => (
                <div key={sceneIndex} className="border-b border-white/10 last:border-b-0 py-2">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-sm font-medium">Scene {parseInt(sceneIndex) + 1}</h4>
                    {(isSceneDownloadable(assets) || sceneZipFiles[parseInt(sceneIndex)]) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs bg-[#1A1A19]/50 hover:bg-[#1A1A19]"
                        onClick={() => handleDownloadScene(parseInt(sceneIndex))}
                        disabled={processingSceneDownload === parseInt(sceneIndex)}
                      >
                        {processingSceneDownload === parseInt(sceneIndex) ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <Download className="h-3 w-3 mr-1" />
                        )}
                        Download
                      </Button>
                    )}
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center">
                      {getStatusIcon(assets.preview.status)}
                      <span className="ml-2">Preview image</span>
                    </div>
                    <div className="flex items-center">
                      {getStatusIcon(assets.video.status)}
                      <span className="ml-2">Video</span>
                    </div>
                    <div className="flex items-center">
                      {getStatusIcon(assets.voiceover.status)}
                      <span className="ml-2">Voiceover</span>
                    </div>
                    <div className="flex items-center">
                      {getStatusIcon(assets.background.status)}
                      <span className="ml-2">Background music</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <p className="text-white/60 text-sm text-center">
              This may take several minutes depending on your project size.
              <br />
              Please don't close this window.
            </p>
          </div>
        )}
        
        <DialogFooter>
          {!isExporting && !zipFile ? (
            <>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button 
                onClick={startExport} 
                className="bg-[#D7F266] text-[#151514] hover:bg-[#D7F266]/80"
                disabled={!groqApiKey || !elevenlabsApiKey}
              >
                Export
              </Button>
            </>
          ) : zipFile ? (
            <>
              <Button variant="outline" onClick={handleClose}>Close</Button>
              <Button 
                onClick={handleDownload}
                className="bg-[#D7F266] text-[#151514] hover:bg-[#D7F266]/80 flex items-center gap-2"
              >
                <Download className="h-4 w-4" /> Download Assets
              </Button>
            </>
          ) : (
            <Button 
              variant="outline" 
              onClick={handleClose} 
              className="flex items-center gap-2"
            >
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssetExporter; 