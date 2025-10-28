
import React from 'react';
import { AppStatus } from '../types';

interface ControlButtonProps {
  status: AppStatus;
  onClick: () => void;
}

const MicrophoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8h-1a6 6 0 11-12 0H3a7.001 7.001 0 006 6.93V17H7a1 1 0 100 2h6a1 1 0 100-2h-2v-2.07z" clipRule="evenodd" />
    </svg>
);

const StopIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
    </svg>
);

const ControlButton: React.FC<ControlButtonProps> = ({ status, onClick }) => {
  const isConversing = status !== AppStatus.IDLE && status !== AppStatus.ERROR;
  const isDisabled = status === AppStatus.CONNECTING;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`relative rounded-full p-6 text-white transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 ${
        isDisabled
          ? 'bg-gray-600 cursor-not-allowed'
          : isConversing
          ? 'bg-red-600 hover:bg-red-700 focus:ring-red-400'
          : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-400'
      } shadow-2xl transform hover:scale-105`}
    >
      {isConversing ? <StopIcon /> : <MicrophoneIcon />}
    </button>
  );
};

export default ControlButton;
