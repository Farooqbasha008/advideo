import React, { Component, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class VideoGeneratorErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('VideoGenerator error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 space-y-4">
          <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Something went wrong with the video generator.
              <br />
              Error: {this.state.error?.message}
            </AlertDescription>
          </Alert>
          <Button
            onClick={this.handleReset}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <RefreshCw className="h-3 w-3 mr-2" />
            Reset Video Generator
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default VideoGeneratorErrorBoundary;