/**
 * Supabase Database Setup & SQL Guide Modal
 * Tinubu Movement Worldwide (TMW) Electoral Ward Registration Form
 */

import React, { useState } from "react";
import { 
  SUPABASE_SQL_MIGRATION, 
  testSupabaseConnection, 
  saveSupabaseConfig, 
  getSavedSupabaseConfig 
} from "../services/supabaseService";
import { 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Code,
  ShieldCheck,
  Server,
  Zap,
  Layers,
  ArrowRight
} from "lucide-react";

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated?: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  onConfigUpdated,
}) => {
  const savedCfg = getSavedSupabaseConfig();
  const [urlInput, setUrlInput] = useState(savedCfg.url);
  const [keyInput, setKeyInput] = useState(savedCfg.anonKey);
  const [activeTab, setActiveTab] = useState<"guide" | "sql" | "connect">("guide");
  const [copiedCode, setCopiedCode] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SQL_MIGRATION);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleSaveAndTest = async () => {
    if (!urlInput.trim() || !keyInput.trim()) {
      setTestResult({
        ok: false,
        message: "Please enter both your Supabase Project URL and Anon API key.",
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    // 1. Test connection client-side
    const res = await testSupabaseConnection(urlInput, keyInput);
    
    // 2. Also send to server so server can auto-sync across all devices
    try {
      await fetch("/api/supabase-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supabaseUrl: urlInput.trim(),
          supabaseKey: keyInput.trim(),
        }),
      });
    } catch (e) {
      console.warn("Could not save to backend server:", e);
    }

    setIsTesting(false);
    setTestResult(res);

    if (res.ok) {
      saveSupabaseConfig({
        url: urlInput.trim(),
        anonKey: keyInput.trim(),
        isConnected: true,
      });
      if (onConfigUpdated) onConfigUpdated();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-4">
        
        {/* Modal Header */}
        <div className="bg-[#0D5C3A] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-800/80 border border-emerald-600/50 flex items-center justify-center">
              <Database className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                Supabase Cloud PostgreSQL Database
                <span className="text-[10px] bg-emerald-500/30 text-emerald-100 border border-emerald-400/40 px-2 py-0.5 rounded-full font-bold">
                  Recommended
                </span>
              </h3>
              <p className="text-xs text-emerald-200">
                Permanent zero-data-loss cloud persistence across all phones and laptops
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs inside modal */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2">
          <button
            onClick={() => setActiveTab("guide")}
            className={`py-2.5 px-4 font-bold text-xs sm:text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "guide"
                ? "border-[#0D5C3A] text-[#0D5C3A]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Step-by-Step Setup Guide</span>
          </button>

          <button
            onClick={() => setActiveTab("sql")}
            className={`py-2.5 px-4 font-bold text-xs sm:text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "sql"
                ? "border-[#0D5C3A] text-[#0D5C3A]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Code className="w-4 h-4" />
            <span>SQL Tables &amp; Schema Code</span>
          </button>

          <button
            onClick={() => setActiveTab("connect")}
            className={`py-2.5 px-4 font-bold text-xs sm:text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "connect"
                ? "border-[#0D5C3A] text-[#0D5C3A]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Connect Application</span>
            {urlInput && keyInput && (
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: STEP BY STEP GUIDE */}
          {activeTab === "guide" && (
            <div className="space-y-5 text-slate-800">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-emerald-950">
                  <strong className="block text-emerald-900 font-bold mb-1">
                    Why Supabase solves our sync &amp; multi-device issue:
                  </strong>
                  Unlike Google Apps Script (which triggers 401 errors, rate limits, and requires manual Google account authorization), 
                  <strong> Supabase is a dedicated PostgreSQL cloud database</strong>. Any member registering from a phone in Kano, 
                  Lagos, or Rivers is instantly recorded in real-time, viewable on any coordinator’s laptop immediately.
                </div>
              </div>

              {/* Steps List */}
              <div className="space-y-4">
                <div className="flex items-start gap-3.5 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-[#0D5C3A] text-white flex items-center justify-center font-black text-xs shrink-0">
                    1
                  </div>
                  <div className="text-xs sm:text-sm space-y-1">
                    <p className="font-bold text-slate-900">Create a Free Supabase Project</p>
                    <p className="text-slate-600">
                      Visit <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline font-semibold inline-flex items-center gap-1">supabase.com <ExternalLink className="w-3 h-3" /></a> and sign in. Click <strong>"New Project"</strong>, name it <code>TMW-Registration-DB</code>, and set a database password.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-[#0D5C3A] text-white flex items-center justify-center font-black text-xs shrink-0">
                    2
                  </div>
                  <div className="text-xs sm:text-sm space-y-1">
                    <p className="font-bold text-slate-900">Open SQL Editor in Supabase</p>
                    <p className="text-slate-600">
                      In the left sidebar of your Supabase dashboard, click the <strong>SQL Editor</strong> icon (looks like <code>&gt;_</code> or a table sheet). Then click the <strong>"New query"</strong> button.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-[#0D5C3A] text-white flex items-center justify-center font-black text-xs shrink-0">
                    3
                  </div>
                  <div className="text-xs sm:text-sm space-y-2">
                    <p className="font-bold text-slate-900">Copy &amp; Run the SQL Script</p>
                    <p className="text-slate-600">
                      Switch to the <strong>"SQL Tables &amp; Schema Code"</strong> tab above, click <strong>"Copy Full SQL Script"</strong>, paste it into the Supabase query editor, and click the green <strong>"Run"</strong> button (or press <code>Ctrl+Enter</code>).
                    </p>
                    <button
                      onClick={() => setActiveTab("sql")}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <span>View &amp; Copy SQL Script</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-[#0D5C3A] text-white flex items-center justify-center font-black text-xs shrink-0">
                    4
                  </div>
                  <div className="text-xs sm:text-sm space-y-1">
                    <p className="font-bold text-slate-900">Copy API Keys &amp; Connect</p>
                    <p className="text-slate-600">
                      In Supabase, go to <strong>Project Settings</strong> (gear icon at bottom-left) ➔ <strong>API</strong>. Copy your <strong>Project URL</strong> and <strong>anon public</strong> key, then paste them in the <strong>"Connect Application"</strong> tab here.
                    </p>
                    <button
                      onClick={() => setActiveTab("connect")}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D5C3A] bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-lg transition-colors mt-1"
                    >
                      <span>Go to Connect Application Tab</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SQL CODE SCRIPT */}
          {activeTab === "sql" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <span>PostgreSQL Table Schema</span>
                    <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                      tmw_registrations
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Includes all registration fields, EXCO roles, performance indexes, RLS policies, and triggers.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopySql}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    copiedCode
                      ? "bg-emerald-700 text-white"
                      : "bg-[#0D5C3A] text-white hover:bg-[#0a482d]"
                  }`}
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? "Copied SQL to Clipboard!" : "Copy Full SQL Script"}</span>
                </button>
              </div>

              {/* Code viewer box */}
              <div className="relative">
                <pre className="p-4 bg-slate-900 text-emerald-300 text-xs rounded-xl font-mono overflow-x-auto max-h-[420px] leading-relaxed border border-slate-800 shadow-inner">
                  {SUPABASE_SQL_MIGRATION}
                </pre>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <strong className="text-slate-800 block">Row Level Security (RLS):</strong>
                  Pre-configured so anyone can submit registrations from mobile devices without login barriers, while protecting system integrity.
                </div>
                <div>
                  <strong className="text-slate-800 block">Indexes &amp; Performance:</strong>
                  Indexed on <code>phone</code>, <code>vin</code>, and <code>(state, lga, ward)</code> for sub-millisecond registry queries.
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONNECT APPLICATION */}
          {activeTab === "connect" && (
            <div className="space-y-5">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600">
                Enter your Supabase credentials from <strong>Project Settings ➔ API</strong>.
                Once connected, registrations from all phones, laptops, and field coordinators will instantly synchronize in real time.
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://xyzabcdefghijklmnop.supabase.co"
                    className="w-full text-xs sm:text-sm font-mono px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0D5C3A] bg-white"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Found in Supabase: Project Settings ➔ API ➔ Project URL
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Supabase Anon Public API Key
                  </label>
                  <input
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full text-xs sm:text-sm font-mono px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0D5C3A] bg-white"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Found in Supabase: Project Settings ➔ API ➔ Project API keys ➔ <code>anon public</code>
                  </p>
                </div>

                {/* Test result message */}
                {testResult && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-start gap-2.5 ${
                      testResult.ok
                        ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                        : "bg-red-50 border-red-300 text-red-900"
                    }`}
                  >
                    {testResult.ok ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <strong className="block font-bold">
                        {testResult.ok ? "Connected Successfully!" : "Connection Error"}
                      </strong>
                      <p className="mt-0.5">{testResult.message}</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveAndTest}
                    disabled={isTesting}
                    className="px-5 py-2.5 bg-[#0D5C3A] hover:bg-[#0a482d] text-white font-bold text-xs sm:text-sm rounded-lg transition-all flex items-center gap-2 shadow-xs disabled:opacity-50"
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying Database Connection...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Save &amp; Test Supabase Connection</span>
                      </>
                    )}
                  </button>

                  {savedCfg.url && savedCfg.anonKey && (
                    <button
                      type="button"
                      onClick={() => {
                        saveSupabaseConfig({ url: "", anonKey: "", isConnected: false });
                        setUrlInput("");
                        setKeyInput("");
                        fetch("/api/supabase-config", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ supabaseUrl: "", supabaseKey: "" }),
                        });
                        setTestResult({ ok: false, message: "Supabase connection cleared." });
                        if (onConfigUpdated) onConfigUpdated();
                      }}
                      className="text-xs font-semibold text-red-600 hover:text-red-800 hover:underline px-3 py-2"
                    >
                      Disconnect Supabase
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-700" />
            <span>Database: <strong>PostgreSQL via Supabase Cloud</strong></span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
