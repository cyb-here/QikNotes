import { Injectable } from '@angular/core';
import { Note, CanvasState } from '../models';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private dbName = 'WhiteboardNotesDB';
  private dbVersion = 1;

  async initializeDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains('notes')) {
          const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
          notesStore.createIndex('position', ['position.gridX', 'position.gridY']);
        }
        
        if (!db.objectStoreNames.contains('canvasState')) {
          db.createObjectStore('canvasState', { keyPath: 'id' });
        }
      };
    });
  }

  async saveNote(note: Note): Promise<void> {
    const db = await this.initializeDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['notes'], 'readwrite');
      const store = transaction.objectStore('notes');
      const request = store.put(note);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getNotes(): Promise<Note[]> {
    const db = await this.initializeDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['notes'], 'readonly');
      const store = transaction.objectStore('notes');
      const request = store.getAll();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async deleteNote(noteId: string): Promise<void> {
    const db = await this.initializeDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['notes'], 'readwrite');
      const store = transaction.objectStore('notes');
      const request = store.delete(noteId);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async saveCanvasState(state: CanvasState): Promise<void> {
    const db = await this.initializeDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['canvasState'], 'readwrite');
      const store = transaction.objectStore('canvasState');
      const request = store.put({ id: 'current', ...state });
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getCanvasState(): Promise<CanvasState | null> {
    const db = await this.initializeDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['canvasState'], 'readonly');
      const store = transaction.objectStore('canvasState');
      const request = store.get('current');
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result ? request.result : null);
    });
  }
}