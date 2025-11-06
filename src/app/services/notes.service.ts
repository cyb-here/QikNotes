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
      size: { width: 2, height: 2 },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.notes.push(newNote);
    await this.storage.saveNote(newNote);
    this.notesSubject.next([...this.notes]);

    return newNote;
  }

  async updateNote(noteId: string, content: string): Promise<void> {
    const note = this.notes.find((n) => n.id === noteId);
    if (note) {
      note.content = content;
      note.updatedAt = new Date();
      await this.storage.saveNote(note);
      this.notesSubject.next([...this.notes]);
    }
  }

  async deleteNote(noteId: string): Promise<void> {
    this.notes = this.notes.filter((n) => n.id !== noteId);
    await this.storage.deleteNote(noteId);
    this.notesSubject.next([...this.notes]);
  }

  private async loadNotes(): Promise<void> {
    try {
      this.notes = await this.storage.getNotes();
      this.notesSubject.next([...this.notes]);
    } catch (error) {
      console.error('Failed to load notes:', error);
      this.notes = [];
      this.notesSubject.next([]);
    }
  }

  async updateNotePosition(noteId: string, newPosition: GridPosition): Promise<void> {
  const note = this.notes.find(n => n.id === noteId);
  if (note) {
    note.position = newPosition;
    note.updatedAt = new Date();
    await this.storage.saveNote(note);
    this.notesSubject.next([...this.notes]);
    console.log('Note position updated:', noteId, newPosition);
  }
}

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  
}
