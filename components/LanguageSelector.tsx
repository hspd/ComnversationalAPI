import React from 'react';
import { Language, LANGUAGE_OPTIONS } from '../types';

interface LanguageSelectorProps {
  selectedLanguage: Language;
  onChange: (language: Language) => void;
  disabled: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selectedLanguage, onChange, disabled }) => {
  return (
    <div className="flex flex-col items-center space-y-2">
      <label htmlFor="language-select" className="text-sm font-medium text-gray-400">
        Language
      </label>
      <select
        id="language-select"
        value={selectedLanguage}
        onChange={(e) => onChange(e.target.value as Language)}
        disabled={disabled}
        className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full max-w-xs p-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {LANGUAGE_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;
