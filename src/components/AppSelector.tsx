import React from 'react';
import { Music, Radio, ShieldCheck, Zap, Sparkles } from 'lucide-react';

interface AppSelectorProps {
  onQuickExtract?: (query: string) => void;
}

export const AppSelector: React.FC<AppSelectorProps> = ({ onQuickExtract }) => {
  return (
    <div
      id="buddy-audio-dashboard"
      className="w-full bg-[#1c1c1e]/70 border border-red-500/20 rounded-[24px] p-3.5 sm:p-4 backdrop-blur-2xl shadow-xl"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold">
            <Music className="w-3.5 h-3.5" />
            <span>Buddy Music</span>
          </div>

          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-mono flex items-center gap-1 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            Buddy Audio Engine Active
          </span>
        </div>

        <div className="text-[11px] text-white/50 font-mono flex items-center gap-2">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>High-Fidelity Audio</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Ad-Free Stream</span>
          </span>
        </div>
      </div>

      {/* Audio Engine Features */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5 text-xs text-white/60">
          <Sparkles className="w-3.5 h-3.5 text-red-400" />
          <span className="font-medium text-white/80">Audio Capabilities:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {[
            'Ultra High-Bitrate',
            'Ad-Free Pipeline',
            'Direct Studio Stream',
            'Background Playback',
          ].map((feature) => (
            <span
              key={feature}
              className="px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-white/80 text-[11px] font-medium flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              <span>{feature}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
