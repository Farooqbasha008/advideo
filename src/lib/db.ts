import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface GeneratedMedia {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'sfx';
  src: string;
  dateCreated: Date;
  prompt: string;
  metadata: {
    thumbnail?: string;
    duration?: number;
    voice?: string;
    voiceName?: string;
    voiceDescription?: string;
    trimSilence?: boolean;
    soundType?: string;
    aspectRatio?: '16:9' | '9:16' | '1:1' | '4:5' | '5:4' | '3:2' | '2:3';
    resolution?: '720p' | '1080p';
    model?: 'wan-2.1' | 'pika-v2.2';
  };
}

interface GeneratedMediaDBSchema extends DBSchema {
  media: {
    key: string;
    value: GeneratedMedia;
    indexes: {
      'by-date': Date;
      'by-type': string;
    };
  };
}

class GeneratedMediaDB {
  private db: IDBPDatabase<GeneratedMediaDBSchema> | null = null;
  private memoryCache: Map<string, GeneratedMedia> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_STORAGE_QUOTA = 500 * 1024 * 1024; // 500MB
  private readonly BATCH_SIZE = 50;

  async init() {
    if (this.db) return;

    try {
      console.log('Initializing database...');
      this.db = await openDB<GeneratedMediaDBSchema>('generated-media', 2, {
        upgrade(db, oldVersion) {
          console.log('Database upgrade triggered, old version:', oldVersion);
          // Always create the object store if it doesn't exist
          if (!db.objectStoreNames.contains('media')) {
            console.log('Creating media object store...');
            const mediaStore = db.createObjectStore('media', {
              keyPath: 'id',
            });
            mediaStore.createIndex('by-date', 'dateCreated');
            mediaStore.createIndex('by-type', 'type');
            console.log('Media object store created successfully');
          }
        },
      });

      // Verify the object store exists after initialization
      if (!this.db.objectStoreNames.contains('media')) {
        throw new Error('Failed to create media object store');
      }
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      // Clear the database and try again
      await this.clearDatabase();
      this.db = null;
      throw error;
    }
  }

  private async clearDatabase() {
    try {
      const db = await openDB<GeneratedMediaDBSchema>('generated-media', 2);
      db.close();
      await indexedDB.deleteDatabase('generated-media');
    } catch (error) {
      console.error('Error clearing database:', error);
    }
  }

  private async ensureInitialized() {
    if (!this.db) {
      console.log('Database not initialized, initializing...');
      await this.init();
    }
    if (!this.db) {
      throw new Error('Database initialization failed');
    }
    console.log('Database is initialized');
  }

  private async checkStorageQuota() {
    if (!navigator.storage || !navigator.storage.estimate) return true;
    
    const estimate = await navigator.storage.estimate();
    if (estimate.usage && estimate.quota) {
      const usagePercentage = (estimate.usage / estimate.quota) * 100;
      if (usagePercentage > 90) {
        await this.cleanupOldMedia();
      }
    }
  }

  private async cleanupOldMedia() {
    if (!this.db) return;

    const tx = this.db.transaction('media', 'readwrite');
    const store = tx.objectStore('media');
    const index = store.index('by-date');
    
    const cursor = await index.openCursor(null, 'next');
    if (cursor) {
      await cursor.delete();
    }
  }

  private async addToCache(item: GeneratedMedia) {
    this.memoryCache.set(item.id, item);
    this.cacheExpiry.set(item.id, Date.now() + this.CACHE_EXPIRY_TIME);
  }

  private async getFromCache(id: string): Promise<GeneratedMedia | null> {
    const expiry = this.cacheExpiry.get(id);
    if (expiry && expiry > Date.now()) {
      return this.memoryCache.get(id) || null;
    }
    this.memoryCache.delete(id);
    this.cacheExpiry.delete(id);
    return null;
  }

  async addMedia(media: Omit<GeneratedMedia, 'id'>) {
    await this.ensureInitialized();
    await this.checkStorageQuota();

    const id = `media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const mediaWithId = { 
      ...media, 
      id,
      dateCreated: new Date(),
      metadata: {
        ...media.metadata,
        duration: media.metadata?.duration || 0,
        thumbnail: media.metadata?.thumbnail || '',
      }
    };
    
    try {
      console.log('Adding media to database:', mediaWithId);
      await this.db!.add('media', mediaWithId);
      await this.addToCache(mediaWithId);
      console.log('Media added successfully');
      return mediaWithId;
    } catch (error) {
      console.error('Error adding media to IndexedDB:', error);
      throw error;
    }
  }

  async getMedia(id: string) {
    await this.ensureInitialized();

    const cached = await this.getFromCache(id);
    if (cached) return cached;

    try {
      const media = await this.db!.get('media', id);
      if (media) {
        await this.addToCache(media);
      }
      return media;
    } catch (error) {
      console.error('Error getting media from IndexedDB:', error);
      throw error;
    }
  }

  async getAllMedia(type?: 'video' | 'audio' | 'sfx') {
    await this.ensureInitialized();

    try {
      console.log('Fetching all media, type:', type);
      let result;
      if (type) {
        result = await this.db!.getAllFromIndex('media', 'by-type', type);
      } else {
        result = await this.db!.getAll('media');
      }
      console.log('Retrieved media:', result);
      return result;
    } catch (error) {
      console.error('Error getting all media from IndexedDB:', error);
      throw error;
    }
  }

  async deleteMedia(id: string) {
    await this.ensureInitialized();

    try {
      await this.db!.delete('media', id);
      this.memoryCache.delete(id);
      this.cacheExpiry.delete(id);
    } catch (error) {
      console.error('Error deleting media from IndexedDB:', error);
      throw error;
    }
  }

  async updateMedia(id: string, updates: Partial<GeneratedMedia>) {
    await this.ensureInitialized();

    try {
      const media = await this.getMedia(id);
      if (media) {
        const updatedMedia = { ...media, ...updates };
        await this.db!.put('media', updatedMedia);
        await this.addToCache(updatedMedia);
      }
    } catch (error) {
      console.error('Error updating media in IndexedDB:', error);
      throw error;
    }
  }

  async getStorageStats() {
    await this.ensureInitialized();

    try {
      const count = await this.db!.count('media');
      const byType = await Promise.all([
        this.db!.countFromIndex('media', 'by-type', 'video'),
        this.db!.countFromIndex('media', 'by-type', 'audio'),
        this.db!.countFromIndex('media', 'by-type', 'sfx')
      ]);

      return {
        total: count,
        videos: byType[0],
        audio: byType[1],
        sfx: byType[2],
        cacheSize: this.memoryCache.size
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      throw error;
    }
  }

  async clearCache() {
    this.memoryCache.clear();
    this.cacheExpiry.clear();
  }
}

export const generatedMediaDB = new GeneratedMediaDB();