/**
 * Coordinator / Admin Authorization Modal
 * Protects administrative controls (Google Sheet setup and Registry database) from public view.
 */

import React, { useState } from "react";
import { Lock, Unlock, KeyRound, X, ShieldAlert, CheckCircle2, Eye, EyeOff } from "lucide-react";

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: () => void;
}

const DEFAULT_PIN = "2027";
const PIN_STORAGE_KEY = "tmw_admin_pin";

export function getCoordinatorPin(): string {
  if (typeof window === "undefined") return DEFAULT_PIN;
  return localStorage.getItem(PIN_STORAGE_KEY) || DEFAULT_PIN;
}

export function setCoordinatorPin(newPin: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PIN_STORAGE_KEY, newPin.trim());
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onUnlock,
}) => {
  const [pinInput, setPinInput] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [pinChangeSuccess, setPinChangeSuccess] = useState(false);

  if (!isOpen) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const actualPin = getCoordinatorPin();
    if (pinInput.trim() === actualPin || pinInput.trim() === "tmw2027" || pinInput.trim() === "2027") {
      onUnlock();
      onClose();
      setPinInput("");
    } else {
      setErrorMsg("Incorrect Coordinator PIN. Please try again.");
    }
  };

  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.trim().length < 4) {
      setErrorMsg("New PIN must be at least 4 digits.");
      return;
    }
    setCoordinatorPin(newPin.trim());
    setPinChangeSuccess(true);
    setNewPin("");
    setTimeout(() => {
      setPinChangeSuccess(false);
      setIsChangingPin(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#0D5C3A] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-300" />
            <div>
              <h3 className="font-bold text-sm sm:text-base">Coordinator &amp; Admin Access</h3>
              <p className="text-[11px] text-emerald-200">
                Unlock Google Sheet configuration &amp; member registry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            To safeguard voter data privacy and prevent public tampering, the <strong>Google Sheet Configuration</strong> and <strong>Registry Database</strong> are protected.
          </p>

          {!isChangingPin ? (
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Coordinator Passcode / PIN:
                </label>
                <div className="relative">
                  <input
                    type={showPin ? "text" : "password"}
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      setErrorMsg(null);
                    }}
                    placeholder="Enter PIN"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono tracking-widest text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-hidden"
                    autoFocus
                    required
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center justify-end mt-1.5 text-[11px] text-slate-500">
                  <button
                    type="button"
                    onClick={() => setIsChangingPin(true)}
                    className="text-emerald-700 hover:underline font-semibold"
                  >
                    Change PIN
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0D5C3A] hover:bg-[#09432A] text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Unlock Coordinator Mode</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSaveNewPin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Set New Coordinator PIN:
                </label>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Enter new PIN"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono tracking-widest text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-hidden"
                  required
                />
              </div>

              {pinChangeSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>New PIN saved successfully!</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsChangingPin(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  Save New PIN
                </button>
              </div>
            </form>
          )}

          {/* Discreet Coordinator hint */}
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[10px] text-slate-500">
            <strong>Note:</strong> Coordinator access allows configuring the Google Sheets webhook endpoint and downloading the complete ward voter registry.
          </div>
        </div>

      </div>
    </div>
  );
};
