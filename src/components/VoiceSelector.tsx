import React from 'react';
import { PrebuiltVoice, VOICE_OPTIONS } from '../types';

interface VoiceSelectorProps {
  selectedVoice: PrebuiltVoice;
  onChange: (voice: PrebuiltVoice) => void;
  disabled: boolean;
}

const VoiceSelector: React.FC<VoiceSelectorProps> = ({ selectedVoice, onChange, disabled }) => {
  return (
    <div className="flex flex-col items-center space-y-2">
      <label htmlFor="voice-select" className="text-sm font-medium text-gray-400">
        Assistant Voice
      </label>
      <select
        id="voice-select"
        value={selectedVoice}
        onChange={(e) => onChange(e.target.value as PrebuiltVoice)}
        disabled={disabled}
        className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full max-w-xs p-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {VOICE_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default VoiceSelector;