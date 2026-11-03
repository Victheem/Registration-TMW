import React, { useState } from "react";
import { KeyRound, Lock, ShieldAlert, Unlock, X } from "lucide-react";
import { loginNationalCoordinator } from "../services/googleSheetsService";

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: (token: string) => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onUnlock,
}) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const token = await loginNationalCoordinator(pin);
      onUnlock(token);
      setPin("");
      onClose();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Coordinator login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-[#0D5C3A] px-5 py-4 text-white">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-emerald-300" />
            <div>
              <h3 className="text-sm font-bold sm:text-base">National Coordinator Login</h3>
              <p className="text-[11px] text-emerald-200">Access the full registration directory</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-emerald-200 hover:bg-white/10 hover:text-white" aria-label="Close login">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-700">
            Coordinator PIN
            <div className="relative mt-1.5">
              <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                autoFocus
                required
                type="password"
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                placeholder="Enter PIN"
                className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2.5 pl-9 pr-3 font-mono text-sm tracking-widest text-slate-900 outline-hidden focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </label>
          {error && (
            <div role="alert" className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="flex items-center gap-1.5 rounded-lg bg-[#0D5C3A] px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#09432A] disabled:opacity-60">
              <Unlock className="h-3.5 w-3.5" />
              <span>{isSubmitting ? "Verifying..." : "Login"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
