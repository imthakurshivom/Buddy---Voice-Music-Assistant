import React from 'react';
import { VoiceLog } from '../types';
import { MessageSquare, Mic, Bot, AlertCircle, PlayCircle, Trash2 } from 'lucide-react';

interface VoiceActivityLogProps {
  logs: VoiceLog[];
  onClearLogs: () => void;
}

export const VoiceActivityLog: React.FC<VoiceActivityLogProps> = ({ logs, onClearLogs }) => {
  return (
    <div
      id="voice-activity-log"
      className="w-full bg-[#1c1c1e]/70 border border-white/[0.08] rounded-[28px] p-4 sm:p-5 backdrop-blur-2xl shadow-xl"
    >
      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#0a84ff]" />
          <h2 className="text-xs sm:text-sm font-semibold text-white/80 uppercase tracking-wider">
            Voice Assistant History
          </h2>
        </div>

        {logs.length > 0 && (
          <button
            onClick={onClearLogs}
            className="flex items-center gap-1 text-[11px] text-white/40 hover:text-white transition-colors cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {logs.length === 0 ? (
          <p className="text-xs text-white/40 py-4 text-center italic">
            No voice interactions yet. Say <strong className="text-white/70">"Hey Buddy, play Chaiyya Chaiyya"</strong> or tap the Voice Orb.
          </p>
        ) : (
          logs.map((log) => {
            const isWake = log.type === 'wake';
            const isCommand = log.type === 'command';
            const isReply = log.type === 'reply';
            const isError = log.type === 'error';

            return (
              <div
                key={log.id}
                className={`p-2.5 rounded-[16px] border text-xs flex items-start gap-2.5 transition-all ${
                  isWake
                    ? 'border-[#30d158]/30 bg-[#30d158]/10 text-white'
                    : isCommand
                    ? 'border-[#0a84ff]/30 bg-[#0a84ff]/10 text-white'
                    : isReply
                    ? 'border-[#af52de]/30 bg-[#af52de]/10 text-white'
                    : 'border-[#ff453a]/30 bg-[#ff453a]/10 text-white'
                }`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {isWake && <Mic className="w-3.5 h-3.5 text-[#30d158]" />}
                  {isCommand && <PlayCircle className="w-3.5 h-3.5 text-[#0a84ff]" />}
                  {isReply && <Bot className="w-3.5 h-3.5 text-[#af52de]" />}
                  {isError && <AlertCircle className="w-3.5 h-3.5 text-[#ff453a]" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[10px] uppercase tracking-wider text-white/50">
                      {isWake ? 'Wake Word' : isCommand ? 'Voice Command' : isReply ? 'Buddy Response' : 'System Alert'}
                    </span>
                    <span className="text-[10px] font-mono text-white/40">{log.timestamp}</span>
                  </div>
                  <p className="mt-0.5 text-white/90 text-xs break-words">{log.text}</p>
                  {log.actionExecuted && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] bg-white/10 text-white/70 font-mono">
                      Action: {log.actionExecuted}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
