import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Save, Download, User, LogIn, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

interface HeaderProps {
  projectName: string;
  onRename: (name: string) => void;
  onSave: () => void;
  onExport: () => void;
  isSaving?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  projectName,
  onRename,
  onSave,
  onExport,
  isSaving = false
}) => {
  const [editMode, setEditMode] = useState(false);
  const [tempName, setTempName] = useState(projectName);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [falaiApiKey, setFalaiApiKey] = useState<string>('');
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(false);
  const { signIn, signOut } = useAuth();
  
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
  
  // Load API key from localStorage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('falai_api_key');
    if (savedApiKey) {
      setFalaiApiKey(savedApiKey);
    }
  }, []);
  
  const handleSave = () => {
    if (!user) {
      toast.info("Sign in to save your work", {
        description: "Create an account to save your projects to the cloud",
        action: {
          label: "Sign In",
          onClick: () => setShowLogin(true)
        }
      });
    }
    onSave();
  };
  
  const handleSubmitName = () => {
    if (tempName.trim()) {
      onRename(tempName);
      setEditMode(false);
    } else {
      setTempName(projectName);
      setEditMode(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmitName();
    } else if (e.key === 'Escape') {
      setTempName(projectName);
      setEditMode(false);
    }
  };
  
  const handleSignIn = async () => {
    setIsAuthLoading(true);
    try {
      const result = await signIn(email, password);
      if (result.success) {
        setShowLogin(false);
        toast.success("Signed in successfully");
      }
    } finally {
      setIsAuthLoading(false);
    }
  };
  
  const handleSignUp = async () => {
    setIsAuthLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (error) throw error;
      
      setShowLogin(false);
      toast.success("Account created", {
        description: "Please check your email to confirm your account"
      });
    } catch (error: any) {
      toast.error("Registration failed", {
        description: error.message
      });
    } finally {
      setIsAuthLoading(false);
    }
  };
  
  const handleSignOut = async () => {
    try {
      const result = await signOut();
      if (result.success) {
        toast.success('Signed out successfully');
      }
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };
  
  const handleSaveApiKey = () => {
    if (falaiApiKey.trim()) {
      localStorage.setItem('falai_api_key', falaiApiKey);
      setShowApiKeyInput(false);
      toast.success('API key saved successfully');
    } else {
      toast.error('Please enter a valid API key');
    }
  };
  
  return (
    <div className="flex items-center justify-between p-3 bg-[#000000] border-b border-white/10">
      <div className="flex items-center space-x-4">
        {editMode ? (
          <Input
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onBlur={handleSubmitName}
            onKeyDown={handleKeyDown}
            className="w-64 bg-[#000000] border-white/20 focus-visible:ring-[#C9FF00]"
            autoFocus
          />
        ) : (
          <h1
            className="text-lg font-medium text-white cursor-pointer hover:text-[#C9FF00] transition-colors flex items-center font-heading"
            onClick={() => setEditMode(true)}
          >
            {projectName}
            <span className="text-xs ml-2 text-white/40">(click to edit)</span>
          </h1>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleSave}
          disabled={isSaving}
          className="text-white border-white/20 hover:bg-[#242423] hover:text-[#C9FF00]"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save
            </>
          )}
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onExport}
          className="text-white border-white/20 hover:bg-[#242423] hover:text-[#C9FF00]"
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowApiKeyInput(true)}
          className="text-white hover:bg-[#242423] hover:text-[#C9FF00]"
        >
          <Settings className="h-4 w-4 mr-2" />
          API Key
        </Button>
        
        {user ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-white hover:bg-[#242423] hover:text-[#C9FF00]"
          >
            <User className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLogin(true)}
            className="text-white hover:bg-[#242423] hover:text-[#C9FF00]"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Sign In
          </Button>
        )}
      </div>
      
      <Dialog open={showLogin} onOpenChange={setShowLogin}>
        <DialogContent className="bg-[#000000] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-[#C9FF00] font-heading">Sign in to save your work</DialogTitle>
            <DialogDescription className="text-white/70">
              Create an account or sign in to save your projects.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="your@email.com"
                className="bg-[#000000] border-white/20 focus-visible:ring-[#C9FF00]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="bg-[#000000] border-white/20 focus-visible:ring-[#C9FF00]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              className="border-white/20"
              onClick={() => setShowLogin(false)}
            >
              Cancel
            </Button>
            
            <Button 
              onClick={handleSignIn}
              disabled={isAuthLoading}
              className="bg-[#C9FF00] text-[#000000] hover:bg-[#C9FF00]/90"
            >
              {isAuthLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleSignUp}
              disabled={isAuthLoading}
              className="bg-transparent text-white border-white/20 hover:bg-[#242423] hover:text-[#C9FF00]"
            >
              {isAuthLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showApiKeyInput && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#151514] p-6 rounded-lg shadow-lg w-[400px]">
            <h2 className="text-lg font-medium text-white mb-4">Fal.ai API Key</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  value={falaiApiKey}
                  onChange={(e) => setFalaiApiKey(e.target.value)}
                  placeholder="Enter your Fal.ai API key"
                  className="bg-[#151514] border-white/20 focus:border-[#D7F266]"
                />
                <p className="text-xs text-white/60">
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
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowApiKeyInput(false)}
                  className="text-white border-white/20 hover:bg-[#242423] hover:text-[#C9FF00]"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveApiKey}
                  disabled={!falaiApiKey.trim()}
                  className="bg-[#D7F266] text-[#151514] hover:bg-[#D7F266]/80"
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
