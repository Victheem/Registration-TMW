/**
 * Official 20-Row Electoral Ward Registration Sheet Component
 * Faithfully mirrors the PDF official registration sheet for batch submission & coordinator transcription
 * Includes Role & EXCO distinction for all members
 */

import React, { useState } from "react";
import { NIGERIAN_STATES_AND_LGAS, NIGERIAN_BANKS } from "../data/nigeriaData";
import { WardSheetHeader, WardSheetRow } from "../types";
import { submitBatchWardSheet } from "../services/googleSheetsService";
import { 
  Send, 
  Trash2, 
  Plus, 
  Printer, 
  Loader2, 
  CheckCircle2, 
  Sparkles,
  ShieldAlert,
  Star
} from "lucide-react";
import confetti from "canvas-confetti";

interface WardSheetBatchFormProps {
  onSuccess: (count: number) => void;
  openSettings: () => void;
  isBackendConnected: boolean;
  onPrintPreview: (header: WardSheetHeader, rows: WardSheetRow[]) => void;
}

const INITIAL_ROWS_COUNT = 20;

export const WardSheetBatchForm: React.FC<WardSheetBatchFormProps> = ({
  onSuccess,
  openSettings,
  isBackendConnected,
  onPrintPreview,
}) => {
  // Common Top Header
  const [header, setHeader] = useState<WardSheetHeader>({
    state: "Lagos",
    lga: "Ikeja",
    ward: "Ward 01 (Alausa / Secretariat)",
    coordinatorName: "",
    submissionDate: new Date().toISOString().split("T")[0]
  });

  // 20 Rows with Role and EXCO tracking
  const [rows, setRows] = useState<WardSheetRow[]>(() => {
    return Array.from({ length: INITIAL_ROWS_COUNT }, (_, i) => ({
      sn: i + 1,
      names: "",
      role: i === 0 ? "Ward Coordinator (EXCO)" : i === 1 ? "Ward Secretary (EXCO)" : "General Member (Non-EXCO)",
      isExco: i < 2,
      phone: "",
      vin: "",
      pollingUnit: "",
      bank: "",
      accountNo: "",
      sign: ""
    }));
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const selectedStateObj = NIGERIAN_STATES_AND_LGAS.find(s => s.state === header.state);
  const availableLgas = selectedStateObj ? selectedStateObj.lgas : [];

  const handleRowChange = (index: number, field: keyof WardSheetRow, value: any) => {
    setRows(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      if (field === "role") {
        copy[index].isExco = typeof value === "string" && value.toUpperCase().includes("EXCO");
      }
      return copy;
    });
  };

  const handleAddRows = (count: number = 5) => {
    setRows(prev => {
      const startSn = prev.length + 1;
      const newItems: WardSheetRow[] = Array.from({ length: count }, (_, i) => ({
        sn: startSn + i,
        names: "",
        role: "General Member (Non-EXCO)",
        isExco: false,
        phone: "",
        vin: "",
        pollingUnit: "",
        bank: "",
        accountNo: "",
        sign: ""
      }));
      return [...prev, ...newItems];
    });
  };

  const handleClear = () => {
    if (confirm("Are you sure you want to clear all entered rows in this sheet?")) {
      setRows(
        Array.from({ length: INITIAL_ROWS_COUNT }, (_, i) => ({
          sn: i + 1,
          names: "",
          role: "General Member (Non-EXCO)",
          isExco: false,
          phone: "",
          vin: "",
          pollingUnit: "",
          bank: "",
          accountNo: "",
          sign: ""
        }))
      );
      setMessage(null);
    }
  };

  // Populate sample demo rows for quick coordinator testing
  const handleFillSample = () => {
    const samples = [
      { names: "Adewale Babatunde", role: "Ward Coordinator (EXCO)", isExco: true, phone: "08031234567", vin: "90F5B40278192831001", pollingUnit: "PU 001 Grammar School", bank: "Access Bank", accountNo: "0123456789", sign: "Signed" },
      { names: "Fatima Aliyu Bello", role: "Ward Secretary (EXCO)", isExco: true, phone: "08029876543", vin: "90F5B40278192831002", pollingUnit: "PU 002 Ward Secretariat", bank: "GTBank", accountNo: "0234567890", sign: "Signed" },
      { names: "Chinedu Chukwudi", role: "Ward Youth Leader (EXCO)", isExco: true, phone: "08051112233", vin: "90F5B40278192831003", pollingUnit: "PU 003 Central Mosque", bank: "Zenith Bank", accountNo: "1012345678", sign: "Signed" },
      { names: "Grace Toyin Olufemi", role: "Ward Women Leader (EXCO)", isExco: true, phone: "08104445566", vin: "90F5B40278192831004", pollingUnit: "PU 004 Anglican Hall", bank: "First Bank", accountNo: "2012345679", sign: "Signed" },
      { names: "Ibrahim Musa Danjuma", role: "General Member (Non-EXCO)", isExco: false, phone: "08097778899", vin: "90F5B40278192831005", pollingUnit: "PU 005 Town Hall Square", bank: "UBA", accountNo: "2098765432", sign: "Signed" },
      { names: "Blessing Amarachi Okafor", role: "Grassroots Mobilizer (Non-EXCO)", isExco: false, phone: "07063332211", vin: "90F5B40278192831006", pollingUnit: "PU 006 Primary Health Centre", bank: "OPay", accountNo: "8063332211", sign: "Signed" },
    ];

    setRows(prev => {
      const copy = [...prev];
      samples.forEach((sample, i) => {
        copy[i] = {
          sn: i + 1,
          ...sample
        };
      });
      return copy;
    });

    setMessage({
      type: "success",
      text: "Loaded sample ward members with EXCO and Non-EXCO designations into rows 1–6."
    });
  };

  const filledCount = rows.filter(r => r.names.trim() || r.phone.trim()).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!header.state || !header.lga || !header.ward) {
      setMessage({ type: "error", text: "Please fill in the State, LGA, and Electoral Ward header fields." });
      return;
    }

    if (filledCount === 0) {
      setMessage({ type: "error", text: "Please fill in at least one row with member details before submitting." });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitBatchWardSheet(header, rows);
      
      try {
        confetti({
          particleCount: 75,
          spread: 80,
          origin: { y: 0.5 },
          colors: ["#0D5C3A", "#F59E0B", "#10B981"]
        });
      } catch {}

      setMessage({ type: "success", text: result.message });
      onSuccess(result.count);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to submit batch sheet." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Instructions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-100 text-emerald-900 rounded">
                Official Multi-Row Sheet
              </span>
              <span className="text-xs text-slate-500">EXCO &amp; Member Hierarchy Enabled</span>
            </div>
            <h2 className="text-xl font-extrabold text-[#0D5C3A] mt-1">
              ELECTORAL WARD REGISTRATION SHEET (20 ROWS)
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Distinguish Executive Committee (EXCO) officers from General Grassroots members across all wards.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleFillSample}
              className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg hover:bg-emerald-100 flex items-center gap-1.5 transition-colors"
              title="Populate test data into rows"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Fill Sample Data</span>
            </button>

            <button
              type="button"
              onClick={() => onPrintPreview(header, rows)}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Export PDF Sheet</span>
            </button>

            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-slate-200 flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Sheet</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Ward Table Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Top Ward Header (matching PDF State, LGA, Electoral Ward line) */}
        <div className="bg-[#EAF5F0] border-b border-emerald-200 p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* State */}
            <div>
              <label className="block text-[11px] font-extrabold text-[#0D5C3A] uppercase tracking-wider mb-1">
                STATE:
              </label>
              <select
                value={header.state}
                onChange={(e) => {
                  const newState = e.target.value;
                  const st = NIGERIAN_STATES_AND_LGAS.find(s => s.state === newState);
                  setHeader(h => ({
                    ...h,
                    state: newState,
                    lga: st?.lgas[0] || ""
                  }));
                }}
                className="w-full bg-white px-3 py-2 border border-emerald-300 rounded-md text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 uppercase"
                required
              >
                {NIGERIAN_STATES_AND_LGAS.map((s) => (
                  <option key={s.state} value={s.state}>
                    {s.state}
                  </option>
                ))}
              </select>
            </div>

            {/* LGA */}
            <div>
              <label className="block text-[11px] font-extrabold text-[#0D5C3A] uppercase tracking-wider mb-1">
                LGA:
              </label>
              <select
                value={header.lga}
                onChange={(e) => setHeader(h => ({ ...h, lga: e.target.value }))}
                className="w-full bg-white px-3 py-2 border border-emerald-300 rounded-md text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 uppercase"
                required
              >
                {availableLgas.map((lg) => (
                  <option key={lg} value={lg}>
                    {lg}
                  </option>
                ))}
              </select>
            </div>

            {/* Ward */}
            <div>
              <label className="block text-[11px] font-extrabold text-[#0D5C3A] uppercase tracking-wider mb-1">
                ELECTORAL WARD:
              </label>
              <input
                type="text"
                value={header.ward}
                onChange={(e) => setHeader(h => ({ ...h, ward: e.target.value }))}
                placeholder="Enter Ward Name / No."
                className="w-full bg-white px-3 py-2 border border-emerald-300 rounded-md text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 uppercase"
                required
              />
            </div>
          </div>
        </div>

        {/* 20-Row Grid Table with ROLE / EXCO column */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0D5C3A] text-white font-extrabold uppercase text-[11px] tracking-wider border-b border-emerald-950">
                <th className="py-2.5 px-3 text-center border-r border-emerald-700/60 w-12">S/N</th>
                <th className="py-2.5 px-3 border-r border-emerald-700/60 min-w-[170px]">NAMES</th>
                <th className="py-2.5 px-3 border-r border-emerald-700/60 min-w-[170px]">ROLE / EXCO STATUS</th>
                <th className="py-2.5 px-3 border-r border-emerald-700/60 min-w-[125px]">PHONE</th>
                <th className="py-2.5 px-3 border-r border-emerald-700/60 min-w-[155px]">VOTER'S CARD NO.</th>
                <th className="py-2.5 px-3 border-r border-emerald-700/60 min-w-[150px]">POLLING UNIT</th>
                <th className="py-2.5 px-3 border-r border-emerald-700/60 min-w-[130px]">BANK</th>
                <th className="py-2.5 px-3 border-r border-emerald-700/60 min-w-[120px]">ACCOUNT NO.</th>
                <th className="py-2.5 px-3 min-w-[80px] text-center">SIGN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((row, index) => {
                const isRowActive = Boolean(row.names || row.phone || row.vin);
                const isRowExco = Boolean(row.isExco || row.role?.toUpperCase().includes("EXCO"));
                return (
                  <tr
                    key={row.sn}
                    className={`transition-colors ${
                      isRowActive ? (isRowExco ? "bg-amber-50/50" : "bg-emerald-50/40") : index % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                    } hover:bg-emerald-50/70`}
                  >
                    {/* S/N */}
                    <td className="py-2 px-3 text-center font-bold text-slate-600 border-r border-slate-200 tabular-nums">
                      {row.sn}.
                    </td>

                    {/* NAMES */}
                    <td className="py-1 px-1.5 border-r border-slate-200">
                      <input
                        type="text"
                        value={row.names}
                        onChange={(e) => handleRowChange(index, "names", e.target.value)}
                        placeholder="Full Name"
                        className="w-full px-2 py-1.5 text-xs rounded border border-transparent hover:border-slate-300 focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600 outline-hidden font-medium text-slate-900"
                      />
                    </td>

                    {/* ROLE / EXCO STATUS */}
                    <td className="py-1 px-1.5 border-r border-slate-200">
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          list="ward-role-suggestions"
                          value={row.role || ""}
                          onChange={(e) => handleRowChange(index, "role", e.target.value)}
                          placeholder="Select / Type Role"
                          className={`w-full pl-2 pr-6 py-1.5 text-xs rounded border border-transparent hover:border-slate-300 focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600 outline-hidden font-medium ${
                            isRowExco ? "text-amber-900 font-semibold" : "text-slate-800"
                          }`}
                        />
                        {isRowExco && (
                          <span title="EXCO Member" className="absolute right-2 pointer-events-none flex items-center">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* PHONE */}
                    <td className="py-1 px-1.5 border-r border-slate-200">
                      <input
                        type="tel"
                        value={row.phone}
                        onChange={(e) => handleRowChange(index, "phone", e.target.value)}
                        placeholder="Phone Number"
                        className="w-full px-2 py-1.5 text-xs rounded border border-transparent hover:border-slate-300 focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600 outline-hidden font-medium text-slate-900"
                      />
                    </td>

                    {/* VOTER'S CARD NO. */}
                    <td className="py-1 px-1.5 border-r border-slate-200">
                      <input
                        type="text"
                        value={row.vin}
                        onChange={(e) => handleRowChange(index, "vin", e.target.value.toUpperCase())}
                        placeholder="VIN Number"
                        className="w-full px-2 py-1.5 text-xs font-mono rounded border border-transparent hover:border-slate-300 focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600 outline-hidden uppercase text-slate-900"
                      />
                    </td>

                    {/* POLLING UNIT */}
                    <td className="py-1 px-1.5 border-r border-slate-200">
                      <input
                        type="text"
                        value={row.pollingUnit}
                        onChange={(e) => handleRowChange(index, "pollingUnit", e.target.value)}
                        placeholder="PU Name / Code"
                        className="w-full px-2 py-1.5 text-xs rounded border border-transparent hover:border-slate-300 focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600 outline-hidden text-slate-900"
                      />
                    </td>

                    {/* BANK */}
                    <td className="py-1 px-1.5 border-r border-slate-200">
                      <input
                        type="text"
                        list="bank-suggestions"
                        value={row.bank}
                        onChange={(e) => handleRowChange(index, "bank", e.target.value)}
                        placeholder="Bank Name"
                        className="w-full px-2 py-1.5 text-xs rounded border border-transparent hover:border-slate-300 focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600 outline-hidden text-slate-900"
                      />
                    </td>

                    {/* ACCOUNT NO. */}
                    <td className="py-1 px-1.5 border-r border-slate-200">
                      <input
                        type="text"
                        maxLength={10}
                        value={row.accountNo}
                        onChange={(e) => handleRowChange(index, "accountNo", e.target.value.replace(/\D/g, ""))}
                        placeholder="10 Digits"
                        className="w-full px-2 py-1.5 text-xs font-mono tracking-wider rounded border border-transparent hover:border-slate-300 focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600 outline-hidden text-slate-900"
                      />
                    </td>

                    {/* SIGN */}
                    <td className="py-1 px-1.5 text-center">
                      <input
                        type="text"
                        value={row.sign}
                        onChange={(e) => handleRowChange(index, "sign", e.target.value)}
                        placeholder="Signed"
                        className="w-full px-2 py-1.5 text-xs italic text-center rounded border border-transparent hover:border-slate-300 focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600 outline-hidden text-slate-700"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Role & Bank Datalists */}
        <datalist id="ward-role-suggestions">
          <option value="Ward Coordinator (EXCO)" />
          <option value="Ward Deputy Coordinator (EXCO)" />
          <option value="Ward Secretary (EXCO)" />
          <option value="Ward Youth Leader (EXCO)" />
          <option value="Ward Women Leader (EXCO)" />
          <option value="Ward Organizing Secretary (EXCO)" />
          <option value="Ward Publicity Secretary (EXCO)" />
          <option value="Ward Treasurer (EXCO)" />
          <option value="Polling Unit Coordinator (EXCO)" />
          <option value="General Member (Non-EXCO)" />
          <option value="Grassroots Mobilizer (Non-EXCO)" />
          <option value="Polling Unit Agent (Non-EXCO)" />
          <option value="Volunteer / Campaign Supporter (Non-EXCO)" />
          <option value="Elder / Patron (Non-EXCO)" />
        </datalist>

        <datalist id="bank-suggestions">
          {NIGERIAN_BANKS.map(b => (
            <option key={b} value={b} />
          ))}
        </datalist>

        {/* Bottom Table Toolbar */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleAddRows(5)}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add 5 More Rows</span>
            </button>
            <span className="text-xs text-slate-500">
              Active Rows: <strong className="text-slate-900 font-bold">{filledCount}</strong> / {rows.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting || filledCount === 0}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#0D5C3A] hover:bg-[#09432A] text-white font-bold text-xs sm:text-sm rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                  <span>Submitting {filledCount} Rows to Google Sheets...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-emerald-200" />
                  <span>Submit Ward Sheet ({filledCount} Members)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Submission notification message */}
        {message && (
          <div className={`p-4 mx-4 mb-4 rounded-lg flex items-center gap-2 text-xs font-semibold ${
            message.type === "success" ? "bg-emerald-50 text-emerald-900 border border-emerald-300" : "bg-red-50 text-red-900 border border-red-300"
          }`}>
            {message.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Official PDF Data Protection Notice Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-slate-600 text-[11px] leading-relaxed">
          <p className="font-semibold text-slate-800">
            Data-protection notice: collect only information required for authorised TMW registration and coordination. Handle personal data securely, obtain appropriate consent, and do not use registration information for unlawful inducement or unauthorised disclosure.
          </p>
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
            <span>TINUBU MOVEMENT WORLDWIDE (TMW) - Official Electoral Ward Registration Sheet</span>
            <span>Page 1 of 1</span>
          </div>
        </div>

      </form>
    </div>
  );
};
