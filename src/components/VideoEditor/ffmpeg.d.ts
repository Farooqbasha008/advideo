
declare module '@ffmpeg/ffmpeg' {
  export interface FFmpegConfig {
    log?: boolean;
    logger?: (message: any) => void;
    corePath?: string;
    progress?: (progress: { ratio: number }) => void;
    mainName?: string;
  }

  export class FFmpeg {
    constructor(config?: FFmpegConfig);
    load(): Promise<void>;
    run(...args: string[]): Promise<number>;
    FS(method: string, path: string, data?: Uint8Array): Uint8Array;
    setProgress(progress: (progress: { ratio: number }) => void): void;
    setLogger(logger: (message: any) => void): void;
    exit(): Promise<void>;
  }

  export namespace FFmpeg {
    function createFFmpeg(options?: FFmpegConfig): FFmpeg;
  }
}

declare module '@ffmpeg/core';
declare module '@ffmpeg/util';
