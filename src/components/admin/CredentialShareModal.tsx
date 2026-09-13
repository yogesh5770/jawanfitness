import React, { useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  MessageCircle,
  Share2,
  ShieldCheck,
  Smartphone,
  X
} from 'lucide-react';
import {
  CredentialInfo,
  formatWhatsAppUrl,
  getTrainerWhatsAppMessage,
  getClientWhatsAppMessage,
  copyToClipboard
} from '../../utils/credentialUtils';
import { hapticTap } from '../../utils/audioHaptics';

interface CredentialShareModalProps {
  info: CredentialInfo;
  onClose: () => void;
}

export const CredentialShareModal: React.FC<CredentialShareModalProps> = ({ info, onClose }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const messageText =
    info.role === 'TRAINER'
      ? getTrainerWhatsAppMessage(info)
      : getClientWhatsAppMessage(info);

  const whatsappUrl = formatWhatsAppUrl(info.phone, messageText);

  const handleCopy = async (text: string, fieldName: string) => {
    hapticTap();
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleCopyAll = async () => {
    hapticTap();
    const success = await copyToClipboard(messageText);
    if (success) {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2500);
    }
  };

  const handleOpenWhatsApp = () => {
    hapticTap();
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto font-sans animate-in fade-in duration-200">
      <div className="bg-[#0b101d] border border-amber-500/40 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-[0_25px_70px_rgba(0,0,0,0.85)] relative text-left">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 p-2 flex items-center justify-center flex-shrink-0">
            <img src="/logo-3d-tight.png" alt="Jawan Fitness" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Credentials Ready
              </span>
              <span className="text-[10px] text-neutral-400 font-tech">
                {info.role === 'TRAINER' ? 'Staff Coach' : 'Member Account'}
              </span>
            </div>
            <h2 className="font-display font-black text-lg text-white mt-0.5">
              {info.name}
            </h2>
          </div>
        </div>

        {/* Info card */}
        <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-4 mb-5 space-y-3.5">
          {/* User ID Field */}
          <div>
            <span className="text-[10px] font-tech text-slate-400 uppercase tracking-wider font-bold block mb-1">
              User ID / Login ID
            </span>
            <div className="flex items-center justify-between bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5">
              <code className="text-amber-400 font-tech font-bold text-sm select-all">
                {info.loginId}
              </code>
              <button
                onClick={() => handleCopy(info.loginId, 'loginId')}
                className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 transition-colors ml-2"
                title="Copy User ID"
              >
                {copiedField === 'loginId' ? (
                  <span className="text-emerald-400 flex items-center space-x-1 font-bold">
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1">
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Password Field */}
          <div>
            <span className="text-[10px] font-tech text-slate-400 uppercase tracking-wider font-bold block mb-1">
              Temporary Password
            </span>
            <div className="flex items-center justify-between bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5">
              <code className="text-emerald-400 font-tech font-bold text-sm tracking-wider select-all">
                {showPassword ? info.temporaryPassword : '••••••••••••'}
              </code>
              <div className="flex items-center space-x-2 ml-2">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-white transition-colors p-1"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => handleCopy(info.temporaryPassword, 'password')}
                  className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 transition-colors"
                  title="Copy Password"
                >
                  {copiedField === 'password' ? (
                    <span className="text-emerald-400 flex items-center space-x-1 font-bold">
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1">
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Target Portal Link */}
          <div>
            <span className="text-[10px] font-tech text-slate-400 uppercase tracking-wider font-bold block mb-1">
              {info.role === 'TRAINER' ? 'Trainer Web Portal' : 'Member App Portal'}
            </span>
            <div className="flex items-center justify-between bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5">
              <a
                href={info.portalUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-400 hover:underline truncate max-w-[240px] sm:max-w-xs flex items-center space-x-1"
              >
                <span>{info.portalUrl}</span>
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
              <button
                onClick={() => handleCopy(info.portalUrl, 'portalUrl')}
                className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 transition-colors ml-2"
                title="Copy Portal Link"
              >
                {copiedField === 'portalUrl' ? (
                  <span className="text-emerald-400 flex items-center space-x-1 font-bold">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* WhatsApp Preview Note */}
        <div className="bg-[#128C7E]/10 border border-[#25D366]/30 rounded-2xl p-3 mb-5 text-xs text-emerald-300/90 flex items-start space-x-2.5">
          <MessageCircle className="w-4 h-4 text-[#25D366] flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-white text-[11px]">
              Direct WhatsApp Delivery
            </p>
            <p className="text-[11px] text-emerald-400/80 leading-relaxed">
              Click the button below to open WhatsApp with the User ID, Password, and Login Link pre-written for <span className="text-white font-semibold">{info.phone}</span>.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {/* Big WhatsApp Send Button */}
          <button
            onClick={handleOpenWhatsApp}
            className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-black font-extrabold text-sm uppercase tracking-wider rounded-2xl flex items-center justify-center space-x-2 shadow-[0_10px_25px_rgba(37,211,102,0.3)] transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
            <span>Send Credentials via WhatsApp</span>
          </button>

          {/* Secondary Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleCopyAll}
              className="py-2.5 px-3 bg-slate-800/90 hover:bg-slate-750 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition-all"
            >
              {copiedAll ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">All Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Message</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CredentialShareModal;
