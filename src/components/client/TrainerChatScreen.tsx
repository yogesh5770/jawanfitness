import React, { useState, useRef, useEffect } from 'react';
import { Send, Phone, MessageSquare, Sparkles, Dumbbell, Apple, UserX, AlertCircle, RotateCcw, ArrowLeft } from 'lucide-react';
import { syncedStore, AppSyncState, ClientData, TrainerData } from '../../services/syncedStore';
import { hapticTap } from '../../utils/audioHaptics';

interface TrainerChatScreenProps {
  client: ClientData;
  trainerName: string;
  onBack?: () => void;
}

export const TrainerChatScreen: React.FC<TrainerChatScreenProps> = ({ client, trainerName, onBack }) => {
  const [syncState, setSyncState] = useState<AppSyncState>(() => syncedStore.getState());
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = syncedStore.subscribe((newState) => {
      setSyncState(newState);
    });
    return unsub;
  }, []);

  // Find assigned trainer strictly by valid ID or exact registered name in syncState.trainers
  const isTrainerIdValid = Boolean(
    client.trainerId &&
    client.trainerId.trim() !== '' &&
    client.trainerId !== 'Unassigned'
  );
  const isTrainerNameValid = Boolean(
    trainerName &&
    trainerName.trim() !== '' &&
    trainerName !== 'Unassigned'
  );

  const foundTrainer = (isTrainerIdValid || isTrainerNameValid)
    ? syncState.trainers.find(
        (t) =>
          (isTrainerIdValid && t.id === client.trainerId) ||
          (isTrainerNameValid && t.name.toLowerCase() === trainerName.toLowerCase())
      )
    : undefined;

  const isAssigned = Boolean(foundTrainer);
  const trainer: TrainerData | undefined = foundTrainer;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isAssigned) {
      scrollToBottom();
    }
  }, [syncState.messages, isAssigned]);

  // Live cloud synchronization while chat is open — pauses when tab is hidden or minimized
  useEffect(() => {
    if (!isAssigned) return;
    syncedStore.syncFromCloud(true);

    const interval = setInterval(() => {
      if (!document.hidden) {
        syncedStore.syncFromCloud(true);
      }
    }, 3000);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        syncedStore.syncFromCloud(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAssigned]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !isAssigned) return;
    hapticTap();
    syncedStore.sendMessage('client', inputText.trim(), client.id, trainer?.id || client.trainerId, client.name);
    setInputText('');
  };

  // -------------------------------------------------------------
  // UNASSIGNED STATE: Show clean, professional "No Coach Assigned"
  // -------------------------------------------------------------
  if (!isAssigned || !trainer) {
    return (
      <div className="space-y-4 pb-6 animate-fadeIn text-left max-w-xl mx-auto">
        {onBack && (
          <button
            onClick={() => {
              hapticTap();
              onBack();
            }}
            className="flex items-center space-x-1.5 text-xs font-bold text-amber-600 dark:text-amber-500 hover:text-amber-600 dark:hover:text-amber-400 font-tech uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
        )}

        {/* Status Notice Card */}
        <div className="bg-white dark:bg-[#0b0f1a] border border-amber-500/20 rounded-3xl p-6 shadow-xl relative overflow-hidden text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-500 shadow-inner">
            <UserX className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <span className="inline-block text-[10px] font-tech font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Coach: Unassigned
            </span>
            <h2 className="text-lg font-black text-slate-900 dark:text-white font-display tracking-wide">
              No Personal Coach Assigned
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              Your member account currently does not have an assigned personal trainer. The Gym Director will assign a certified coach to your profile soon.
            </p>
          </div>

          {/* Benefits Locked Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left pt-2">
            <div className="p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 space-y-1">
              <div className="flex items-center space-x-1.5 text-amber-600 dark:text-amber-400 text-[10px] font-bold font-tech uppercase">
                <Dumbbell className="w-3.5 h-3.5" />
                <span>Custom Workout Plan</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Your assigned coach will program exercise splits, sets, and reps tailored to your goals.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 space-y-1">
              <div className="flex items-center space-x-1.5 text-cyan-600 dark:text-cyan-400 text-[10px] font-bold font-tech uppercase">
                <Apple className="w-3.5 h-3.5" />
                <span>Nutrition Guidance</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Daily calorie and protein targets customized for fat loss or lean muscle building.
              </p>
            </div>
          </div>

          {/* Contact Gym Front Desk */}
          <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="text-left text-slate-500 dark:text-slate-400 text-[11px]">
              Need a coach assigned right now?
              <span className="block text-slate-900 dark:text-white font-bold">Contact Jawan Fitness Front Desk</span>
            </div>
            <a
              href="https://wa.me/919790228874?text=Hello%20Jawan%20Fitness%2C%20please%20assign%20a%20personal%20coach%20to%20my%20membership."
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => hapticTap()}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold font-tech flex items-center justify-center space-x-1.5 transition-all"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>WhatsApp Front Desk</span>
            </a>
          </div>
        </div>

        {/* Disabled Chat Box with Explanatory Banner */}
        <div className="bg-white dark:bg-[#0c101a] border border-slate-200 dark:border-white/10 rounded-3xl p-5 shadow-lg space-y-3">
          <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
            <MessageSquare className="w-4 h-4 text-amber-600 dark:text-amber-500/40" />
            <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 font-display uppercase tracking-wider">
              Coach Guidance Chat (Inactive)
            </h3>
          </div>

          <div className="p-4 rounded-2xl bg-slate-100/60 dark:bg-slate-900/50 border border-slate-200/80 dark:border-white/5 text-center space-y-1">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500/60 mx-auto" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Direct Chat Activates on Assignment</p>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              Once the Gym Director assigns your personal coach, real-time two-way messaging will automatically unlock here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // ASSIGNED STATE: Coach is assigned and verified
  // -------------------------------------------------------------
  const coachInitials = (trainer.name || trainerName || 'Coach')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-4 pb-4 animate-fadeIn text-left max-w-xl mx-auto">
      {onBack && (
        <button
          onClick={() => {
            hapticTap();
            onBack();
          }}
          className="flex items-center space-x-1.5 text-xs font-bold text-amber-600 dark:text-amber-500 hover:text-amber-600 dark:hover:text-amber-400 font-tech uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </button>
      )}

      {/* 1. COACH PROFILE CARD */}
      <div className="bg-white dark:bg-[#0b0f1a] border border-amber-500/30 rounded-3xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 text-black font-black text-sm flex items-center justify-center shadow-lg shadow-amber-500/20 flex-shrink-0 font-display overflow-hidden border border-amber-500/40">
              {trainer.avatarUrl ? (
                <img src={trainer.avatarUrl} alt={trainer.name} className="w-full h-full object-cover" />
              ) : (
                coachInitials
              )}
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h2 className="text-base font-black text-slate-900 dark:text-white font-display">
                  {trainer.name}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20 font-tech">
                  ONLINE
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-tech">
                {trainer.role || 'Personal Fitness Coach'}
              </p>
            </div>
          </div>

          {trainer.phone && (
            <a
              href={`https://wa.me/${trainer.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => hapticTap()}
              className="p-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center space-x-1.5 text-xs font-bold font-tech transition-all shadow"
              title="Message on WhatsApp"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          )}
        </div>
      </div>

      {/* 2. LIVE CHAT CONVERSATION */}
      <div className="bg-white dark:bg-[#0c101a] border border-slate-200 dark:border-white/10 rounded-3xl p-4 shadow-lg flex flex-col h-[480px]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10 mb-2">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h3 className="text-xs font-black text-slate-900 dark:text-white font-display uppercase tracking-wider">
              Coach Guidance Chat
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                hapticTap();
                syncedStore.refreshTodayChat(client.name, trainer.name);
              }}
              title="Request today's daily coach check-in"
              className="px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-tech font-bold flex items-center space-x-1 transition-all active:scale-95"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Daily Check-in</span>
            </button>
            <span className="text-[10px] text-slate-500 font-tech hidden sm:inline">Real-time Cloud Sync</span>
          </div>
        </div>

        {/* Message Stream with Daily Dividers */}
        {(() => {
          const clientMessages = syncState.messages.filter((msg) => {
            if (!msg.clientId) return true;
            if (msg.clientId === client.id) return true;
            if (client.loginId && msg.clientId.toLowerCase() === client.loginId.toLowerCase()) return true;
            if (client.email && msg.clientId.toLowerCase() === client.email.toLowerCase()) return true;
            if (syncState.clients.length <= 1) return true;
            return false;
          });

          let lastDateKey = '';

          return (
            <div className="flex-1 overflow-y-auto space-y-2.5 p-1 scrollbar-none">
              {clientMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500">
                  <Sparkles className="w-8 h-8 text-amber-600 dark:text-amber-500/40 mb-2" />
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Direct Coach Communication</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                    Ask your coach anything about exercise form, nutrition adjustments, or schedule changes.
                  </p>
                </div>
              ) : (
                clientMessages.map((msg) => {
                  const isMe = msg.sender === 'client';
                  const msgDate = new Date(msg.timestamp);
                  const today = new Date();
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);

                  let dateLabel = '';
                  if (msgDate.toDateString() === today.toDateString()) {
                    dateLabel = 'Today';
                  } else if (msgDate.toDateString() === yesterday.toDateString()) {
                    dateLabel = 'Yesterday';
                  } else {
                    dateLabel = msgDate.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
                  }

                  const showDateDivider = dateLabel !== lastDateKey;
                  if (showDateDivider) {
                    lastDateKey = dateLabel;
                  }

                  return (
                    <React.Fragment key={msg.id}>
                      {showDateDivider && (
                        <div className="flex items-center justify-center my-2">
                          <span className="px-3 py-0.5 rounded-full bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-white/10 text-[9px] font-tech font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider shadow-sm">
                            {dateLabel}
                          </span>
                        </div>
                      )}
                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <span className="text-[9px] font-tech text-slate-500 dark:text-slate-400 px-1 mb-0.5">
                          {isMe ? 'You' : msg.senderName || trainer.name}
                        </span>
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow ${
                            isMe
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black font-medium rounded-br-none'
                              : 'bg-slate-100/90 dark:bg-slate-800/90 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 rounded-bl-none'
                          }`}
                        >
                          {msg.text}
                        </div>
                        <span className="text-[8px] font-tech text-slate-500 px-1 mt-0.5">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </React.Fragment>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          );
        })()}

        {/* Quick Check-in Chips with 48dp minimum touch target */}
        <div className="pt-2 pb-1 border-t border-slate-200/80 dark:border-white/5 flex items-center space-x-2 overflow-x-auto scrollbar-none py-1">
          {[
            { label: "✅ Done Today's Workout", text: "Coach, I have completed today's workout!" },
            { label: "🥗 On Track with Diet", text: "Coach, my meals and macros are on track today!" },
            { label: "💧 Hit Water Goal", text: "Coach, I hit my daily water hydration target!" },
            { label: "⚡ Sore Muscles", text: "Coach, feeling noticeable muscle soreness from training." },
            { label: "⚖️ Morning Weight Logged", text: "Coach, just logged my morning weight in the tracker." }
          ].map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                hapticTap();
                syncedStore.sendMessage('client', chip.text, client.id, trainer?.id || client.trainerId, client.name);
              }}
              className="min-h-[48px] px-3.5 py-2 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-tech text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 border border-slate-200 dark:border-white/10 flex-shrink-0 transition-all active:scale-95 cursor-pointer flex items-center justify-center whitespace-nowrap"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="pt-2 flex items-center space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Type message to ${trainer.name}...`}
            className="flex-1 min-h-[48px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 focus:border-amber-500 rounded-2xl px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-500 dark:placeholder:text-slate-400 transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            aria-label="Send message"
            className="min-h-[48px] min-w-[48px] rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold disabled:opacity-40 disabled:cursor-not-allowed shadow transition-all active:scale-95 flex items-center justify-center cursor-pointer"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
