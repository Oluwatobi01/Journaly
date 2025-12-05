import { Mood } from './types';

export const MOODS: { type: Mood; emoji: string; color: string; label: string }[] = [
  { type: 'happy', emoji: '😊', color: 'bg-primary', label: 'Happy' },
  { type: 'excited', emoji: '🥳', color: 'bg-accent-purple', label: 'Excited' },
  { type: 'neutral', emoji: '😐', color: 'bg-gray-400', label: 'Neutral' },
  { type: 'tired', emoji: '🥱', color: 'bg-indigo-400', label: 'Tired' },
  { type: 'sad', emoji: '😔', color: 'bg-blue-400', label: 'Sad' },
  { type: 'anxious', emoji: '😬', color: 'bg-accent-coral', label: 'Anxious' },
  { type: 'angry', emoji: '😡', color: 'bg-red-500', label: 'Angry' },
];

export const MOCK_ENTRIES: any[] = [
  {
    id: '1',
    date: new Date(new Date().setDate(new Date().getDate() - 0)),
    summary: "Feeling pretty great today! Had a really productive morning.",
    mood: 'happy',
    messages: []
  },
  {
    id: '2',
    date: new Date(new Date().setDate(new Date().getDate() - 1)),
    summary: "A bit of a mixed day. Morning was slow but afternoon picked up.",
    mood: 'neutral',
    messages: []
  },
  {
    id: '3',
    date: new Date(new Date().setDate(new Date().getDate() - 2)),
    summary: "Woke up feeling a bit down. Gloomy weather didn't help.",
    mood: 'sad',
    messages: []
  },
  {
    id: '4',
    date: new Date(new Date().setDate(new Date().getDate() - 5)),
    summary: "Huge project finished! Celebrating with pizza.",
    mood: 'excited',
    messages: []
  }
];
