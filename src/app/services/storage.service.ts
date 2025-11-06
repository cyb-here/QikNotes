import { Injectable } from '@angular/core';
import { Note, CanvasState } from '../models';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private dbName = 'WhiteboardNotesDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  async initializeDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event: any) => {
        console.log('IndexedDB upgrade needed');
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains('notes')) {
          console.log('Creating notes store');
          const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
          notesStore.createIndex('position', ['position.gridX', 'position.gridY']);
        }
        
        if (!db.objectStoreNames.contains('canvasState')) {
          console.log('Creating canvasState store');
          db.createObjectStore('canvasState', { keyPath: 'id' });
        }
      };
    });
  }

  async saveNote(note: Note): Promise<void> {
    try {
      const db = await this.initializeDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['notes'], 'readwrite');
        const store = transaction.objectStore('notes');
        const request = store.put(note);
        
        request.onerror = () => {
          console.error('Error saving note:', request.error);
          reject(request.error);
        };
        request.onsuccess = () => {
          console.log('Note saved successfully:', note.id);
          resolve();
        };
      });
    } catch (error) {
      console.error('Failed to save note:', error);
      throw error;
    }
  }

  async getNotes(): Promise<Note[]> {
    try {
      const db = await this.initializeDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['notes'], 'readonly');
        const store = transaction.objectStore('notes');
        const request = store.getAll();
        
        request.onerror = () => {
          console.error('Error getting notes:', request.error);
          reject(request.error);
        };
        request.onsuccess = () => {
          console.log('Notes retrieved:', request.result.length);
          resolve(request.result);
        };
      });
    } catch (error) {
      console.error('Failed to get notes:', error);
      return [];
    }
  }

  async deleteNote(noteId: string): Promise<void> {
    try {
      const db = await this.initializeDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['notes'], 'readwrite');
        const store = transaction.objectStore('notes');
        const request = store.delete(noteId);
        
        request.onerror = () => {
          console.error('Error deleting note:', request.error);
          reject(request.error);
        };
        request.onsuccess = () => {
          console.log('Note deleted:', noteId);
          resolve();
        };
      });
    } catch (error) {
      console.error('Failed to delete note:', error);
      throw error;
    }
  }

  async saveCanvasState(state: CanvasState): Promise<void> {
    try {
      const db = await this.initializeDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['canvasState'], 'readwrite');
        const store = transaction.objectStore('canvasState');
        const request = store.put({ id: 'current', ...state });
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.error('Failed to save canvas state:', error);
    }
  }

  async getCanvasState(): Promise<CanvasState | null> {
    try {
      const db = await this.initializeDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['canvasState'], 'readonly');
        const store = transaction.objectStore('canvasState');
        const request = store.get('current');
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result ? request.result : null);
      });
    } catch (error) {
      console.error('Failed to get canvas state:', error);
      return null;
    }
  }
}