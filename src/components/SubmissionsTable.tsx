/**
 * Ward Submissions & Local Registry Table
 * Allows searching, filtering, syncing offline queue, and exporting CSV
 * Includes EXCO vs Non-EXCO classification & role indicators
 */

import React, { useState } from "react";
import { RegistrationRecord } from "../types";
import { 
  exportToCSV, 
  submitRegistration, 
  syncAllPendingToSheets,
  pushAllToGoogleSheets,
  fetchFromGoogleSheets 
} from "../services/googleSheetsService";
import { 
  Search, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Eye, 
  Trash2, 
  Filter,
  FileSpreadsheet,
  AlertTriangle,
  Loader2,
  Star,
  Users,
  Database,
  Sparkles,
  ArrowDownToLine,
  Layers
} from "lucide-react";

interface SubmissionsTableProps {
  records: RegistrationRecord[];
  onRefresh: () => void;
  onViewRecord: (record: RegistrationRecord) => void;
  onDeleteRecord: (id: string) => void;
  onClearAll: () => void;
  isBackendConnected: boolean;
  scriptUrl?: string;
  lastSyncTime?: Date;
  isRefreshing?: boolean;
  openSettings: () => void;
  openSupabaseModal?: () => void;
}

export const SubmissionsTable: React.FC<SubmissionsTableProps> = ({
  records,
  onRefresh,
  onViewRecord,
  onDeleteRecord,
  onClearAll,
  isBackendConnected,
  scriptUrl = "",
  lastSyncTime,
  isRefreshing = false,
  openSettings,
  openSupabaseModal,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "synced" | "pending" | "local_saved">("all");
  const [excoFilter, setExcoFilter] = useState<"all" | "exco" | "non_exco">("all");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const isDevUrl = scriptUrl.trim().endsWith("/dev");

  // Filter records
  const filtered = records.filter(r => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      r.fullName.toLowerCase().includes(term) ||
      (r.role && r.role.toLowerCase().includes(term)) ||
      (r.excoLevel && r.excoLevel.toLowerCase().includes(term)) ||
      r.phone.includes(term) ||
      r.vin.toLowerCase().includes(term) ||
      r.ward.toLowerCase().includes(term) ||
      r.lga.toLowerCase().includes(term) ||
      r.referenceId.toLowerCase().includes(term);

    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    const matchesExco = 
      excoFilter === "all" || 
      (excoFilter === "exco" && (r.isExco || r.role?.toUpperCase().includes("EXCO"))) ||
      (excoFilter === "non_exco" && (!r.isExco && !r.role?.toUpperCase().includes("EXCO")));

    return matchesSearch && matchesStatus && matchesExco;
  });

  const pendingCount = records.filter(r => r.status === "pending" || r.status === "local_saved").length;
  const excoCount = records.filter(r => r.isExco || r.role?.toUpperCase().includes("EXCO")).length;
  const nonExcoCount = records.length - excoCount;

  const handleSyncPending = async () => {
    if (!isBackendConnected) {
      openSettings();
      return;
    }

    if (isDevUrl) {
      openSettings();
      return;
    }

    const pendingRecords = records.filter(r => r.status === "pending" || r.status === "local_saved");
    if (pendingRecords.length === 0) {
      setSyncFeedback("All records are already synchronized to Google Sheets!");
      setTimeout(() => setSyncFeedback(null), 3000);
      return;
    }

    setIsSyncing(true);
    setSyncFeedback(null);

    // Try batch server sync first
    const batchRes = await syncAllPendingToSheets();
    if (batchRes.success) {
      setIsSyncing(false);
      onRefresh();
      setSyncFeedback(batchRes.message);
      setTimeout(() => setSyncFeedback(null), 5000);
      return;
    }

    if (batchRes.isUnauthorized) {
      setIsSyncing(false);
      setSyncFeedback("Sync blocked by Google (401 Unauthorized): In Apps Script deployment, change 'Who has access' to 'Anyone'.");
      setTimeout(() => setSyncFeedback(null), 7000);
      return;
    }

    // Fallback: Individual sync with dual-channel fallback
    let successCount = 0;
    for (const record of pendingRecords) {
      try {
        const res = await submitRegistration(record);
        if (res.mode === "sheets") {
          successCount++;
        }
      } catch (e) {
        console.error("Sync error:", e);
      }
    }

    setIsSyncing(false);
    onRefresh();
    if (successCount > 0) {
      setSyncFeedback(`Successfully synchronized ${successCount} records to your Google Sheet!`);
    } else {
      setSyncFeedback("Unable to sync: check that Google Apps Script deployment access is set to 'Anyone'.");
    }
    setTimeout(() => setSyncFeedback(null), 5000);
  };

  const [isPushingAll, setIsPushingAll] = useState(false);

  const handlePushAllToFreshSheet = async () => {
    if (!isBackendConnected) {
      openSettings();
      return;
    }
    if (records.length === 0) {
      setSyncFeedback("No records in registry to push.");
      return;
    }
    if (!confirm(`Populate your fresh Google Sheet with all ${records.length} registered members? This will append the full registry to your sheet.`)) {
      return;
    }

    setIsPushingAll(true);
    setSyncFeedback(null);

    const res = await pushAllToGoogleSheets();
    setIsPushingAll(false);
    onRefresh();
    setSyncFeedback(res.message);
    setTimeout(() => setSyncFeedback(null), 6000);
  };

  const [isFetchingFromSheets, setIsFetchingFromSheets] = useState(false);

  const handleFetchFromGoogleSheets = async () => {
    if (!isBackendConnected) {
      openSettings();
      return;
    }

    setIsFetchingFromSheets(true);
    setSyncFeedback(null);

    const res = await fetchFromGoogleSheets();
    setIsFetchingFromSheets(false);
    onRefresh();

    setSyncFeedback(res.message);
    setTimeout(() => setSyncFeedback(null), 6000);
  };

  const formattedSyncTime = lastSyncTime 
    ? lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : "Just now";

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Real-Time Cross-Device Synchronization Status Banner */}
      <div className="bg-emerald-900 text-white rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
          </span>
          <span className="font-bold tracking-wide">
            Central Registry Live:
          </span>
          <span className="text-emerald-100 hidden sm:inline">
            Submissions on any phone or laptop appear here automatically (syncs every 3.5s).
          </span>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <span className="text-[11px] text-emerald-200">
            Last updated: <span className="font-mono font-semibold text-white">{formattedSyncTime}</span>
          </span>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 hover:text-white rounded font-semibold text-[11px] flex items-center gap-1.5 transition-colors border border-emerald-700"
            title="Fetch latest registrations from all field agents"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin text-amber-300" : ""}`} />
            <span>{isRefreshing ? "Syncing..." : "Refresh Now"}</span>
          </button>
        </div>
      </div>

      {/* Warning callout if connected URL is /dev */}
      {isDevUrl && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs">
          <div className="flex items-start sm:items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <strong className="font-bold text-amber-900">Developer Test URL Active (/dev):</strong>
              <span className="ml-1 text-slate-800">
                All records are saved centrally and sync across Device A and Device B. To sync directly to your Google Sheet, create a live Web App deployment (/exec) with &apos;Who has access: Anyone&apos;.
              </span>
            </div>
          </div>
          <button
            onClick={openSettings}
            className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-lg text-xs whitespace-nowrap self-start sm:self-auto shrink-0 transition-colors"
          >
            Update Google Sheet URL
          </button>
        </div>
      )}

      {/* Header and KPI strip */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-[#0D5C3A]">
              TMW Electoral Ward Registrations Directory
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
              <span>Total Members: <strong className="text-slate-900 font-bold">{records.length}</strong></span>
              <span>·</span>
              <span className="flex items-center gap-1 text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                <span>EXCO Members: <strong>{excoCount}</strong></span>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <Users className="w-3 h-3 text-emerald-600" />
                <span>Non-EXCO Members: <strong>{nonExcoCount}</strong></span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {openSupabaseModal && (
              <button
                onClick={openSupabaseModal}
                className="px-3 py-2 text-xs font-semibold bg-emerald-50 text-emerald-950 border border-emerald-300 rounded-lg hover:bg-emerald-100 flex items-center gap-1.5 transition-colors shadow-2xs"
                title="View Supabase SQL Guide and Cloud Connection"
              >
                <Database className="w-3.5 h-3.5 text-emerald-700" />
                <span>Supabase SQL Guide</span>
              </button>
            )}

            <button
              onClick={openSettings}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-colors shadow-2xs ${
                isBackendConnected
                  ? "bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200"
                  : "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
              }`}
              title="Open Google Sheets connection guide and setup"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>{isBackendConnected ? "Google Sheet Ready" : "Setup Google Sheet"}</span>
            </button>

            {/* Populate Fresh Sheet with All Records */}
            {isBackendConnected && records.length > 0 && (
              <button
                onClick={handlePushAllToFreshSheet}
                disabled={isPushingAll}
                className="px-3 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                title="Populates a brand-new empty Google Sheet with all existing registered members"
              >
                {isPushingAll ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-900" />
                    <span>Populating Sheet...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-slate-900" />
                    <span>Populate Fresh Sheet ({records.length})</span>
                  </>
                )}
              </button>
            )}

            {/* Fetch and merge rows directly from Google Sheet */}
            {isBackendConnected && (
              <button
                onClick={handleFetchFromGoogleSheets}
                disabled={isFetchingFromSheets}
                className="px-3 py-2 text-xs font-bold bg-[#0D5C3A] hover:bg-[#09432A] text-white rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Fetches and loads all rows directly from your Google Sheet into the coordinator registry"
              >
                {isFetchingFromSheets ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-200" />
                    <span>Fetching Sheet Data...</span>
                  </>
                ) : (
                  <>
                    <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Fetch from Google Sheet</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => exportToCSV(records)}
              disabled={records.length === 0}
              className="px-3 py-2 text-xs font-semibold bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 transition-colors disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleSyncPending}
              disabled={isSyncing || pendingCount === 0}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs ${
                pendingCount > 0
                  ? "bg-[#0D5C3A] hover:bg-[#09432A] text-white"
                  : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
              }`}
              title="Synchronize pending records to both Supabase and Google Sheet"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-200" />
                  <span>Syncing {pendingCount}...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync Pending ({pendingCount})</span>
                </>
              )}
            </button>

            {records.length > 0 && (
              <button
                onClick={onClearAll}
                className="px-2.5 py-2 text-xs font-medium text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                title="Clear local device cache"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Sync feedback */}
        {syncFeedback && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, role, EXCO level, VIN, phone, ward..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-hidden font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* EXCO Role Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Role:</span>
            <select
              value={excoFilter}
              onChange={(e) => setExcoFilter(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:ring-2 focus:ring-emerald-600"
            >
              <option value="all">All Roles ({records.length})</option>
              <option value="exco">EXCO Officers Only ({excoCount})</option>
              <option value="non_exco">Non-EXCO Members ({nonExcoCount})</option>
            </select>
          </div>

          {/* Sync Status Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium">Sync:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:ring-2 focus:ring-emerald-600"
            >
              <option value="all">All Status</option>
              <option value="synced">Synced to Sheets ({records.filter(r => r.status === 'synced').length})</option>
              <option value="local_saved">Queued ({pendingCount})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Registrations List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Registrations Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {searchTerm
                ? "No registered members matched your search or role filters."
                : "No members have been registered on this device yet. Use the Single Member Form or Ward Sheet to begin enrollment."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Ref ID</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Role / Classification</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Ward / LGA</th>
                  <th className="py-3 px-4">Voter VIN</th>
                  <th className="py-3 px-4">Bank &amp; Account</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => {
                  const isExco = Boolean(item.isExco || item.role?.toUpperCase().includes("EXCO"));
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Ref ID */}
                      <td className="py-2.5 px-4 font-mono font-semibold text-emerald-800 whitespace-nowrap">
                        {item.referenceId}
                      </td>

                      {/* Full Name */}
                      <td className="py-2.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {item.fullName}
                      </td>

                      {/* Role & EXCO Distinction */}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        {isExco ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                            <div>
                              <span className="font-bold block text-[11px]">{item.role || "EXCO Member"}</span>
                              <span className="text-[9px] text-amber-700 block uppercase font-semibold">
                                {item.excoLevel || "Ward"} Level EXCO
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200">
                            <Users className="w-3 h-3 text-emerald-600 shrink-0" />
                            <div>
                              <span className="font-semibold block text-[11px]">{item.role || "General Member"}</span>
                              <span className="text-[9px] text-emerald-700 block uppercase">Non-EXCO</span>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="py-2.5 px-4 font-mono text-slate-700 whitespace-nowrap">
                        {item.phone}
                      </td>

                      {/* Ward / LGA */}
                      <td className="py-2.5 px-4 text-slate-700">
                        <div className="font-semibold text-slate-900">{item.ward}</div>
                        <div className="text-[10px] text-slate-500">{item.lga}, {item.state}</div>
                      </td>

                      {/* Voter VIN */}
                      <td className="py-2.5 px-4 font-mono uppercase text-slate-800 whitespace-nowrap">
                        {item.vin}
                      </td>

                      {/* Bank & Account */}
                      <td className="py-2.5 px-4 text-slate-700 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{item.bankName}</div>
                        <div className="font-mono text-[10px] text-slate-500">{item.accountNumber}</div>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-4 text-center whitespace-nowrap">
                        {item.status === "synced" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Synced
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Queued
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onViewRecord(item)}
                            className="p-1 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                            title="View Digital Registration Slip"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteRecord(item.id)}
                            className="p-1 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded"
                            title="Remove record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
