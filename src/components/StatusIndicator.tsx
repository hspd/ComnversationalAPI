import React from 'react';
import { AppStatus } from '../types';

interface StatusIndicatorProps {
  status: AppStatus;
}

const statusConfig = {
  [AppStatus.IDLE]: { text: 'Ready to Start', color: 'bg-gray-500' },
  [AppStatus.CONNECTING]: { text: 'Connecting...', color: 'bg-yellow-500 animate-pulse' },
  [AppStatus.LISTENING]: { text: 'Listening...', color: 'bg-blue-500 animate-pulse' },
  [AppStatus.SPEAKING]: { text: 'Speaking...', color: 'bg-green-500' },
  [AppStatus.CALLING]: { text: 'Connecting Call...', color: 'bg-teal-500 animate-pulse' },
  [AppStatus.ERROR]: { text: 'Error', color: 'bg-red-500' },
};

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status }) => {
  const { text, color } = statusConfig[status];

  return (
    <div className="flex items-center justify-center space-x-3 mb-4">
      <div className={`w-4 h-4 rounded-full ${color} transition-colors duration-300`}></div>
      <span className="text-lg text-gray-300 font-medium">{text}</span>
    </div>
  );
};

export default StatusIndicator;
