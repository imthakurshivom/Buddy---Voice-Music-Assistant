import React from 'react';
import { AssistantState } from '../types';
import { Mic, Sparkles, Volume2, Loader2, Radio } from 'lucide-react';

interface BuddyOrbProps {
  state: AssistantState;
  wakeWordDetected: boolean;
  onOrbClick: () => void;
  isListening: boolean;
  transcript: string;
}

export const BuddyOrb: React.FC<BuddyOrbProps> = ({
  state,
  wakeWordDetected,
  onOrbClick,
  isListening,
  transcript,
}) => {
  const isListeningState = state === 'active_listening';
  const isProcessing = state === 'processing';
  const isSpeaking = state === 'speaking';
  const isWaitingWake = state === 'listening_wake';

  return (
    <div
      id="buddy-orb-container"
      className="w-full flex flex-col items-center justify-center relative py-2"
    >
      {/* Siri Ambient Radial Glow */}
      <div
        className={`absolute w-44 h-44 rounded-full filter blur-3xl pointer-events-none transition-all duration-700 ${
          isListeningState
            ? 'opacity-80 scale-125 bg-gradient-to-r from-blue-500 via-indigo-500 to-pink-500'
            : isSpeaking
            ? 'opacity-70 scale-110 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400'
            : isProcessing
            ? 'opacity-70 scale-110 bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400'
            : 'opacity-40 scale-100 bg-gradient-to-r from-indigo-500/60 via-purple-500/40 to-pink-500/40'
        }`}
      />

      {/* Main Voice Orb Tap Target */}
      <div className="relative group flex flex-col items-center">
        {/* Animated Spherical Orb */}
        <button
          id="buddy-orb-btn"
          onClick={onOrbClick}
          className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full cursor-pointer transition-transform duration-300 active:scale-95 flex items-center justify-center p-1.5 focus:outline-none ${
            isListeningState ? 'scale-105' : 'hover:scale-102'
          }`}
          title="Tap to talk to Buddy (or say 'Hey Buddy')"
        >
          {/* Multi-layer Wave Rings */}
          <div
            className={`absolute inset-0 rounded-full border border-white/20 transition-all duration-500 ${
              isListeningState
                ? 'animate-ping opacity-60 border-cyan-400'
                : isProcessing
                ? 'animate-spin border-purple-400 opacity-60'
                : 'opacity-20'
            }`}
          />

          {/* Outer Iridescent Core */}
          <div
            className={`w-full h-full rounded-full relative overflow-hidden shadow-2xl transition-all duration-500 ${
              isListeningState
                ? 'shadow-[0_0_50px_rgba(0,122,255,0.8),0_0_80px_rgba(255,45,85,0.6)]'
                : isSpeaking
                ? 'shadow-[0_0_50px_rgba(255,45,85,0.7),0_0_80px_rgba(175,82,222,0.6)]'
                : 'shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_30px_rgba(120,119,198,0.3)]'
            }`}
          >
            {/* Multi-layered Rotating Fluid Gradient */}
            <div
              className={`absolute inset-[-50%] w-[200%] h-[200%] rounded-full animate-siri opacity-95 filter blur-md ${
                isListeningState
                  ? 'bg-[radial-gradient(circle_at_center,_#007aff_0%,_#5ac8fa_25%,_#af52de_50%,_#ff2d55_75%,_#34c759_100%)]'
                  : isSpeaking
                  ? 'bg-[radial-gradient(circle_at_center,_#ff2d55_0%,_#ff9500_25%,_#af52de_55%,_#007aff_80%,_#5856d6_100%)]'
                  : isProcessing
                  ? 'bg-[radial-gradient(circle_at_center,_#af52de_0%,_#ff2d55_35%,_#5856d6_70%,_#007aff_100%)]'
                  : 'bg-[radial-gradient(circle_at_center,_#5856d6_0%,_#af52de_30%,_#007aff_60%,_#ff2d55_85%,_#1c1c1e_100%)]'
              }`}
            />

            {/* Glass Specular Sheen */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/35 via-transparent to-black/50 pointer-events-none" />
            <div className="absolute top-1 left-3 right-3 h-10 rounded-full bg-gradient-to-b from-white/40 to-transparent blur-[1px] pointer-events-none" />

            {/* Center Dynamic Icon / Waveform */}
            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center text-white">
              {isListeningState ? (
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-6 bg-white rounded-full animate-pulse" />
                  <span className="w-1.5 h-10 bg-white rounded-full animate-pulse [animation-delay:150ms]" />
                  <span className="w-1.5 h-7 bg-white rounded-full animate-pulse [animation-delay:300ms]" />
                  <span className="w-1.5 h-11 bg-white rounded-full animate-pulse [animation-delay:450ms]" />
                  <span className="w-1.5 h-5 bg-white rounded-full animate-pulse [animation-delay:200ms]" />
                </div>
              ) : isProcessing ? (
                <Loader2 className="w-9 h-9 animate-spin text-white drop-shadow-md" />
              ) : isSpeaking ? (
                <Volume2 className="w-9 h-9 animate-pulse text-white drop-shadow-md" />
              ) : (
                <div className="flex flex-col items-center">
                  <Mic className="w-8 h-8 text-white/95 drop-shadow group-hover:scale-110 transition-transform duration-200" />
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-white/90 mt-1 font-mono">
                    Buddy • Voice
                  </span>
                </div>
              )}
            </div>
          </div>
        </button>

        {/* Capsule Status Pill */}
        <div className="mt-3 flex flex-col items-center">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-xl border transition-all ${
              isListeningState
                ? 'bg-[#007aff]/25 border-[#007aff]/50 text-[#5ac8fa] shadow-[0_0_20px_rgba(0,122,255,0.4)]'
                : isProcessing
                ? 'bg-[#af52de]/25 border-[#af52de]/50 text-[#d187ff]'
                : isSpeaking
                ? 'bg-[#ff2d55]/25 border-[#ff2d55]/50 text-[#ff8099]'
                : isWaitingWake
                ? 'bg-[#30d158]/20 border-[#30d158]/40 text-[#30d158]'
                : 'bg-white/10 border-white/15 text-white/80'
            }`}
          >
            {isListeningState ? (
              <>
                <span className="w-2 h-2 rounded-full bg-[#007aff] animate-ping" />
                <span>Listening for song command...</span>
              </>
            ) : isProcessing ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-[#af52de]" />
                <span>Finding original track...</span>
              </>
            ) : isSpeaking ? (
              <>
                <Volume2 className="w-3 h-3 animate-pulse text-[#ff2d55]" />
                <span>Buddy responding...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 text-[#30d158]" />
                <span>Say "Hey Buddy" or tap Orb</span>
              </>
            )}
          </div>

          {/* Transcript / Subtitle */}
          {transcript && (
            <p className="mt-2 text-xs text-white/90 bg-white/10 border border-white/15 px-3.5 py-1.5 rounded-full max-w-sm text-center truncate backdrop-blur-md">
              "{transcript}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
