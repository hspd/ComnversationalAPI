export enum AppStatus {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  LISTENING = 'LISTENING',
  SPEAKING = 'SPEAKING',
  ERROR = 'ERROR',
}

export interface TranscriptEntry {
  speaker: 'user' | 'ai';
  text: string;
}

export const PREBUILT_VOICES = ['Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir'] as const;
export type PrebuiltVoice = typeof PREBUILT_VOICES[number];

export interface VoiceOption {
    id: PrebuiltVoice;
    name: string;
}

export const VOICE_OPTIONS: VoiceOption[] = [
    { id: 'Zephyr', name: 'Zephyr (Friendly Male)' },
    { id: 'Puck', name: 'Puck (Calm Male)' },
    { id: 'Charon', name: 'Charon (Deep Male)' },
    { id: 'Kore', name: 'Kore (Warm Female)' },
    { id: 'Fenrir', name: 'Fenrir (Assertive Male)' },
];

export type Language = 'hindi' | 'marathi';

export const LANGUAGE_OPTIONS: { id: Language, name: string }[] = [
    { id: 'hindi', name: 'Hindi' },
    { id: 'marathi', name: 'Marathi' },
];
