/**
 * Ward Submissions & Local Registry Table
 * Allows searching, filtering, syncing offline queue, and exporting CSV
 */

import React, { useState } from "react";
import { RegistrationRecord } from "../types";
import { exportToCSV, submitRegistration } from "../services/googleSheetsService";
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
  Loader2
} from "lucide-react";

interface SubmissionsTableProps {
  records: RegistrationRecord[];
  onRefresh: () => void;
  onViewRecord: (record: RegistrationRecord) => void;
  onDeleteRecord: (id: string) => void;
  onClearAll: () => void;
  isBackendConnected: boolean;
  openSettings: () => void;
}

export const SubmissionsTable: React.FC<SubmissionsTableProps> = ({
  records,
  onRefresh,
  onViewRecord,
  onDeleteRecord,
  onClearAll,
  isBackendConnected,
  openSettings,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "synced" | "pending" | "local_saved">("all");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Filter records
  const filtered = records.filter(r => {
    const matchesSearch = 
      r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.phone.includes(searchTerm) ||
      r.vin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.ward.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.lga.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.referenceId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = records.filter(r => r.status === "pending" || r.status === "local_saved").length;

  const handleSyncPending = async () => {
    if (!isBackendConnected) {
      openSettings();
      return;
    }

    const pendingRecords = records.filter(r => r.status === "pending" || r.status === "local_saved");
    if (pendingRecords.length === 0) {
      setSyncFeedback("All records are already synchronized!");
      setTimeout(() => setSyncFeedback(null), 3000);
      return;
    }

    setIsSyncing(true);
    setSyncFeedback(null);
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
    setSyncFeedback(`Successfully synchronized ${successCount} records to your Google Sheet!`);
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header and KPI strip */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-[#0D5C3A]">
              TMW Electoral Ward Registrations Directory
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Live device registry of verified citizens enrolled in the Ward mobilization database.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => exportToCSV(records)}
              disabled={records.length === 0}
              className="px-3.5 py-2 text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg hover:bg-emerald-100 flex items-center gap-1.5 transition-colors disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
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
                className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
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
            placeholder="Search by name, phone, VIN, ward, or reference ID..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-hidden font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:ring-2 focus:ring-emerald-600"
          >
            <option value="all">All Registrations ({records.length})</option>
            <option value="synced">Synced to Sheets ({records.filter(r => r.status === 'synced').length})</option>
            <option value="local_saved">Local / Queued ({pendingCount})</option>
          </select>
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
                ? "No registered members matched your search criteria."
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
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Ward / LGA</th>
                  <th className="py-3 px-4">Voter VIN</th>
                  <th className="py-3 px-4">Bank &amp; Account</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Ref ID */}
                    <td className="py-2.5 px-4 font-mono font-semibold text-emerald-800 whitespace-nowrap">
                      {item.referenceId}
                    </td>

                    {/* Full Name */}
                    <td className="py-2.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {item.fullName}
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
