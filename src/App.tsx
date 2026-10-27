/**
 * Tinubu Movement Worldwide (TMW) Electoral Ward Registration Application
 * National Support & Campaign Coordination Institution
 * Renewed Hope. Renewed Nigeria. Brighter Future.
 */

import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { SingleRegistrationForm } from "./components/SingleRegistrationForm";
import { WardSheetBatchForm } from "./components/WardSheetBatchForm";
import { SubmissionsTable } from "./components/SubmissionsTable";
import { RegistrationSlipModal } from "./components/RegistrationSlipModal";
import { GoogleSheetsModal } from "./components/GoogleSheetsModal";
import { AdminAuthModal } from "./components/AdminAuthModal";
import { PrintWardSheet } from "./components/PrintWardSheet";
import { RegistrationRecord, WardSheetHeader, WardSheetRow } from "./types";
import { 
  getSavedScriptUrl, 
  getStoredRegistrations, 
  saveStoredRegistrations 
} from "./services/googleSheetsService";
import { TMWLogo } from "./components/TMWLogo";
import { 
  ShieldCheck, 
  Lock,
  Unlock
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"individual" | "ward_sheet" | "registry" | "print_preview">("individual");
  const [records, setRecords] = useState<RegistrationRecord[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [selectedSlipRecord, setSelectedSlipRecord] = useState<RegistrationRecord | null>(null);
  const [scriptUrl, setScriptUrl] = useState<string>("");

  // Coordinator Mode (Hidden from public by default)
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("admin") === "true" || window.location.hash === "#admin") {
      return true;
    }
    return sessionStorage.getItem("tmw_admin_mode") === "true";
  });

  // Print data state
  const [printData, setPrintData] = useState<{
    header: WardSheetHeader;
    rows: WardSheetRow[];
  }>({
    header: {
      state: "Lagos",
      lga: "Ikeja",
      ward: "Ward 01 (Alausa)",
    },
    rows: Array.from({ length: 20 }, (_, i) => ({
      sn: i + 1,
      names: "",
      phone: "",
      vin: "",
      pollingUnit: "",
      bank: "",
      accountNo: "",
      sign: ""
    }))
  });

  // Load records and saved Google Apps Script URL on initial load
  useEffect(() => {
    const loadedUrl = getSavedScriptUrl();
    setScriptUrl(loadedUrl);
    const loadedRecords = getStoredRegistrations();
    setRecords(loadedRecords);
  }, []);

  // Redirect to individual tab if registry tab is requested while in public view
  useEffect(() => {
    if (activeTab === "registry" && !isAdminMode) {
      setActiveTab("individual");
    }
  }, [activeTab, isAdminMode]);

  const refreshRecords = () => {
    setRecords(getStoredRegistrations());
  };

  const handleSingleSuccess = (record: RegistrationRecord) => {
    refreshRecords();
    setSelectedSlipRecord(record);
  };

  const handleBatchSuccess = (count: number) => {
    refreshRecords();
  };

  const handleDeleteRecord = (id: string) => {
    if (confirm("Delete this registration record from local memory?")) {
      const updated = records.filter(r => r.id !== id);
      saveStoredRegistrations(updated);
      setRecords(updated);
    }
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear all registrations stored on this device? Ensure you have exported CSV or synced to Google Sheets first.")) {
      saveStoredRegistrations([]);
      setRecords([]);
    }
  };

  const handleOpenPrintPreview = (header: WardSheetHeader, rows: WardSheetRow[]) => {
    setPrintData({ header, rows });
    setActiveTab("print_preview");
  };

  const handleUnlockAdmin = () => {
    setIsAdminMode(true);
    sessionStorage.setItem("tmw_admin_mode", "true");
  };

  const handleExitAdminMode = () => {
    setIsAdminMode(false);
    sessionStorage.removeItem("tmw_admin_mode");
    if (activeTab === "registry") {
      setActiveTab("individual");
    }
  };

  const pageCopy = {
    individual: { eyebrow: "MEMBER INTAKE", title: "Electoral Ward Registration", detail: "National grassroots member directory" },
    ward_sheet: { eyebrow: "COORDINATOR WORKSPACE", title: "Ward Sheet Intake", detail: "Register members in batches of 20" },
    registry: { eyebrow: "RECORDS & FOLLOW-UP", title: "Electoral Ward Registry", detail: "Review, export, and sync saved records" },
    print_preview: { eyebrow: "DOCUMENT OUTPUT", title: "Official Ward Sheet", detail: "Review the print layout before exporting" },
  }[activeTab];

  return (
    <div className="app-shell min-h-screen flex flex-col font-sans text-slate-900">
      {/* Top Brand Header (Cleaned of top bar phone/WhatsApp; hides Connect Google Sheet & Registry in public view) */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openSettings={() => setIsSettingsOpen(true)}
        isBackendConnected={Boolean(scriptUrl)}
        totalRegistered={records.length}
        isAdminMode={isAdminMode}
        onExitAdminMode={handleExitAdminMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-7 sm:py-9">
        <div className="mb-6 flex flex-col gap-3 border-b border-emerald-950/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-red-700">{pageCopy.eyebrow}</p>
            <h2 className="mt-1 text-2xl font-extrabold leading-tight text-emerald-950 sm:text-3xl">{pageCopy.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{pageCopy.detail}</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
            <span>National coordination portal</span>
          </div>
        </div>
        
        {/* Dynamic View rendering */}
        {activeTab === "individual" && (
          <SingleRegistrationForm
            onSuccess={handleSingleSuccess}
            openSettings={() => setIsSettingsOpen(true)}
            isBackendConnected={Boolean(scriptUrl)}
            isAdminMode={isAdminMode}
          />
        )}

        {activeTab === "ward_sheet" && (
          <WardSheetBatchForm
            onSuccess={handleBatchSuccess}
            openSettings={() => setIsSettingsOpen(true)}
            isBackendConnected={Boolean(scriptUrl)}
            onPrintPreview={handleOpenPrintPreview}
          />
        )}

        {/* Registry Database view is only accessible when in Coordinator Mode */}
        {activeTab === "registry" && isAdminMode && (
          <SubmissionsTable
            records={records}
            onRefresh={refreshRecords}
            onViewRecord={(rec) => setSelectedSlipRecord(rec)}
            onDeleteRecord={handleDeleteRecord}
            onClearAll={handleClearAll}
            isBackendConnected={Boolean(scriptUrl)}
            openSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {activeTab === "print_preview" && (
          <PrintWardSheet
            header={printData.header}
            rows={printData.rows}
            onBack={() => setActiveTab("ward_sheet")}
          />
        )}
      </main>

      {/* Verified Member Slip Modal */}
      {selectedSlipRecord && (
        <RegistrationSlipModal
          record={selectedSlipRecord}
          onClose={() => setSelectedSlipRecord(null)}
          onNewRegistration={() => {
            setSelectedSlipRecord(null);
            setActiveTab("individual");
          }}
        />
      )}

      {/* Google Sheets Backend Setup Modal */}
      <GoogleSheetsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentUrl={scriptUrl}
        onUrlUpdated={(newUrl) => setScriptUrl(newUrl)}
      />

      {/* Coordinator / Admin Passcode Modal */}
      <AdminAuthModal
        isOpen={isAdminAuthOpen}
        onClose={() => setIsAdminAuthOpen(false)}
        onUnlock={handleUnlockAdmin}
      />

      {/* Official Footer with the Coordination Helpline */}
      <footer className="mt-12 border-t border-emerald-950/10 bg-white/95 py-7 text-xs text-slate-600 print:hidden shadow-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <TMWLogo size={46} />
            <div>
              <p className="font-extrabold text-[#0D5C3A] text-sm">
                TINUBU MOVEMENT WORLDWIDE (TMW)
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                National Support &amp; Campaign Coordination Institution
              </p>
            </div>
          </div>

          {/* Footer Information & Coordinator Access */}
          <div className="text-center md:text-right flex flex-col items-center md:items-end gap-1.5">
            <p className="font-semibold text-slate-800">
              National Support &amp; Campaign Coordination Institution
            </p>

            <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
              <span>Secure Cloud Integration</span>
              <span>·</span>
              {isAdminMode ? (
                <button
                  type="button"
                  onClick={handleExitAdminMode}
                  className="text-red-700 hover:text-red-900 font-bold hover:underline flex items-center gap-1"
                >
                  <Lock className="w-3 h-3" />
                  <span>Exit Coordinator Mode</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAdminAuthOpen(true)}
                  className="text-emerald-800 hover:text-emerald-950 font-semibold hover:underline flex items-center gap-1"
                  title="Unlock Google Sheet settings & registry database"
                >
                  <Lock className="w-3 h-3 text-emerald-700" />
                  <span>Coordinator Login</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <p>© {new Date().getFullYear()} Tinubu Movement Worldwide (TMW). Official Electoral Ward Registration System.</p>
          <p className="text-[10px]">Renewed Hope. Renewed Nigeria. Brighter Future.</p>
        </div>
      </footer>
    </div>
  );
}
