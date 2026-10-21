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
  CheckCircle, 
  FileSpreadsheet, 
  Phone, 
  MessageSquare,
  Users,
  Building,
  Vote
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"individual" | "ward_sheet" | "registry" | "print_preview">("individual");
  const [records, setRecords] = useState<RegistrationRecord[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedSlipRecord, setSelectedSlipRecord] = useState<RegistrationRecord | null>(null);
  const [scriptUrl, setScriptUrl] = useState<string>("");

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Brand Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openSettings={() => setIsSettingsOpen(true)}
        isBackendConnected={Boolean(scriptUrl)}
        totalRegistered={records.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:py-8">
        
        {/* Dynamic View rendering */}
        {activeTab === "individual" && (
          <SingleRegistrationForm
            onSuccess={handleSingleSuccess}
            openSettings={() => setIsSettingsOpen(true)}
            isBackendConnected={Boolean(scriptUrl)}
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

        {activeTab === "registry" && (
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

      {/* Official Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-8 text-xs text-slate-600 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <TMWLogo size={42} />
            <div>
              <p className="font-extrabold text-[#0D5C3A] text-sm">
                TINUBU MOVEMENT WORLDWIDE (TMW)
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                National Support &amp; Campaign Coordination Institution
              </p>
            </div>
          </div>

          <div className="text-center md:text-right">
            <p className="font-semibold text-slate-800">
              National Headquarters Coordination Line: 08038749440
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Secure Google Apps Script Cloud Integration · No External Database Dependency
            </p>
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
