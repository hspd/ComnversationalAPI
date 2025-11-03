import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AppStatus, TranscriptEntry, PrebuiltVoice, Language } from './types';
import { GeminiService } from './services/geminiService';
import { decode, decodeAudioData } from './utils/audioUtils';
import StatusIndicator from './components/StatusIndicator';
import TranscriptView from './components/TranscriptView';
import ControlButton from './components/ControlButton';
import { LiveServerMessage } from '@google/genai';
import VoiceSelector from './components/VoiceSelector';
import LanguageSelector from './components/LanguageSelector';
import NameModal from './components/NameModal';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<PrebuiltVoice>('Zephyr');
  const [language, setLanguage] = useState<Language>('hindi');
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [callingInfo, setCallingInfo] = useState<{ phoneNumber: string; callId: string } | null>(null);

  const geminiServiceRef = useRef<GeminiService | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextAudioStartTimeRef = useRef<number>(0);
  
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');

  const cleanup = useCallback(() => {
    geminiServiceRef.current?.close();
    geminiServiceRef.current = null;
    
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
      outputAudioContextRef.current.close();
    }
    outputAudioContextRef.current = null;
    
    audioSourcesRef.current.forEach(source => source.stop());
    audioSourcesRef.current.clear();
    nextAudioStartTimeRef.current = 0;
    setCallingInfo(null);
  }, []);

  const handleMessage = useCallback(async (message: LiveServerMessage) => {
    if (message.serverContent?.outputTranscription) {
      const text = message.serverContent.outputTranscription.text;
      currentOutputTranscriptionRef.current += text;
      setStatus(AppStatus.SPEAKING);
    }
    if (message.serverContent?.inputTranscription) {
        const text = message.serverContent.inputTranscription.text;
        currentInputTranscriptionRef.current += text;
        setStatus(AppStatus.LISTENING);
    }
    
    if (message.serverContent?.turnComplete) {
      const finalInput = currentInputTranscriptionRef.current.trim();
      const finalOutput = currentOutputTranscriptionRef.current.trim();
      
      setTranscript(prev => {
        const newTranscript = [...prev];
        if (finalInput) newTranscript.push({ speaker: 'user', text: finalInput });
        if (finalOutput) newTranscript.push({ speaker: 'ai', text: finalOutput });
        return newTranscript;
      });
      
      currentInputTranscriptionRef.current = '';
      currentOutputTranscriptionRef.current = '';
      setStatus(AppStatus.LISTENING);
    }

    if (message.toolCall) {
      for (const fc of message.toolCall.functionCalls) {
        if (fc.name === 'connectCall') {
          console.log('Function Call requested: connectCall', fc.args);
          setStatus(AppStatus.CALLING);
          const phoneNumber = (fc.args.phoneNumber as string) || 'the payment line';
          setTranscript(prev => [...prev, { speaker: 'system', text: `Connecting call to ${phoneNumber}...` }]);
          setCallingInfo({ phoneNumber, callId: fc.id });
        }
      }
    }

    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
    if (base64Audio && outputAudioContextRef.current) {
        const audioBuffer = await decodeAudioData(
            decode(base64Audio),
            outputAudioContextRef.current,
            24000,
            1,
        );

        nextAudioStartTimeRef.current = Math.max(
            nextAudioStartTimeRef.current,
            outputAudioContextRef.current.currentTime,
        );

        const source = outputAudioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(outputAudioContextRef.current.destination);
        source.addEventListener('ended', () => {
            audioSourcesRef.current.delete(source);
        });
        
        source.start(nextAudioStartTimeRef.current);
        nextAudioStartTimeRef.current += audioBuffer.duration;
        audioSourcesRef.current.add(source);
    }
  }, []);
  
  useEffect(() => {
    if (status === AppStatus.CALLING && callingInfo) {
      const timerId = setTimeout(() => {
        if (geminiServiceRef.current) {
          geminiServiceRef.current.sendToolResponse(callingInfo.callId, 'connectCall', 'ok, the user has been connected.');
        }
        setCallingInfo(null);
        setStatus(AppStatus.LISTENING);
      }, 3000); // Simulate 3 second connection delay

      return () => clearTimeout(timerId);
    }
  }, [status, callingInfo]);

  const handleCancelCall = useCallback(() => {
    if (!callingInfo) return;

    if (geminiServiceRef.current) {
      geminiServiceRef.current.sendToolResponse(callingInfo.callId, 'connectCall', 'ok, the user cancelled the call.');
    }
    setTranscript(prev => [...prev, { speaker: 'system', text: `Call cancelled.` }]);
    setCallingInfo(null);
    setStatus(AppStatus.LISTENING);
  }, [callingInfo]);

  const startConversation = useCallback(async (customerName: string) => {
    setStatus(AppStatus.CONNECTING);
    setErrorMessage(null);
    try {
      geminiServiceRef.current = new GeminiService();
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      await geminiServiceRef.current.connect({
        onOpen: () => setStatus(AppStatus.LISTENING),
        onMessage: handleMessage,
        onError: (e) => {
          console.error("Connection error:", e);
          setErrorMessage("Connection to the AI service failed. This could be a network issue or an invalid API key. Please try again.");
          setStatus(AppStatus.ERROR);
          cleanup();
        },
        onClose: () => {
          setStatus(AppStatus.IDLE);
          cleanup();
        },
      }, selectedVoice, customerName, language);
    } catch (error) {
      console.error("Failed to start conversation:", error);
      const message = error instanceof Error ? error.message : "An unknown error occurred during setup.";
      setErrorMessage(message);
      setStatus(AppStatus.ERROR);
      cleanup();
    }
  }, [cleanup, handleMessage, selectedVoice, language]);
  
  const handleStartFlow = (name: string) => {
    setIsNameModalOpen(false);
    startConversation(name);
  };

  const stopConversation = useCallback(() => {
    cleanup();
    setStatus(AppStatus.IDLE);
    setTranscript([]);
  }, [cleanup]);

  const handleToggleConversation = useCallback(() => {
    const isConversing = status !== AppStatus.IDLE && status !== AppStatus.ERROR;
    if (isConversing) {
      stopConversation();
    } else {
      setErrorMessage(null);
      setIsNameModalOpen(true);
    }
  }, [status, stopConversation]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return (
    <>
      <NameModal
        isOpen={isNameModalOpen}
        onConfirm={handleStartFlow}
        onClose={() => setIsNameModalOpen(false)}
      />
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-gray-100 p-4 font-sans">
        <div className="w-full max-w-4xl flex flex-col items-center text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-bold text-white">Impetus AI Assistant</h1>
          <p className="text-lg text-gray-400 mt-2">Your partner in resolving outstanding payments.</p>
        </div>

        <div className="w-full max-w-4xl h-[50vh] flex flex-col bg-gray-800 rounded-xl shadow-2xl p-4 mb-6">
          <TranscriptView transcript={transcript} />
        </div>

        <div className="w-full max-w-4xl flex flex-col items-center">
          <StatusIndicator status={status} />
          {status === AppStatus.ERROR && errorMessage && (
            <div className="mt-4 text-center text-red-300 bg-red-900/50 p-3 rounded-lg max-w-md shadow-lg">
              <p className="font-semibold">Error</p>
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}
          
          {status === AppStatus.CALLING && callingInfo ? (
            <div className="my-6 w-full max-w-sm flex flex-col items-center text-center gap-4 p-6 bg-gray-700/50 rounded-lg shadow-lg animate-pulse">
               <div className="flex items-center gap-3">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-400" viewBox="0 0 20 20" fill="currentColor">
                       <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                   </svg>
                   <p className="text-lg text-gray-200">Connecting to {callingInfo.phoneNumber}...</p>
               </div>
               <button 
                   onClick={handleCancelCall}
                   className="mt-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-8 rounded-lg transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75"
               >
                   Cancel
               </button>
           </div>
          ) : (
            <>
              <div className="my-6 flex flex-col sm:flex-row gap-6">
                <LanguageSelector
                  selectedLanguage={language}
                  onChange={setLanguage}
                  disabled={status !== AppStatus.IDLE && status !== AppStatus.ERROR}
                />
                <VoiceSelector
                  selectedVoice={selectedVoice}
                  onChange={setSelectedVoice}
                  disabled={status !== AppStatus.IDLE && status !== AppStatus.ERROR}
                />
              </div>
              <div>
                <ControlButton status={status} onClick={handleToggleConversation} />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default App;
