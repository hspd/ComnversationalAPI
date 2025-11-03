import React, { useRef, useEffect } from 'react';
import { TranscriptEntry } from '../types';

interface TranscriptViewProps {
  transcript: TranscriptEntry[];
}

const TranscriptView: React.FC<TranscriptViewProps> = ({ transcript }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  return (
    <div className="flex-grow bg-gray-800/50 rounded-lg p-6 overflow-y-auto w-full max-w-4xl space-y-4 shadow-inner">
      {transcript.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-400">Conversation transcript will appear here.</p>
        </div>
      ) : (
        transcript.map((entry, index) => {
          if (entry.speaker === 'system') {
            return (
              <div key={index} className="text-center my-2">
                <p className="text-xs text-gray-500 italic px-4 py-1 bg-gray-700/50 rounded-full inline-block">
                  {entry.text}
                </p>
              </div>
            );
          }
          return (
            <div
              key={index}
              className={`flex flex-col ${
                entry.speaker === 'user' ? 'items-start' : 'items-end'
              }`}
            >
              <div
                className={`rounded-lg px-4 py-2 max-w-[80%] ${
                  entry.speaker === 'user'
                    ? 'bg-blue-600/70 text-white rounded-br-none'
                    : 'bg-gray-600/70 text-gray-200 rounded-bl-none'
                }`}
              >
                <p className="text-sm font-bold capitalize mb-1">
                  {entry.speaker === 'ai' ? 'Impetus AI' : 'Customer'}
                </p>
                <p>{entry.text}</p>
              </div>
            </div>
          );
        })
      )}
      <div ref={endOfMessagesRef} />
    </div>
  );
};

export default TranscriptView;
