import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AssistantState, VoiceLog, AssistantResponse, Track } from '../types';
import { playWakeChime, playActionChime, speakAssistantText, getActiveVoiceInfo } from '../utils/audioChime';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  Volume2,
  Volume1,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Sliders,
  Flame,
  Heart,
  Music,
  Disc,
  Radio,
} from 'lucide-react';

interface VoiceControllerProps {
  assistantState: AssistantState;
  setAssistantState: (state: AssistantState) => void;
  currentTrack?: Track;
  isPlaying: boolean;
  onPlaySongOrGenre: (query: string) => void;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onVolumeChange: (change: 'up' | 'down' | 'mute' | number) => void;
  onAddLog: (log: Omit<VoiceLog, 'id' | 'timestamp'>) => void;
  liveTranscript: string;
  setLiveTranscript: (t: string) => void;
}

// Check for Web Speech Recognition API
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SpeechRecognitionAPI = typeof window !== 'undefined' ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null;

export const VoiceController: React.FC<VoiceControllerProps> = ({
  assistantState,
  setAssistantState,
  currentTrack,
  isPlaying,
  onPlaySongOrGenre,
  onPlay,
  onPause,
  onNext,
  onPrev,
  onVolumeChange,
  onAddLog,
  liveTranscript,
  setLiveTranscript,
}) => {
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [manualInput, setManualInput] = useState('');
  const [voiceFeedbackEnabled, setVoiceFeedbackEnabled] = useState(true);
  const [voiceLabel, setVoiceLabel] = useState('Indian English / Hindi Female');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const wakeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMicEnabledRef = useRef(isMicEnabled);
  isMicEnabledRef.current = isMicEnabled;
  const handleSpeechResultRef = useRef<(rawTranscript: string) => void>(() => {});

  // Monitor available voices for Indian female voice display
  useEffect(() => {
    const updateVoiceLabel = () => {
      const info = getActiveVoiceInfo();
      setVoiceLabel(info.name);
    };
    updateVoiceLabel();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoiceLabel;
    }
  }, []);

  // Check speech recognition support
  useEffect(() => {
    if (!SpeechRecognitionAPI) {
      setSpeechSupported(false);
    }
  }, []);

  // Execute Parsed Voice Command Intent
  const executeAssistantCommand = useCallback((res: AssistantResponse) => {
    // Ensure play voice response strictly says: "Buddy is playing [song/query]"
    if (res.action === 'search_play') {
      const q = res.query || 'music';
      if (!res.buddyReply || res.buddyReply.toLowerCase().includes('newpipe') || res.buddyReply.toLowerCase().includes('streaming')) {
        res.buddyReply = `Buddy is playing ${q}`;
      }
    }

    // 1. Spoken TTS feedback
    if (voiceFeedbackEnabled && res.buddyReply) {
      setAssistantState('speaking');
      speakAssistantText(res.buddyReply, () => {
        setAssistantState(isMicEnabledRef.current ? 'listening_wake' : 'idle');
      });
    }

    // 2. Execute player control
    playActionChime();

    switch (res.action) {
      case 'search_play':
        onPlaySongOrGenre(res.query || '90s bollywood hits');
        break;
      case 'play':
        onPlay();
        break;
      case 'pause':
        onPause();
        break;
      case 'next':
        onNext();
        break;
      case 'previous':
        onPrev();
        break;
      case 'volume_up':
        onVolumeChange('up');
        break;
      case 'volume_down':
        onVolumeChange('down');
        break;
      case 'mute':
        onVolumeChange('mute');
        break;
      case 'chat':
      default:
        break;
    }

    onAddLog({
      type: 'reply',
      text: res.buddyReply,
      actionExecuted: res.action,
    });
  }, [voiceFeedbackEnabled, setAssistantState, onPlaySongOrGenre, onPlay, onPause, onNext, onPrev, onVolumeChange, onAddLog]);

  // Process voice text through Gemini API or regex fallback
  const processVoiceCommand = useCallback(async (commandText: string) => {
    setAssistantState('processing');
    onAddLog({
      type: 'command',
      text: `Command: "${commandText}"`,
    });

    try {
      const response = await fetch('/api/assistant/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: commandText,
          isPlaying,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data: AssistantResponse = await response.json();
      executeAssistantCommand(data);
    } catch {
      // Clean fallback to fast client-side natural language parser
      const lower = commandText.toLowerCase();
      let action: AssistantResponse['action'] = 'chat';
      let buddyReply = 'Maine sun liya, Buddy is playing your music.';
      let query = '';

      if (lower.includes('play') || lower.includes('chalao') || lower.includes('bajao') || lower.includes('sunao')) {
        action = 'search_play';
        query = lower
          .replace(/hey buddy|buddy|play|chalao|bajao|sunao|karo|song|gaana/gi, '')
          .trim() || '90s bollywood hits';
        buddyReply = `Buddy is playing ${query}`;
      } else if (lower.includes('pause') || lower.includes('stop') || lower.includes('roko')) {
        action = 'pause';
        buddyReply = 'Playback paused.';
      } else if (lower.includes('resume') || lower.includes('unpause')) {
        action = 'play';
        buddyReply = 'Resuming music stream.';
      } else if (lower.includes('next') || lower.includes('agla')) {
        action = 'next';
        buddyReply = 'Playing next song.';
      } else if (lower.includes('previous') || lower.includes('prev') || lower.includes('pichla')) {
        action = 'previous';
        buddyReply = 'Playing previous song.';
      } else if (lower.includes('volume up') || lower.includes('awaz badhao') || lower.includes('louder')) {
        action = 'volume_up';
        buddyReply = 'Increasing volume.';
      } else if (lower.includes('volume down') || lower.includes('awaz kam')) {
        action = 'volume_down';
        buddyReply = 'Decreasing volume.';
      } else if (lower.includes('mute') || lower.includes('shant')) {
        action = 'mute';
        buddyReply = 'Audio muted.';
      } else if (lower.includes('unmute') || lower.includes('sound on') || lower.includes('awaz chalu')) {
        action = 'volume_up';
        buddyReply = 'Audio unmuted.';
      }

      executeAssistantCommand({
        action,
        query,
        buddyReply,
      });
    }
  }, [isPlaying, executeAssistantCommand, setAssistantState, onAddLog]);

  // Handle incoming speech
  const handleSpeechResult = useCallback((rawTranscript: string) => {
    const text = rawTranscript.trim();
    setLiveTranscript(text);
    const lower = text.toLowerCase();

    // Wake word check
    const hasWakeWord = lower.includes('hey buddy') || lower.includes('buddy') || lower.includes('siri');

    if (hasWakeWord) {
      setWakeWordDetected(true);
      playWakeChime();
      setAssistantState('active_listening');

      // Strip wake word
      const commandPart = text.replace(/^(.*)(hey buddy|buddy|siri)(.*)$/i, '$3').trim();

      if (commandPart.length > 2) {
        // Direct command accompanied with wake word
        setWakeWordDetected(false);
        processVoiceCommand(commandPart);
      } else {
        // Wait 5 seconds for subsequent command
        if (wakeTimerRef.current) clearTimeout(wakeTimerRef.current);
        wakeTimerRef.current = setTimeout(() => {
          setWakeWordDetected(false);
          setAssistantState('listening_wake');
        }, 5000);
      }
    } else if (wakeWordDetected || assistantState === 'active_listening') {
      // User is in active speaking window after wake word
      setWakeWordDetected(false);
      if (wakeTimerRef.current) clearTimeout(wakeTimerRef.current);
      processVoiceCommand(text);
    }
  }, [assistantState, processVoiceCommand, setAssistantState, setLiveTranscript, wakeWordDetected]);

  handleSpeechResultRef.current = handleSpeechResult;

  // Setup Continuous Speech Recognition
  useEffect(() => {
    if (!SpeechRecognitionAPI) return;

    if (isMicEnabled) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const recognition = new (SpeechRecognitionAPI as any)();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-IN'; // Works seamlessly with Hinglish & English

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              handleSpeechResultRef.current(transcript);
            } else {
              interimTranscript += transcript;
            }
          }
          if (interimTranscript) {
            setLiveTranscript(interimTranscript);
          }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onerror = (event: any) => {
          if (event.error !== 'no-speech') {
            console.debug('Speech recognition event:', event.error);
          }
        };

        recognition.onend = () => {
          // Keep persistent wake-word listener alive
          if (isMicEnabledRef.current) {
            try {
              recognition.start();
            } catch {
              // Ignore if already started
            }
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
        setAssistantState('listening_wake');
        playWakeChime();

        onAddLog({
          type: 'wake',
          text: 'Mic turned ON: Buddy is listening for "Hey Buddy"...',
        });
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
        setAssistantState('idle');
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, [isMicEnabled, setAssistantState, onAddLog, setLiveTranscript]);

  const toggleMic = () => {
    setIsMicEnabled(!isMicEnabled);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    const cmd = manualInput.trim();
    setManualInput('');
    processVoiceCommand(cmd);
  };

  // Dynamic Quick Action suggestions that intelligently change as per music interest
  const quickActionSuggestions = useMemo(() => {
    const suggestions: Array<{
      label: string;
      query: string;
      icon: React.ComponentType<{ className?: string }>;
      interestTag: string;
      tagColor: string;
    }> = [];

    // Current Track Contextual Interest
    const artist = currentTrack?.artist ? currentTrack.artist.split(',')[0].trim() : 'Arijit Singh';
    const genre = currentTrack?.genre || 'Trending Hits';
    const lowerGenre = genre.toLowerCase();
    const lowerArtist = artist.toLowerCase();

    // 1. Dynamic Artist Suggestion
    if (artist) {
      suggestions.push({
        label: `More by ${artist}`,
        query: `play ${artist} songs`,
        icon: Sparkles,
        interestTag: 'Artist',
        tagColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      });
    }

    // 2. Dynamic Genre / Mood Interest Suggestion
    if (lowerGenre.includes('romantic') || lowerArtist.includes('arijit') || lowerArtist.includes('mithoon')) {
      suggestions.push({
        label: 'Romantic Bollywood',
        query: 'play romantic bollywood hits',
        icon: Heart,
        interestTag: 'Romantic',
        tagColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      });
      suggestions.push({
        label: 'Play Apna Bana Le',
        query: 'play Apna Bana Le',
        icon: Music,
        interestTag: 'Soulful',
        tagColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      });
    } else if (lowerGenre.includes('punjabi') || lowerArtist.includes('dhillon') || lowerArtist.includes('gill')) {
      suggestions.push({
        label: 'Punjabi Bangers',
        query: 'play Punjabi hits',
        icon: Flame,
        interestTag: 'Punjabi',
        tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      });
      suggestions.push({
        label: 'Play Excuses',
        query: 'play Excuses',
        icon: Music,
        interestTag: 'Urban Beat',
        tagColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      });
    } else if (lowerGenre.includes('lofi') || lowerGenre.includes('chill') || lowerGenre.includes('focus')) {
      suggestions.push({
        label: 'Lo-Fi Chill Beats',
        query: 'play lofi chill beats',
        icon: Disc,
        interestTag: 'Chill',
        tagColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      });
      suggestions.push({
        label: 'Study Focus',
        query: 'play study focus music',
        icon: Radio,
        interestTag: 'Focus',
        tagColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      });
    } else {
      suggestions.push({
        label: 'Top Trending Hits',
        query: 'play trending hits',
        icon: Flame,
        interestTag: 'Hot Now',
        tagColor: 'bg-red-500/20 text-red-300 border-red-500/30',
      });
      suggestions.push({
        label: 'Pop Romance Hits',
        query: 'play pop romance songs',
        icon: Heart,
        interestTag: 'Vibe',
        tagColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      });
    }

    // 3. Playback Controls matched directly to active state
    if (isPlaying) {
      suggestions.push({
        label: 'Pause Karo',
        query: 'pause',
        icon: Pause,
        interestTag: 'Control',
        tagColor: 'bg-white/10 text-white/80 border-white/10',
      });
    } else {
      suggestions.push({
        label: 'Play / Resume',
        query: 'resume',
        icon: Play,
        interestTag: 'Control',
        tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      });
    }

    suggestions.push({
      label: 'Next Song',
      query: 'next song',
      icon: SkipForward,
      interestTag: 'Control',
      tagColor: 'bg-white/10 text-white/80 border-white/10',
    });

    suggestions.push({
      label: 'Previous Song',
      query: 'previous song',
      icon: SkipBack,
      interestTag: 'Control',
      tagColor: 'bg-white/10 text-white/80 border-white/10',
    });

    suggestions.push({
      label: 'Awaaz Badhao',
      query: 'volume up',
      icon: Volume2,
      interestTag: 'Audio',
      tagColor: 'bg-white/10 text-white/80 border-white/10',
    });

    suggestions.push({
      label: 'Awaaz Kam',
      query: 'volume down',
      icon: Volume1,
      interestTag: 'Audio',
      tagColor: 'bg-white/10 text-white/80 border-white/10',
    });

    suggestions.push({
      label: 'Mute',
      query: 'mute',
      icon: VolumeX,
      interestTag: 'Audio',
      tagColor: 'bg-white/10 text-white/80 border-white/10',
    });

    return suggestions;
  }, [currentTrack, isPlaying]);

  return (
    <div
      id="voice-controller-panel"
      className="w-full bg-[#1c1c1e]/70 border border-white/[0.08] rounded-[28px] p-4 sm:p-5 backdrop-blur-2xl shadow-xl"
    >
      {/* Top Header & Mic Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          {/* Mic Toggle Button */}
          <button
            id="mic-toggle-btn"
            onClick={toggleMic}
            className={`px-4 py-2 rounded-full border flex items-center gap-2 text-xs sm:text-sm font-semibold transition-all duration-300 shadow-md cursor-pointer ${
              isMicEnabled
                ? 'bg-[#30d158] hover:bg-[#28b84d] text-black border-[#30d158] shadow-[0_0_20px_rgba(48,209,88,0.4)]'
                : 'bg-white/10 hover:bg-white/15 text-white/90 border-white/15'
            }`}
            title={isMicEnabled ? 'Turn off voice listener' : 'Enable "Hey Buddy" wake word'}
          >
            {isMicEnabled ? <Mic className="w-4 h-4 animate-bounce" /> : <MicOff className="w-4 h-4 text-white/60" />}
            <span>{isMicEnabled ? 'Buddy Listening ("Hey Buddy")' : 'Enable "Hey Buddy" Wake Word'}</span>
          </button>

          {/* Voice Audio Feedback Toggle */}
          <button
            onClick={() => setVoiceFeedbackEnabled(!voiceFeedbackEnabled)}
            className={`px-3 py-2 rounded-full border text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
              voiceFeedbackEnabled
                ? 'border-white/20 bg-white/15 text-white'
                : 'border-white/10 bg-white/5 text-white/40'
            }`}
            title="Toggle Buddy spoken voice replies"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Voice Reply: {voiceFeedbackEnabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Voice & Stream Engine Badges */}
        <div className="flex items-center flex-wrap gap-2 text-xs text-white/50">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Voice: <strong className="text-white/80">{voiceLabel}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span>Audio: <strong className="text-white/80">Buddy Hi-Fi Engine</strong></span>
          </div>
        </div>
      </div>

      {/* Live Transcription Card */}
      <div className="bg-black/40 border border-white/[0.08] rounded-[20px] p-3 sm:p-4 mb-4 flex items-center justify-between gap-3 backdrop-blur-xl">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-tr from-red-500 to-rose-600 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-mono tracking-wider text-white/40 block">
              Live Voice Recognition
            </span>
            <p className="text-sm text-white/90 font-medium truncate">
              {liveTranscript || (isMicEnabled ? 'Waiting for voice... Say "Hey Buddy, pause" or "Hey Buddy, next song"' : 'Microphone standby. Tap "Enable" above or use music controls below.')}
            </p>
          </div>
        </div>

        {wakeWordDetected && (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#30d158]/20 text-[#30d158] border border-[#30d158]/40 animate-pulse flex-shrink-0">
            Buddy Active!
          </span>
        )}
      </div>

      {/* Quick Suggestion Pills - Dynamic by Music Interest */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-white/50">
          <div className="flex items-center gap-2">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-white/60 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-red-400" />
              Quick Actions (as per music interest):
            </span>
            {currentTrack && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/70 border border-white/10 hidden sm:inline-flex items-center gap-1">
                <span>Vibe:</span>
                <strong className="text-red-300">{currentTrack.genre || 'Trending'}</strong>
              </span>
            )}
          </div>
          <span className="text-[10px] text-white/40 font-mono">1-tap execution</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {quickActionSuggestions.map((qc, i) => {
            const Icon = qc.icon;
            return (
              <button
                key={i}
                id={`quick-cmd-${i}`}
                onClick={() => processVoiceCommand(qc.query)}
                className="group px-3 py-1.5 rounded-full bg-white/[0.07] hover:bg-white/[0.16] active:bg-white/[0.24] border border-white/10 hover:border-white/20 text-xs text-white/90 hover:text-white transition-all transform active:scale-95 cursor-pointer flex items-center gap-2 shadow-sm"
                title={`Command: "${qc.query}"`}
              >
                <Icon className="w-3.5 h-3.5 text-red-400 group-hover:scale-110 transition-transform" />
                <span>{qc.label}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full border font-mono ${qc.tagColor}`}>
                  {qc.interestTag}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual Voice/Text Input Field */}
      <form onSubmit={handleManualSubmit} className="mt-4 flex gap-2">
        <input
          type="text"
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          placeholder="Ask Buddy: 'pause', 'next song', 'volume up', 'previous song'..."
          className="flex-1 bg-black/40 border border-white/15 focus:border-red-500/50 rounded-full px-4 py-2.5 text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none backdrop-blur-xl transition-all"
        />
        <button
          type="submit"
          className="px-5 py-2.5 bg-red-600 hover:bg-red-500 active:scale-95 rounded-full text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-md text-white"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Ask</span>
        </button>
      </form>
    </div>
  );
};
