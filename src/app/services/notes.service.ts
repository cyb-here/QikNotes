import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Note, GridPosition } from '../models';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class NotesService {
  private storage = inject(StorageService);
  private notes: Note[] = [];
  private notesSubject = new BehaviorSubject<Note[]>([]);

  constructor() {
    this.loadNotes();
  }

  getNotes(): Observable<Note[]> {
    return this.notesSubject.asObservable();
  }

  async createNote(position: GridPosition, content: string = 'New Note'): Promise<Note> {
    const newNote: Note = {
      id: this.generateId(),
      position,
      content,
      size: { width: 1, height: 1 },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.notes.push(newNote);
    await this.storage.saveNote(newNote);
    this.notesSubject.next([...this.notes]);

    return newNote;
  }

  async updateNote(noteId: string, content: string): Promise<void> {
    const noteIndex = this.notes.findIndex((n) => n.id === noteId);
    if (noteIndex !== -1) {
      // Create a new note object instead of mutating
      this.notes[noteIndex] = {
        ...this.notes[noteIndex],
        content: content,
        updatedAt: new Date()
      };
      await this.storage.saveNote(this.notes[noteIndex]);
      this.notesSubject.next([...this.notes]);
    }
  }

  async deleteNote(noteId: string): Promise<void> {
    this.notes = this.notes.filter((n) => n.id !== noteId);
    await this.storage.deleteNote(noteId);
    this.notesSubject.next([...this.notes]);
  }

  async deleteAllNotes(): Promise<void> {
    try {
      // Clear IndexedDB store
      if (this.storage && typeof this.storage.clearNotes === 'function') {
        await this.storage.clearNotes();
      } else {
        // Fallback to deleting individual notes if clearNotes is unavailable
        for (const n of [...this.notes]) {
          await this.storage.deleteNote(n.id);
        }
      }

      // Clear in-memory list and notify subscribers
      this.notes = [];
      this.notesSubject.next([]);
      console.log('All notes deleted');
    } catch (error) {
      console.error('Failed to delete all notes:', error);
      throw error;
    }
  }

  private async loadNotes(): Promise<void> {
    try {
      this.notes = await this.storage.getNotes();
      
      // Create a default welcome note if no notes exist
      if (this.notes.length === 0) {
        await this.createDefaultWelcomeNote();
      }
      
      this.notesSubject.next([...this.notes]);
    } catch (error) {
      console.error('Failed to load notes:', error);
      this.notes = [];
      this.notesSubject.next([]);
    }
  }

  private async createDefaultWelcomeNote(): Promise<void> {
    const welcomeNote: Note = {
      id: this.generateId(),
      position: { gridX: 0, gridY: 0 },
      content: 'Welcome to QikNotes\nStart typing here',
      size: { width: 1, height: 1 },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.notes.push(welcomeNote);
    await this.storage.saveNote(welcomeNote);
  }

  async updateNotePosition(noteId: string, newPosition: GridPosition): Promise<void> {
    const noteIndex = this.notes.findIndex(n => n.id === noteId);
    if (noteIndex !== -1) {
      // Create a new note object instead of mutating
      this.notes[noteIndex] = {
        ...this.notes[noteIndex],
        position: newPosition,
        updatedAt: new Date()
      };
      await this.storage.saveNote(this.notes[noteIndex]);
      this.notesSubject.next([...this.notes]);
      console.log('Note position updated:', noteId, newPosition);
    }
  }

  async updateNoteSize(noteId: string, newSize: { width: number; height: number }): Promise<void> {
    const noteIndex = this.notes.findIndex(n => n.id === noteId);
    if (noteIndex !== -1) {
      // Create a new note object instead of mutating
      this.notes[noteIndex] = {
        ...this.notes[noteIndex],
        size: newSize,
        updatedAt: new Date()
      };
      await this.storage.saveNote(this.notes[noteIndex]);
      this.notesSubject.next([...this.notes]);
      console.log('Note size updated:', noteId, newSize);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  
}
