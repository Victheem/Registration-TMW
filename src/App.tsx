/**
 * Tinubu Movement Worldwide (TMW) Electoral Ward Registration Application
 * National Support & Campaign Coordination Institution
 * Renewed Hope. Renewed Nigeria. Brighter Future.
 */

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { SingleRegistrationForm } from "./components/SingleRegistrationForm";
import { WardSheetBatchForm } from "./components/WardSheetBatchForm";
import { SubmissionsTable } from "./components/SubmissionsTable";
import { RegistrationSlipModal } from "./components/RegistrationSlipModal";
import { AdminAuthModal } from "./components/AdminAuthModal";
import { StateCoordinatorAuthModal } from "./components/StateCoordinatorAuthModal";
import { StateCoordinatorRegistry } from "./components/StateCoordinatorRegistry";
import { PrintWardSheet } from "./components/PrintWardSheet";
import { RegistrationRecord, WardSheetHeader, WardSheetRow } from "./types";
import { 
  getSavedScriptUrl, 
  clearSyncedRegistrationCache,
  syncServerConfig,
  fetchServerRegistrations,
  fetchStateCoordinatorRegistrations
} from "./services/googleSheetsService";
import { TMWLogo } from "./components/TMWLogo";
import { Lock } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"individual" | "ward_sheet" | "registry" | "state_registry" | "print_preview">("individual");
  const [records, setRecords] = useState<RegistrationRecord[]>([]);
  const [stateRecords, setStateRecords] = useState<RegistrationRecord[]>([]);
  const [stateRegistryError, setStateRegistryError] = useState<string | null>(null);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [isStateAuthOpen, setIsStateAuthOpen] = useState(false);
  const [selectedSlipRecord, setSelectedSlipRecord] = useState<RegistrationRecord | null>(null);
  const [scriptUrl, setScriptUrl] = useState<string>("");
  const [nationalToken, setNationalToken] = useState<string | null>(null);
  const [stateCoordinator, setStateCoordinator] = useState<{
    token: string;
    state: string;
    mustChangePin: boolean;
  } | null>(null);

  // Coordinator Mode (Hidden from public by default)
  const [isAdminMode, setIsAdminMode] = useState(false);

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

  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isStateRefreshing, setIsStateRefreshing] = useState(false);

  const refreshRecords = useCallback(async () => {
    if (!isAdminMode || !nationalToken) return;
    setIsRefreshing(true);
    try {
      const updated = await fetchServerRegistrations(nationalToken);
      setRecords(updated);
      setLastSyncTime(new Date());
    } catch (err) {
      console.warn("Error refreshing server records:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [isAdminMode, nationalToken]);

  const refreshStateRecords = useCallback(async () => {
    if (!stateCoordinator || stateCoordinator.mustChangePin) return;
    setIsStateRefreshing(true);
    try {
      const updated = await fetchStateCoordinatorRegistrations(stateCoordinator.token);
      setStateRecords(updated);
      setStateRegistryError(null);
    } catch (err) {
      console.warn("Error refreshing state coordinator records:", err);
      setStateRegistryError(err instanceof Error ? err.message : "Could not load state registrations.");
    } finally {
      setIsStateRefreshing(false);
    }
  }, [stateCoordinator]);

  // Load shared configuration without fetching registration data in public mode.
  useEffect(() => {
    clearSyncedRegistrationCache();
    const loadedUrl = getSavedScriptUrl();
    if (loadedUrl) setScriptUrl(loadedUrl);

    syncServerConfig().then((syncedUrl) => {
      if (syncedUrl) {
        setScriptUrl(syncedUrl);
      }
    });
  }, []);

  useEffect(() => {
    if (!isAdminMode || !nationalToken) {
      setRecords([]);
      return;
    }
    refreshRecords();
    const interval = setInterval(() => {
      refreshRecords();
    }, 3500);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshRecords();
      }
    };

    window.addEventListener("focus", handleVisibility);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleVisibility);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isAdminMode, nationalToken, refreshRecords]);

  useEffect(() => {
    if (activeTab === "registry" && isAdminMode) {
      refreshRecords();
    }
  }, [activeTab, isAdminMode, refreshRecords]);

  useEffect(() => {
    if (activeTab === "registry" && !isAdminMode) {
      setActiveTab("individual");
    }
    if (activeTab === "state_registry" && !stateCoordinator) {
      setActiveTab("individual");
    }
  }, [activeTab, isAdminMode, stateCoordinator]);

  useEffect(() => {
    if (!stateCoordinator) {
      setStateRecords([]);
      return;
    }
    refreshStateRecords();
    const interval = setInterval(refreshStateRecords, 3500);
    return () => clearInterval(interval);
  }, [stateCoordinator, refreshStateRecords]);

  const handleSingleSuccess = (record: RegistrationRecord) => {
    refreshRecords();
    setSelectedSlipRecord(record);
  };

  const handleBatchSuccess = (count: number) => {
    refreshRecords();
  };

  const handleDeleteRecord = async (id: string) => {
    if (!nationalToken) return;
    if (confirm("Delete this registration record?")) {
      try {
        const response = await fetch(`/api/registrations/${encodeURIComponent(id)}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${nationalToken}` },
        });
        if (!response.ok) throw new Error("The registration could not be deleted.");
        await refreshRecords();
      } catch (err) {
        alert(err instanceof Error ? err.message : "The registration could not be deleted.");
      }
    }
  };

  const handleClearAll = async () => {
    if (!nationalToken) return;
    if (confirm("Are you sure you want to clear all registrations stored on this server? Ensure you have exported CSV or synced to Google Sheets first.")) {
      try {
        const response = await fetch("/api/registrations", {
          method: "DELETE",
          headers: { Authorization: `Bearer ${nationalToken}` },
        });
        if (!response.ok) throw new Error("The registrations could not be cleared.");
        setRecords([]);
      } catch (err) {
        alert(err instanceof Error ? err.message : "The registrations could not be cleared.");
      }
    }
  };

  const handleOpenPrintPreview = (header: WardSheetHeader, rows: WardSheetRow[]) => {
    setPrintData({ header, rows });
    setActiveTab("print_preview");
  };

  const handleUnlockAdmin = (token: string) => {
    setStateCoordinator(null);
    setStateRecords([]);
    setNationalToken(token);
    setIsAdminMode(true);
  };

  const handleExitAdminMode = () => {
    setIsAdminMode(false);
    setNationalToken(null);
    setRecords([]);
    if (activeTab === "registry") {
      setActiveTab("individual");
    }
  };

  const handleUnlockStateCoordinator = (session: {
    token: string;
    state: string;
    mustChangePin: boolean;
  }) => {
    setNationalToken(null);
    setIsAdminMode(false);
    setRecords([]);
    setStateCoordinator(session);
    setStateRegistryError(null);
    setActiveTab("state_registry");
  };

  const handleExitStateCoordinator = () => {
    setStateCoordinator(null);
    setStateRecords([]);
    setStateRegistryError(null);
    if (activeTab === "state_registry") setActiveTab("individual");
  };

  const pageCopy = {
    individual: { eyebrow: "MEMBER INTAKE", title: "Electoral Ward Registration", detail: "National grassroots member directory" },
    ward_sheet: { eyebrow: "COORDINATOR WORKSPACE", title: "Ward Sheet Intake", detail: "Register members in batches of 20" },
    registry: { eyebrow: "RECORDS & FOLLOW-UP", title: "Electoral Ward Registry", detail: "Review, export, and sync saved records" },
    state_registry: { eyebrow: "STATE COORDINATION", title: "State Registration List", detail: "View registrations assigned to your state" },
    print_preview: { eyebrow: "DOCUMENT OUTPUT", title: "Official Ward Sheet", detail: "Review the print layout before exporting" },
  }[activeTab];

  return (
    <div className="app-shell min-h-screen flex flex-col font-sans text-slate-900">
      {/* Top Brand Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalRegistered={isAdminMode ? records.length : stateRecords.length}
        isAdminMode={isAdminMode}
        onExitAdminMode={handleExitAdminMode}
        isStateCoordinator={Boolean(stateCoordinator)}
        stateCoordinatorState={stateCoordinator?.state}
        onExitStateCoordinator={handleExitStateCoordinator}
        onOpenStateCoordinatorLogin={() => setIsStateAuthOpen(true)}
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
          />
        )}

        {activeTab === "ward_sheet" && (
          <WardSheetBatchForm
            onSuccess={handleBatchSuccess}
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
            scriptUrl={scriptUrl}
            authToken={nationalToken || undefined}
            lastSyncTime={lastSyncTime}
            isRefreshing={isRefreshing}
          />
        )}

        {activeTab === "state_registry" && stateCoordinator && (
          <StateCoordinatorRegistry
            state={stateCoordinator.state}
            token={stateCoordinator.token}
            mustChangePin={stateCoordinator.mustChangePin}
            records={stateRecords}
            loadError={stateRegistryError}
            onRefresh={refreshStateRecords}
            isRefreshing={isStateRefreshing}
            onPinChanged={(token) => setStateCoordinator((current) =>
              current ? { ...current, token, mustChangePin: false } : current,
            )}
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

      {/* Coordinator / Admin Passcode Modal */}
      <AdminAuthModal
        isOpen={isAdminAuthOpen}
        onClose={() => setIsAdminAuthOpen(false)}
        onUnlock={handleUnlockAdmin}
      />
      <StateCoordinatorAuthModal
        isOpen={isStateAuthOpen}
        onClose={() => setIsStateAuthOpen(false)}
        onUnlock={handleUnlockStateCoordinator}
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
