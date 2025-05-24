import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface GeneratedMedia {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'sfx';
  src: string;
  dateCreated: Date;
  prompt: string;
  metadata?: Record<string, any>;
}

interface GeneratedMediaDB extends DBSchema {
  generatedVoiceovers: {
    key: string;
    value: GeneratedMedia;
    indexes: { 'by-date': Date };
  };
  generatedSoundEffects: {
    key: string;
    value: GeneratedMedia;
    indexes: { 'by-date': Date };
  };
  generatedVideos: {
    key: string;
    value: GeneratedMedia;
    indexes: { 'by-date': Date };
  };
}

class GeneratedMediaDBService {
  private db: Promise<IDBPDatabase<GeneratedMediaDB>>;

  constructor() {
    this.db = openDB<GeneratedMediaDB>('generatedMediaDB', 1, {
      upgrade(db) {
        // Create voiceovers store
        const voiceoversStore = db.createObjectStore('generatedVoiceovers', {
          keyPath: 'id',
        });
        voiceoversStore.createIndex('by-date', 'dateCreated');

        // Create sound effects store
        const sfxStore = db.createObjectStore('generatedSoundEffects', {
          keyPath: 'id',
        });
        sfxStore.createIndex('by-date', 'dateCreated');

        // Create videos store
        const videosStore = db.createObjectStore('generatedVideos', {
          keyPath: 'id',
        });
        videosStore.createIndex('by-date', 'dateCreated');
      },
    });
  }

  async addVoiceover(voiceover: Omit<GeneratedMedia, 'id'>) {
    const db = await this.db;
    const id = crypto.randomUUID();
    await db.add('generatedVoiceovers', { ...voiceover, id });
    return id;
  }

  async addSoundEffect(sfx: Omit<GeneratedMedia, 'id'>) {
    const db = await this.db;
    const id = crypto.randomUUID();
    await db.add('generatedSoundEffects', { ...sfx, id });
    return id;
  }

  async addVideo(video: Omit<GeneratedMedia, 'id'>) {
    const db = await this.db;
    const id = crypto.randomUUID();
    await db.add('generatedVideos', { ...video, id });
    return id;
  }

  async getAllVoiceovers() {
    const db = await this.db;
    return db.getAll('generatedVoiceovers');
  }

  async getAllSoundEffects() {
    const db = await this.db;
    return db.getAll('generatedSoundEffects');
  }

  async getAllVideos() {
    const db = await this.db;
    return db.getAll('generatedVideos');
  }

  async deleteVoiceover(id: string) {
    const db = await this.db;
    await db.delete('generatedVoiceovers', id);
  }

  async deleteSoundEffect(id: string) {
    const db = await this.db;
    await db.delete('generatedSoundEffects', id);
  }

  async deleteVideo(id: string) {
    const db = await this.db;
    await db.delete('generatedVideos', id);
  }

  async updateVoiceover(id: string, updates: Partial<GeneratedMedia>) {
    const db = await this.db;
    const voiceover = await db.get('generatedVoiceovers', id);
    if (voiceover) {
      await db.put('generatedVoiceovers', { ...voiceover, ...updates });
    }
  }

  async updateSoundEffect(id: string, updates: Partial<GeneratedMedia>) {
    const db = await this.db;
    const sfx = await db.get('generatedSoundEffects', id);
    if (sfx) {
      await db.put('generatedSoundEffects', { ...sfx, ...updates });
    }
  }

  async updateVideo(id: string, updates: Partial<GeneratedMedia>) {
    const db = await this.db;
    const video = await db.get('generatedVideos', id);
    if (video) {
      await db.put('generatedVideos', { ...video, ...updates });
    }
  }

  async getStorageStats() {
    const db = await this.db;
    const voiceovers = await db.count('generatedVoiceovers');
    const soundEffects = await db.count('generatedSoundEffects');
    const videos = await db.count('generatedVideos');

    return {
      voiceovers,
      soundEffects,
      videos,
      total: voiceovers + soundEffects + videos,
    };
  }
}

export const generatedMediaDB = new GeneratedMediaDBService();
export type { GeneratedMedia }; 