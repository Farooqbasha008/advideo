import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const ApiKeySettings: React.FC = () => {
  const [falaiApiKey, setFalaiApiKey] = useState<string>(() => {
    return localStorage.getItem('falai_api_key') || '';
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    try {
      localStorage.setItem('falai_api_key', falaiApiKey);
      toast.success('API key saved successfully');
    } catch (error) {
      toast.error('Failed to save API key');
      console.error('Error saving API key:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>API Keys</CardTitle>
        <CardDescription>Manage your API keys for external services</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="falai-api-key">Fal.ai API Key</Label>
          <Input
            id="falai-api-key"
            type="password"
            value={falaiApiKey}
            onChange={(e) => setFalaiApiKey(e.target.value)}
            placeholder="Enter your Fal.ai API key"
            className="bg-[#151514] border-white/20 focus:border-[#D7F266]"
          />
          <p className="text-sm text-white/60">
            Get your API key from{' '}
            <a
              href="https://fal.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#D7F266] hover:underline"
            >
              fal.ai
            </a>
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving || !falaiApiKey.trim()}
          className="bg-[#D7F266] text-[#151514] hover:bg-[#D7F266]/80"
        >
          {isSaving ? 'Saving...' : 'Save API Key'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ApiKeySettings; 