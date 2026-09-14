import React, { useState, useRef, useEffect } from 'react';
import { Send, Phone, MessageSquare, Award, Sparkles, Dumbbell, Apple, Clock, ShieldCheck } from 'lucide-react';
import { syncedStore, AppSyncState, ClientData, TrainerData } from '../../services/syncedStore';
import { hapticTap } from '../../utils/audioHaptics';

interface TrainerChatScreenProps {
  client: ClientData;
  trainerName: string;
}

export const TrainerChatScreen: React.FC<TrainerChatScreenProps> = ({ client, trainerName }) => {
  const [syncState, setSyncState] = useState<AppSyncState>(() => syncedStore.getState());
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = syncedStore.subscribe((newState) => {
      setSyncState(newState);
    });
    return unsub;
  }, []);

  const trainer: TrainerData | undefined = syncState.trainers.find(
    (t) => t.id === client.trainerId || t.name.toLowerCase() === trainerName.toLowerCase()
  ) || syncState.trainers[0];

  const assignedWorkout = syncState.assignedWorkouts[client.id];
  const assignedDiet = syncState.assignedDietPlans[client.id];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [syncState.messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    hapticTap();
    syncedStore.sendMessage('client', inputText.trim());
    setInputText('');
  };

  const coachInitials = (trainer?.name || trainerName || 'Coach')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-4 pb-4 animate-fadeIn text-left max-w-xl mx-auto">
      {/* 1. COACH PROFILE CARD */}
      <div className="bg-[#0b0f1a] border border-amber-500/30 rounded-3xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 text-black font-black text-sm flex items-center justify-center shadow-lg shadow-amber-500/20 flex-shrink-0 font-display">
              {coachInitials}
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h2 className="text-base font-black text-white font-display">
                  {trainer?.name || trainerName || 'Head Coach'}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 font-tech">
                  ONLINE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-tech">
                {trainer?.role || 'Head Strength & Conditioning Coach'}
              </p>
            </div>
          </div>

          {trainer?.phone && (
            <a
              href={`https://wa.me/${trainer.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => hapticTap()}
              className="p-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1.5 text-xs font-bold font-tech transition-all shadow"
              title="Message on WhatsApp"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          )}
        </div>

        {/* Prescription Summary Pills */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/10 text-xs">
          <div className="p-2.5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
            <div className="flex items-center space-x-1 text-amber-400 text-[10px] font-bold font-tech uppercase">
              <Dumbbell className="w-3 h-3" />
              <span>Assigned Split</span>
            </div>
            <p className="font-bold text-white text-xs truncate">
              {assignedWorkout ? assignedWorkout.title : 'Personalized Routine'}
            </p>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
            <div className="flex items-center space-x-1 text-cyan-400 text-[10px] font-bold font-tech uppercase">
              <Apple className="w-3 h-3" />
              <span>Nutrition Plan</span>
            </div>
            <p className="font-bold text-white text-xs truncate">
              {assignedDiet ? `${assignedDiet.dailyCalories} kcal / ${assignedDiet.dailyProtein}g P` : 'Custom Calorie Targets'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. LIVE CHAT CONVERSATION */}
      <div className="bg-[#0c101a] border border-white/10 rounded-3xl p-4 shadow-lg flex flex-col h-[460px]">
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-black text-white font-display uppercase tracking-wider">
              Coach Guidance Chat
            </h3>
          </div>
          <span className="text-[10px] text-slate-500 font-tech">Real-time Cloud Sync</span>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto space-y-3 p-1 scrollbar-none">
          {syncState.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500">
              <Sparkles className="w-8 h-8 text-amber-500/40 mb-2" />
              <p className="text-xs font-bold text-slate-400">Direct Coach Communication</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                Ask your coach anything about exercise form, nutrition adjustments, or schedule changes.
              </p>
            </div>
          ) : (
            syncState.messages.map((msg) => {
              const isMe = msg.sender === 'client';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[9px] font-tech text-slate-400 px-1 mb-0.5">
                    {isMe ? 'You' : msg.senderName || 'Coach'}
                  </span>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow ${
                      isMe
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black font-medium rounded-br-none'
                        : 'bg-slate-800/90 text-white border border-white/10 rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[8px] font-tech text-slate-500 px-1 mt-0.5">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="pt-3 border-t border-white/10 flex items-center space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type message to coach..."
            className="flex-1 bg-slate-900 border border-white/10 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none placeholder-slate-500 transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold disabled:opacity-40 disabled:cursor-not-allowed shadow transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
