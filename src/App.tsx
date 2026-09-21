import { useState, useCallback, useEffect, useRef } from 'react';
import { AssistantState, Playlist, Track, VoiceLog } from './types';
import { PLAYLISTS } from './data/musicData';
import { AppSelector } from './components/AppSelector';
import { MusicPlayer } from './components/MusicPlayer';
import { VoiceController } from './components/VoiceController';
import { VoiceActivityLog } from './components/VoiceActivityLog';
import { ApkInstallModal } from './components/ApkInstallModal';
import {
  Share,
  Play,
  Music2,
  Smartphone,
  Download,
} from 'lucide-react';

export default function App() {
  const [assistantState, setAssistantState] = useState<AssistantState>('idle');
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist>(PLAYLISTS[0]);
  const [currentTrack, setCurrentTrack] = useState<Track>(PLAYLISTS[0].tracks[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(85);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isApkModalOpen, setIsApkModalOpen] = useState<boolean>(false);
  const [logs, setLogs] = useState<VoiceLog[]>([
    {
      id: 'log-welcome',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'reply',
      text: 'Voice Assistant Buddy is active. Say "Hey Buddy, play Chaiyya Chaiyya"!',
      actionExecuted: 'init',
    },
  ]);

  // Listen for native PWA / WebAPK install prompt
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        // Installed
      }
      setDeferredPrompt(null);
    } else {
      setIsApkModalOpen(true);
    }
  };

  const addLog = useCallback((logData: Omit<VoiceLog, 'id' | 'timestamp'>) => {
    const newLog: VoiceLog = {
      ...logData,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 30)]);
  }, []);

  // Play next track in current playlist
  const currentPlaylistRef = useRef(currentPlaylist);
  currentPlaylistRef.current = currentPlaylist;
  const currentTrackRef = useRef(currentTrack);
  currentTrackRef.current = currentTrack;

  const handleNextTrack = useCallback(() => {
    const playlist = currentPlaylistRef.current;
    const current = currentTrackRef.current;
    const currentIndex = playlist.tracks.findIndex((t) => t.id === current.id);
    const nextIndex = (currentIndex + 1) % playlist.tracks.length;
    const nextTrack = playlist.tracks[nextIndex];
    setCurrentTrack(nextTrack);
    setIsPlaying(true);
    addLog({
      type: 'command',
      text: `Streaming next track: "${nextTrack.title}"`,
      actionExecuted: 'next',
    });
  }, [addLog]);

  // Play previous track
  const handlePrevTrack = useCallback(() => {
    const playlist = currentPlaylistRef.current;
    const current = currentTrackRef.current;
    const currentIndex = playlist.tracks.findIndex((t) => t.id === current.id);
    const prevIndex = (currentIndex - 1 + playlist.tracks.length) % playlist.tracks.length;
    const prevTrack = playlist.tracks[prevIndex];
    setCurrentTrack(prevTrack);
    setIsPlaying(true);
    addLog({
      type: 'command',
      text: `Streaming previous track: "${prevTrack.title}"`,
      actionExecuted: 'previous',
    });
  }, [addLog]);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      const next = !prev;
      addLog({
        type: 'command',
        text: next ? 'Playback resumed' : 'Playback paused',
        actionExecuted: next ? 'play' : 'pause',
      });
      return next;
    });
  }, [addLog]);

  const handleVolumeChange = useCallback((change: 'up' | 'down' | 'mute' | number) => {
    if (typeof change === 'number') {
      setVolume(change);
    } else if (change === 'up') {
      setVolume((prev) => Math.min(100, prev + 15));
    } else if (change === 'down') {
      setVolume((prev) => Math.max(0, prev - 15));
    } else if (change === 'mute') {
      setVolume(0);
    }
  }, []);

  const handleSelectTrack = useCallback((track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    addLog({
      type: 'command',
      text: `Buddy is playing "${track.title}"`,
      actionExecuted: 'play',
    });
  }, [addLog]);

  const handleSelectPlaylist = useCallback((playlist: Playlist) => {
    setCurrentPlaylist(playlist);
    setCurrentTrack(playlist.tracks[0]);
    setIsPlaying(true);
  }, []);

  // Search & play via NewPipe Extractor or local match
  const handlePlaySongOrGenre = useCallback(async (query: string) => {
    const clean = query.toLowerCase().trim();

    // 1. Try real-time NewPipe YouTube Music search API
    try {
      const searchRes = await fetch(`/api/newpipe/search?q=${encodeURIComponent(query)}`);
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.tracks && searchData.tracks.length > 0) {
          const topTrack: Track = searchData.tracks[0];
          
          // Add newly extracted tracks to current playlist or dynamic queue
          setCurrentPlaylist((prev) => ({
            ...prev,
            tracks: [topTrack, ...searchData.tracks.slice(1, 10)],
          }));

          setCurrentTrack(topTrack);
          setIsPlaying(true);
          addLog({
            type: 'reply',
            text: `Buddy is playing "${topTrack.title}"`,
            actionExecuted: 'play',
          });
          return;
        }
      }
    } catch (err) {
      console.warn('Live NewPipe search request failed, falling back to local presets:', err);
    }

    // 2. Search across preset tracks
    for (const pl of PLAYLISTS) {
      for (const tr of pl.tracks) {
        const titleMatch = clean.includes(tr.title.toLowerCase()) || tr.title.toLowerCase().includes(clean);
        const artistMatch = clean.includes(tr.artist.toLowerCase());
        if (titleMatch || artistMatch) {
          setCurrentPlaylist(pl);
          setCurrentTrack(tr);
          setIsPlaying(true);
          addLog({
            type: 'command',
            text: `Buddy is playing "${tr.title}"`,
            actionExecuted: 'play',
          });
          return;
        }
      }
    }

    // 3. Genre or Era Match
    if (clean.includes('90') || clean.includes('nineties') || clean.includes('purane') || clean.includes('retro')) {
      if (clean.includes('rock') || clean.includes('pop') || clean.includes('english')) {
        setCurrentPlaylist(PLAYLISTS[1]);
        setCurrentTrack(PLAYLISTS[1].tracks[0]);
      } else {
        setCurrentPlaylist(PLAYLISTS[0]);
        setCurrentTrack(PLAYLISTS[0].tracks[0]);
      }
      setIsPlaying(true);
      return;
    }

    if (clean.includes('arijit') || clean.includes('romantic') || clean.includes('love') || clean.includes('kesariya')) {
      setCurrentPlaylist(PLAYLISTS[2]);
      setCurrentTrack(PLAYLISTS[2].tracks[0]);
      setIsPlaying(true);
      return;
    }

    if (clean.includes('lofi') || clean.includes('chill') || clean.includes('relax') || clean.includes('study')) {
      setCurrentPlaylist(PLAYLISTS[3]);
      setCurrentTrack(PLAYLISTS[3].tracks[0]);
      setIsPlaying(true);
      return;
    }

    // 4. Default fallback: play top 90s anthem
    const cleanTitle = query.replace(/^play\s+/i, '').replace(/song|gaana/gi, '').trim() || 'Chaiyya Chaiyya';
    const dynamicTrack: Track = {
      id: `dyn-${Date.now()}`,
      title: cleanTitle,
      artist: 'YouTube Music Artist',
      album: 'Extracted via NewPipe',
      genre: 'Bollywood Hit',
      duration: '4:30',
      durationSeconds: 270,
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
      youtubeId: 'YOYN9qNXmAw',
      youtubeMusicUrl: `https://music.youtube.com/search?q=${encodeURIComponent(cleanTitle)}`,
    };

    setCurrentTrack(dynamicTrack);
    setIsPlaying(true);
    addLog({
      type: 'command',
      text: `Buddy is playing "${cleanTitle}"`,
      actionExecuted: 'play',
    });
  }, [addLog]);

  return (
    <div
      id="buddy-app-root"
      className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-[#fa243c] selection:text-white pb-16 antialiased"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
      }}
    >
      {/* ========================================================= */}
      {/* APP HEADER                                                */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-40 bg-black/85 backdrop-blur-2xl border-b border-white/[0.08] max-w-4xl mx-auto w-full px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[12px] bg-gradient-to-tr from-[#fa243c] via-[#ff375f] to-[#af52de] flex items-center justify-center shadow-lg shadow-[#fa243c]/20">
            <Music2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Buddy Music</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30">
                Hi-Fi Audio
              </span>
            </h1>
            <p className="text-[11px] text-white/50 font-medium -mt-0.5">
              Buddy Voice Music Assistant
            </p>
          </div>
        </div>

        {/* Generate / Install APK Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsApkModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-500/20 hover:bg-red-500/30 active:scale-95 border border-red-500/40 text-xs text-red-200 hover:text-white font-semibold transition-all cursor-pointer shadow-sm"
            title="Generate and install Buddy APK on Android"
          >
            <Smartphone className="w-3.5 h-3.5 text-red-400" />
            <span>Generate APK / Install</span>
          </button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* MAIN CONTENT AREA                                         */}
      {/* ========================================================= */}
      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 space-y-6">
        {/* Primary YouTube Music Player (powered by NewPipe Extractor) */}
        <MusicPlayer
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          volume={volume}
          onTogglePlay={handleTogglePlay}
          onNextTrack={handleNextTrack}
          onPrevTrack={handlePrevTrack}
          onVolumeChange={(v) => handleVolumeChange(v)}
          onSelectTrack={handleSelectTrack}
          playlists={PLAYLISTS}
          currentPlaylist={currentPlaylist}
          onSelectPlaylist={handleSelectPlaylist}
        />

        {/* NewPipe Extractor Engine Status & Controls */}
        <AppSelector onQuickExtract={handlePlaySongOrGenre} />

        {/* Voice Assistant Controller */}
        <VoiceController
          assistantState={assistantState}
          setAssistantState={setAssistantState}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          onPlaySongOrGenre={handlePlaySongOrGenre}
          onPlay={handlePlay}
          onPause={handlePause}
          onNext={handleNextTrack}
          onPrev={handlePrevTrack}
          onVolumeChange={handleVolumeChange}
          onAddLog={addLog}
          liveTranscript={liveTranscript}
          setLiveTranscript={setLiveTranscript}
        />

        {/* Voice Activity History */}
        <VoiceActivityLog logs={logs} onClearLogs={() => setLogs([])} />
      </main>

      {/* Action Sheet for Adding to Home Screen */}
      <ApkInstallModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
        deferredPrompt={deferredPrompt}
        onNativeInstall={handleNativeInstall}
        isInstallable={Boolean(deferredPrompt)}
      />
    </div>
  );
}
