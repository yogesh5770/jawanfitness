import React, { useState } from 'react';
import { Eye, EyeOff, Lock, ShieldCheck, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { authService } from '../../services/authService';
import { hapticTap, hapticSuccess, hapticError } from '../../utils/audioHaptics';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: 'ADMIN' | 'TRAINER' | 'CLIENT';
  userIdentifier?: string;
  userName?: string;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  userRole = 'CLIENT',
  userIdentifier,
  userName
}) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!oldPassword) {
      setError('Please enter your current / temporary password.');
      hapticError();
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      hapticError();
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match. Please verify.');
      hapticError();
      return;
    }

    if (oldPassword === newPassword) {
      setError('New password must be different from current password.');
      hapticError();
      return;
    }

    setLoading(true);
    hapticTap();

    const res = await authService.changePassword(oldPassword, newPassword, userIdentifier);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Failed to change password.');
      hapticError();
      return;
    }

    hapticSuccess();
    setSuccess('Password updated successfully! Keep your new password safe.');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');

    setTimeout(() => {
      onClose();
      setSuccess(null);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-[#090d16] border border-amber-500/30 rounded-3xl p-6 shadow-2xl relative text-left overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow effect */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-white text-base tracking-wider uppercase">
                Change Password
              </h3>
              <p className="text-[11px] text-slate-400">
                {userName ? `Account: ${userName}` : 'Update your personal access credentials'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              hapticTap();
              onClose();
            }}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start space-x-2 text-rose-300 text-xs animate-in shake">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-start space-x-2 text-emerald-300 text-xs animate-in zoom-in">
            <Check className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
            <div className="leading-relaxed font-bold">{success}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Old Password */}
          <div>
            <label className="text-[11px] font-tech font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Current / Temporary Password
            </label>
            <div className="relative">
              <input
                type={showOld ? 'text' : 'password'}
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder=""
                className="w-full bg-slate-900/90 border border-white/10 focus:border-amber-500 rounded-xl px-4 py-3 pr-12 text-white text-sm outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => {
                  hapticTap();
                  setShowOld(!showOld);
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-400 p-1 transition-colors"
                title={showOld ? 'Hide password' : 'Show password'}
              >
                {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 2. New Password */}
          <div>
            <label className="text-[11px] font-tech font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              New Password <span className="text-[10px] text-amber-400 font-normal lowercase">(min 6 characters)</span>
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder=""
                className="w-full bg-slate-900/90 border border-white/10 focus:border-amber-500 rounded-xl px-4 py-3 pr-12 text-white text-sm outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => {
                  hapticTap();
                  setShowNew(!showNew);
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-400 p-1 transition-colors"
                title={showNew ? 'Hide password' : 'Show password'}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 3. Confirm New Password */}
          <div>
            <label className="text-[11px] font-tech font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder=""
                className="w-full bg-slate-900/90 border border-white/10 focus:border-amber-500 rounded-xl px-4 py-3 pr-12 text-white text-sm outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => {
                  hapticTap();
                  setShowConfirm(!showConfirm);
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-400 p-1 transition-colors"
                title={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-display font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-[0.99] flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Updating Password in Cloud...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-black" />
                  <span>Save New Password</span>
                </>
              )}
            </button>
          </div>
        </form>

        <p className="text-[10px] text-slate-500 text-center mt-4">
          Encrypted 256-bit PBKDF2 with unique cryptographic salt.
        </p>
      </div>
    </div>
  );
};
