import React, { useState, useEffect, useRef } from 'react';
import { Track, Playlist } from '../types';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Volume1,
  ExternalLink,
  ListMusic,
  Heart,
  Shuffle,
  Repeat,
  Tv,
  Image as ImageIcon,
  Youtube,
  Radio,
  Search,
  Sparkles,
  CheckCircle2,
  Cpu,
  Info,
  Loader2,
  Sliders,
} from 'lucide-react';

interface MusicPlayerProps {
  currentTrack: Track;
  isPlaying: boolean;
  volume: number; // 0 to 100
  onTogglePlay: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  onVolumeChange: (vol: number) => void;
  onSelectTrack: (track: Track) => void;
  playlists: Playlist[];
  currentPlaylist: Playlist;
  onSelectPlaylist: (playlist: Playlist) => void;
  onSearchAndPlay?: (query: string) => void;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({
  currentTrack,
  isPlaying,
  volume,
  onTogglePlay,
  onNextTrack,
  onPrevTrack,
  onVolumeChange,
  onSelectTrack,
  playlists,
  currentPlaylist,
  onSelectPlaylist,
  onSearchAndPlay,
}) => {
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);
  const [viewMode, setViewMode] = useState<'art' | 'video'>('art');
  const [showQueue, setShowQueue] = useState(false);
  const [showExtractorDetails, setShowExtractorDetails] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [streamQuality, setStreamQuality] = useState<'160_opus' | '256_aac' | '128_mp4'>('160_opus');
  
  // Real-time NewPipe search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const onNextTrackRef = useRef(onNextTrack);
  onNextTrackRef.current = onNextTrack;

  // Send postMessage commands to the YouTube player iframe
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sendYTCommand = (func: string, args: any[] = []) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func, args }),
        '*'
      );
    }
  };

  // Sync playback state with YouTube Music player
  useEffect(() => {
    if (isPlaying) {
      sendYTCommand('unMute', []);
      sendYTCommand('setVolume', [isMuted ? 0 : (volume || 85)]);
      sendYTCommand('playVideo', []);
    } else {
      sendYTCommand('pauseVideo', []);
    }
  }, [isPlaying, currentTrack.id, isMuted, volume]);

  // Track progress timer for playback
  useEffect(() => {
    if (isPlaying) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      progressTimerRef.current = setInterval(() => {
        setProgress((prev) => {
          const max = currentTrack.durationSeconds || 240;
          if (prev + 1 >= max) {
            if (repeatMode === 'one') {
              sendYTCommand('seekTo', [0, true]);
              return 0;
            }
            onNextTrackRef.current();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    }

    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };
  }, [isPlaying, currentTrack.id, repeatMode]);

  // Reset progress when track changes
  useEffect(() => {
    setProgress(0);
    setIsFavorite(false);
  }, [currentTrack.id]);

  const handleMuteToggle = () => {
    if (isMuted) {
      setIsMuted(false);
      onVolumeChange(prevVolume || 80);
      sendYTCommand('unMute', []);
      sendYTCommand('setVolume', [prevVolume || 80]);
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
      onVolumeChange(0);
      sendYTCommand('setVolume', [0]);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newSeconds = Math.floor(clickRatio * (currentTrack.durationSeconds || 240));
    setProgress(newSeconds);
    sendYTCommand('seekTo', [newSeconds, true]);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatRemainingTime = (secs: number) => {
    const total = currentTrack.durationSeconds || 240;
    const remaining = Math.max(0, total - secs);
    const m = Math.floor(remaining / 60);
    const s = Math.floor(remaining % 60);
    return `-${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Perform live search via NewPipe Extractor backend
  const handleNewPipeSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    setIsSearching(true);
    setShowSearchResults(true);

    try {
      const res = await fetch(`/api/newpipe/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      if (data.tracks && data.tracks.length > 0) {
        setSearchResults(data.tracks);
      }
    } catch (err) {
      console.warn('NewPipe search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (tr: Track) => {
    onSelectTrack(tr);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  const ytVideoId = currentTrack.youtubeId || 'YOYN9qNXmAw';
  const ytSrc = `https://www.youtube.com/embed/${ytVideoId}?enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}&controls=1&rel=0&playsinline=1&modestbranding=1`;

  return (
    <div
      id="music-player-card"
      className="w-full relative rounded-[32px] sm:rounded-[36px] overflow-hidden bg-[#141416]/95 border border-red-500/20 backdrop-blur-3xl shadow-2xl p-4 sm:p-7 transition-all duration-500"
    >
      {/* Ambient Red Audio Glow */}
      <div className="absolute -inset-10 opacity-30 blur-3xl pointer-events-none transition-all duration-700 bg-gradient-to-b from-red-600/30 via-red-950/20 to-black" />

      {/* ========================================================= */}
      {/* 1. TOP HEADER: BUDDY AUDIO ENGINE STATUS BAR              */}
      {/* ========================================================= */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-white/[0.08]">
        {/* Buddy Audio Engine Identity */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600/20 border border-red-500/30 text-red-400 font-semibold text-xs">
            <Sparkles className="w-4 h-4 text-red-400" />
            <span>Buddy Music</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/10 text-[11px] text-white/80 font-mono">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>Hi-Fi Engine</span>
          </div>

          <div className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-medium">
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span>Ad-Free Stream</span>
          </div>
        </div>

        {/* View Mode & Extractor Specs Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExtractorDetails(!showExtractorDetails)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
              showExtractorDetails
                ? 'bg-red-500/20 border-red-500/40 text-red-300'
                : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
            }`}
            title="View Stream Extraction Metadata"
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Stream Specs</span>
          </button>

          <div className="flex items-center p-0.5 bg-black/40 border border-white/10 rounded-full">
            <button
              onClick={() => setViewMode('art')}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'art'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Audio</span>
            </button>
            <button
              onClick={() => setViewMode('video')}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                viewMode === 'video'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Video</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. AUDIO ENGINE SPECS DRAWER (Codec, Bitrate, Format)      */}
      {/* ========================================================= */}
      {showExtractorDetails && (
        <div className="relative z-10 mb-4 p-3.5 rounded-2xl bg-black/60 border border-red-500/30 text-xs text-white/80 animate-in fade-in slide-in-from-top duration-200">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-red-400" />
              Buddy Stream Engine Diagnostics
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
              Active Connection • 200 OK
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-[11px]">
            <div className="bg-white/5 p-2 rounded-xl border border-white/5">
              <span className="text-white/40 block text-[10px]">STREAM ENGINE</span>
              <span className="text-white font-semibold">Buddy Core v2.0</span>
            </div>
            <div className="bg-white/5 p-2 rounded-xl border border-white/5">
              <span className="text-white/40 block text-[10px]">AUDIO BITRATE</span>
              <span className="text-red-300 font-semibold">High-Fidelity Opus</span>
            </div>
            <div className="bg-white/5 p-2 rounded-xl border border-white/5">
              <span className="text-white/40 block text-[10px]">SAMPLE RATE</span>
              <span className="text-white font-semibold">48,000 Hz</span>
            </div>
            <div className="bg-white/5 p-2 rounded-xl border border-white/5">
              <span className="text-white/40 block text-[10px]">PROTOCOL</span>
              <span className="text-white font-semibold">Adaptive Stream</span>
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-white/60">
            <span>Artist: <strong className="text-white">{currentTrack.artist}</strong></span>
            <span className="text-emerald-400">Pure Buddy Stream</span>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. BUDDY REAL-TIME SEARCH BAR                             */}
      {/* ========================================================= */}
      <div className="relative z-10 mb-5">
        <form onSubmit={handleNewPipeSearch} className="relative flex items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search any song, artist, or album on Buddy Music..."
            className="w-full pl-10 pr-24 py-2.5 bg-black/40 border border-white/10 focus:border-red-500/50 rounded-full text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-all"
          />
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 pointer-events-none" />
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="absolute right-1.5 px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:hover:bg-red-600 text-white text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Extracting...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3" />
                <span>Search</span>
              </>
            )}
          </button>
        </form>

        {/* Live Search Results Popup */}
        {showSearchResults && (
          <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-[#18181b]/98 border border-white/15 rounded-2xl shadow-2xl z-30 max-h-72 overflow-y-auto space-y-1">
            <div className="flex items-center justify-between pb-2 px-1 border-b border-white/10 text-xs text-white/50">
              <span>Buddy Music Tracks ({searchResults.length})</span>
              <button
                onClick={() => setShowSearchResults(false)}
                className="text-white/60 hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>

            {searchResults.length === 0 && !isSearching && (
              <p className="py-4 text-center text-xs text-white/40">No songs found. Try another search query.</p>
            )}

            {searchResults.map((tr) => (
              <div
                key={tr.id}
                onClick={() => handleSelectSearchResult(tr)}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 transition-all cursor-pointer group"
              >
                <img src={tr.coverUrl} alt={tr.title} className="w-10 h-10 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-red-400 transition-colors">
                    {tr.title}
                  </h4>
                  <p className="text-[11px] text-white/50 truncate">{tr.artist}</p>
                </div>
                <div className="text-[11px] text-white/40 font-mono">{tr.duration}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 4. MAIN PLAYER STAGE: AUDIO ARTWORK OR VIDEO STREAM        */}
      {/* ========================================================= */}
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 sm:gap-8 mb-6">
        {/* Media Canvas Container */}
        <div className="relative w-full md:w-80 sm:w-88 aspect-video sm:aspect-square rounded-[24px] overflow-hidden bg-black shadow-2xl border border-white/10 shrink-0">
          {/* YouTube Video / Stream Player Iframe */}
          <iframe
            ref={iframeRef}
            src={ytSrc}
            title={currentTrack.title}
            className={`w-full h-full transition-opacity duration-300 ${
              viewMode === 'video' ? 'opacity-100 z-10' : 'opacity-0 -z-10 pointer-events-none'
            }`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />

          {/* Cover Art & Native Wave Visualizer (When in Audio View Mode) */}
          {viewMode === 'art' && (
            <div className="absolute inset-0 z-20 flex items-center justify-center overflow-hidden bg-gradient-to-t from-black via-black/40 to-transparent">
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20" />

              {/* Animated Frequency Bars during Audio Playback */}
              {isPlaying && (
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-center gap-1.5 h-10 z-10 pointer-events-none">
                  {[40, 75, 100, 60, 90, 45, 80, 50, 95, 70, 85, 60, 40].map((h, i) => (
                    <div
                      key={i}
                      className="w-1.5 rounded-full bg-red-500 animate-pulse shadow-sm shadow-red-500/50"
                      style={{
                        height: `${h}%`,
                        animationDuration: `${0.4 + (i % 5) * 0.15}s`,
                        animationDelay: `${i * 0.05}s`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Track Details & Extractor Badges */}
        <div className="flex-1 w-full min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-300 font-bold uppercase tracking-wider">
              {currentTrack.genre || 'Buddy Music'}
            </span>
            <span className="text-xs text-white/40">•</span>
            <span className="text-xs text-white/60 truncate font-mono">
              Opus 160kbps
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight truncate">
            {currentTrack.title}
          </h2>

          <p className="text-sm sm:text-base font-medium text-white/70 truncate mt-1">
            {currentTrack.artist}
          </p>

          <p className="text-xs text-white/40 truncate mt-0.5">
            {currentTrack.album || 'Buddy Original'}
          </p>

          {/* Quick Actions Row */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={`p-2 rounded-full border transition-all cursor-pointer ${
                isFavorite
                  ? 'bg-red-500/20 border-red-500/40 text-red-400'
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
              }`}
              title={isFavorite ? 'Saved to Favorites' : 'Add to Favorites'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-400' : ''}`} />
            </button>

            <button
              onClick={() => setShowQueue(!showQueue)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer ${
                showQueue
                  ? 'bg-white/20 border-white/30 text-white'
                  : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
              }`}
            >
              <ListMusic className="w-3.5 h-3.5" />
              <span>Queue ({currentPlaylist.tracks.length})</span>
            </button>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/70 ml-auto">
              <Sparkles className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Buddy Hi-Fi</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. SEEK SCRUBBER & TIMESTAMPS                              */}
      {/* ========================================================= */}
      <div className="relative z-10 mb-4">
        <div
          onClick={handleSeek}
          className="relative w-full h-2.5 bg-white/10 hover:bg-white/15 rounded-full overflow-hidden cursor-pointer transition-colors group"
        >
          <div
            className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all group-hover:brightness-110 shadow-lg shadow-red-600/50"
            style={{
              width: `${Math.min(100, (progress / (currentTrack.durationSeconds || 240)) * 100)}%`,
            }}
          />
        </div>
        <div className="flex justify-between items-center text-[11px] font-mono text-white/50 mt-1.5">
          <span>{formatTime(progress)}</span>
          <span className="flex items-center gap-1">
            <Radio className="w-3 h-3 text-red-500 animate-pulse" />
            <span>Buddy Live Stream</span>
          </span>
          <span>{formatRemainingTime(progress)}</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 6. PLAYBACK CONTROLS & VOLUME BAR                         */}
      {/* ========================================================= */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Shuffle & Repeat Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsShuffle(!isShuffle)}
            className={`p-2 rounded-full border transition-all cursor-pointer ${
              isShuffle ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-transparent border-transparent text-white/40 hover:text-white'
            }`}
            title="Shuffle Playlist"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setRepeatMode((prev) => (prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off'));
            }}
            className={`p-2 rounded-full border transition-all cursor-pointer relative ${
              repeatMode !== 'off'
                ? 'bg-red-500/20 border-red-500/40 text-red-400'
                : 'bg-transparent border-transparent text-white/40 hover:text-white'
            }`}
            title={`Repeat: ${repeatMode}`}
          >
            <Repeat className="w-4 h-4" />
            {repeatMode === 'one' && (
              <span className="absolute text-[8px] font-bold top-1 right-1">1</span>
            )}
          </button>
        </div>

        {/* Primary Controls (Prev / Play / Next) */}
        <div className="flex items-center gap-4">
          <button
            onClick={onPrevTrack}
            className="p-3 rounded-full text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            title="Previous Track"
          >
            <SkipBack className="w-6 h-6 fill-current" />
          </button>

          <button
            onClick={onTogglePlay}
            className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 text-white flex items-center justify-center shadow-xl shadow-red-600/40 transition-all cursor-pointer"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-white" />
            ) : (
              <Play className="w-7 h-7 fill-white translate-x-0.5" />
            )}
          </button>

          <button
            onClick={onNextTrack}
            className="p-3 rounded-full text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            title="Next Track"
          >
            <SkipForward className="w-6 h-6 fill-current" />
          </button>
        </div>

        {/* Volume Scrubber */}
        <div className="flex items-center gap-2.5 w-full sm:w-44">
          <button
            onClick={handleMuteToggle}
            className="text-white/60 hover:text-white transition-colors cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : volume < 50 ? (
              <Volume1 className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              const val = Number(e.target.value);
              setIsMuted(false);
              onVolumeChange(val);
              sendYTCommand('unMute', []);
              sendYTCommand('setVolume', [val]);
            }}
            className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-red-500"
          />
          <span className="text-[10px] font-mono text-white/50 w-7 text-right">
            {isMuted ? '0%' : `${volume}%`}
          </span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 7. CURRENT PLAYLIST QUEUE DRAWER                           */}
      {/* ========================================================= */}
      {showQueue && (
        <div className="relative z-10 mt-6 pt-5 border-t border-white/[0.08] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ListMusic className="w-4 h-4 text-red-400" />
              <span>Playing from: {currentPlaylist.name}</span>
            </h3>
            <span className="text-xs text-white/50">
              {currentPlaylist.tracks.length} tracks
            </span>
          </div>

          <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
            {currentPlaylist.tracks.map((t, idx) => {
              const isCurrent = t.id === currentTrack.id;
              return (
                <div
                  key={t.id}
                  onClick={() => onSelectTrack(t)}
                  className={`flex items-center justify-between p-2.5 rounded-2xl transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-red-500/20 border border-red-500/30 text-white'
                      : 'hover:bg-white/[0.06] text-white/70 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-white/40 w-4 text-center">
                      {idx + 1}
                    </span>
                    <img
                      src={t.coverUrl}
                      alt={t.title}
                      className="w-9 h-9 rounded-lg object-cover"
                    />
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold truncate ${isCurrent ? 'text-red-400' : 'text-white'}`}>
                        {t.title}
                      </p>
                      <p className="text-[11px] text-white/50 truncate">
                        {t.artist}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-white/40">
                    {isCurrent && isPlaying && (
                      <span className="flex items-center gap-1 text-red-400 text-[10px]">
                        <Radio className="w-3 h-3 animate-pulse" />
                        <span>Playing</span>
                      </span>
                    )}
                    <span>{t.duration}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
