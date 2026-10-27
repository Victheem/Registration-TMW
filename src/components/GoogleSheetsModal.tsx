/**
 * Google Sheets Backend Configuration & Setup Modal
 * Provides copyable Google Apps Script code and step-by-step instructions
 */

import React, { useState } from "react";
import { 
  GOOGLE_APPS_SCRIPT_BOILERPLATE, 
  saveScriptUrl, 
  testConnection 
} from "../services/googleSheetsService";
import { 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  HelpCircle,
  Terminal,
  Save
} from "lucide-react";

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUrl: string;
  onUrlUpdated: (newUrl: string) => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  currentUrl,
  onUrlUpdated,
}) => {
  const [urlInput, setUrlInput] = useState(currentUrl);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [showCodePreview, setShowCodePreview] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_BOILERPLATE);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleSave = () => {
    saveScriptUrl(urlInput);
    onUrlUpdated(urlInput.trim());
    setTestResult({
      ok: true,
      message: "Google Apps Script Web App URL saved successfully!"
    });
  };

  const handleTest = async () => {
    if (!urlInput.trim()) {
      setTestResult({
        ok: false,
        message: "Please enter your Google Apps Script Web App URL first."
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const res = await testConnection(urlInput.trim());
    setIsTesting(false);
    setTestResult(res);

    if (res.ok) {
      saveScriptUrl(urlInput);
      onUrlUpdated(urlInput.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="bg-[#0D5C3A] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
            <div>
              <h3 className="font-bold text-base sm:text-lg">Google Sheets Automation Backend</h3>
              <p className="text-xs text-emerald-200">
                Lightweight serverless Google Apps Script Web App integration
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
          
          {/* Web App URL Form */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#0D5C3A] uppercase tracking-wider">
                Google Apps Script Web App URL:
              </label>
              {urlInput && (
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded">
                  Configured
                </span>
              )}
            </div>

            <input
              type="url"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                setTestResult(null);
              }}
              placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
              className="w-full px-3.5 py-2.5 bg-white border border-emerald-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-hidden"
            />

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 bg-[#0D5C3A] hover:bg-[#09432A] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save URL</span>
                </button>

                <button
                  type="button"
                  onClick={handleTest}
                  disabled={isTesting}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      <span>Testing Endpoint...</span>
                    </>
                  ) : (
                    <span>Test Connection</span>
                  )}
                </button>
              </div>

              {urlInput && (
                <button
                  type="button"
                  onClick={() => {
                    setUrlInput("");
                    saveScriptUrl("");
                    onUrlUpdated("");
                    setTestResult({ ok: false, message: "Google Sheet URL cleared. Using offline local queue mode." });
                  }}
                  className="text-xs text-red-600 hover:text-red-800 underline"
                >
                  Clear URL (Offline Mode)
                </button>
              )}
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  testResult.ok
                    ? "bg-emerald-100/80 text-emerald-900 border border-emerald-300"
                    : "bg-red-50 text-red-900 border border-red-200"
                }`}
              >
                {testResult.ok ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Quick Copy Box */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-slate-700" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Complete Google Apps Script Code (doPost &amp; doGet)
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                  copiedCode
                    ? "bg-emerald-600 text-white"
                    : "bg-[#0D5C3A] text-white hover:bg-[#09432A]"
                }`}
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Apps Script Code</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              This lightweight script creates spreadsheet headers automatically, supports concurrency locking, and appends both single registrations and 20-row ward batch sheets.
            </p>

            <button
              type="button"
              onClick={() => setShowCodePreview(v => !v)}
              className="text-xs text-emerald-800 font-semibold underline hover:text-emerald-950"
            >
              {showCodePreview ? "Hide Code Preview" : "View Code Preview"}
            </button>

            {showCodePreview && (
              <pre className="mt-3 p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-lg max-h-60 overflow-y-auto leading-relaxed">
                {GOOGLE_APPS_SCRIPT_BOILERPLATE}
              </pre>
            )}
          </div>

          {/* Step-by-Step Instructions */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-[#0D5C3A]" />
              <span>Step-by-Step Google Sheet Connection Walkthrough</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed">
              
              {/* Step 1 */}
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#0D5C3A] text-white font-bold text-[11px] flex items-center justify-center shrink-0">1</span>
                  <strong className="text-slate-900 font-bold">Create New Google Sheet</strong>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Go to <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-semibold inline-flex items-center gap-0.5">sheets.new <ExternalLink className="w-3 h-3" /></a> to open a fresh sheet. Name it:
                </p>
                <div className="bg-slate-100 px-2.5 py-1 rounded text-[11px] font-mono text-slate-800 font-semibold">
                  TMW Electoral Ward Registrations 2027
                </div>
                <p className="text-[10px] text-slate-400">
                  (Leave the sheet empty — our script automatically creates headers and green styling on first submission!)
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#0D5C3A] text-white font-bold text-[11px] flex items-center justify-center shrink-0">2</span>
                  <strong className="text-slate-900 font-bold">Open Apps Script Editor</strong>
                </div>
                <p className="text-slate-600 text-[11px]">
                  In your Google Sheet top menu, click:
                </p>
                <div className="bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded text-[11px] font-semibold text-emerald-900">
                  Extensions ➔ Apps Script
                </div>
                <p className="text-[10px] text-slate-500">
                  A new browser tab titled <em>"Untitled project"</em> will open with a code editor.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#0D5C3A] text-white font-bold text-[11px] flex items-center justify-center shrink-0">3</span>
                  <strong className="text-slate-900 font-bold">Paste Code &amp; Save</strong>
                </div>
                <p className="text-slate-600 text-[11px]">
                  In the code editor:
                </p>
                <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
                  <li>Select all default code in <code className="bg-slate-100 px-1 rounded">Code.gs</code> and delete it.</li>
                  <li>Click the green <strong>"Copy Apps Script Code"</strong> button above.</li>
                  <li>Paste into <code className="bg-slate-100 px-1 rounded">Code.gs</code>.</li>
                  <li>Click the <strong>Disk icon (Save)</strong> or press <kbd className="bg-slate-100 px-1 rounded">Ctrl+S</kbd> / <kbd className="bg-slate-100 px-1 rounded">Cmd+S</kbd>.</li>
                </ul>
              </div>

              {/* Step 4 */}
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#0D5C3A] text-white font-bold text-[11px] flex items-center justify-center shrink-0">4</span>
                  <strong className="text-slate-900 font-bold">Deploy as Web App</strong>
                </div>
                <p className="text-slate-600 text-[11px]">
                  At the top right of Apps Script, click the blue <strong>Deploy</strong> button ➔ <strong>New deployment</strong>:
                </p>
                <div className="space-y-1 text-[11px] bg-slate-50 p-2 rounded border border-slate-200">
                  <div>• <strong>Select type:</strong> Click gear icon ➔ select <strong>Web app</strong></div>
                  <div>• <strong>Description:</strong> TMW Ward Registration</div>
                  <div>• <strong>Execute as:</strong> <span className="font-bold text-emerald-800">Me (your email)</span></div>
                  <div>• <strong>Who has access:</strong> <span className="font-bold text-red-600 bg-red-50 px-1 rounded">Anyone</span></div>
                </div>
              </div>
            </div>

            {/* Crucial Google Authorization Callout */}
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>How to Bypass Google's "Google hasn't verified this app" Screen:</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                When you click Deploy for the first time, Google will ask to authorize permissions:
              </p>
              <ol className="list-decimal list-inside text-[11px] space-y-1 pl-1">
                <li>Click <strong>"Authorize access"</strong> and choose your Google Account.</li>
                <li>When the warning screen appears saying <em>"Google hasn't verified this app"</em>, click the small link labeled <strong>"Advanced"</strong> at the bottom left.</li>
                <li>Click <strong>"Go to Untitled project (unsafe)"</strong>.</li>
                <li>Click <strong>"Allow"</strong> to grant your own script permission to write rows to your Google Sheet.</li>
              </ol>
            </div>

            {/* Step 5 */}
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-950 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#0D5C3A] text-white font-bold text-[11px] flex items-center justify-center shrink-0">5</span>
                <strong className="text-emerald-900 font-bold">Copy Web App URL &amp; Connect to This App</strong>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Copy the generated Web App URL (it will look like <code className="bg-white/80 px-1 py-0.5 rounded font-mono text-[10px]">https://script.google.com/macros/s/AKfycb.../exec</code>), paste it into the <strong>"Google Apps Script Web App URL"</strong> box above, and click <strong>"Save URL"</strong>!
              </p>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
