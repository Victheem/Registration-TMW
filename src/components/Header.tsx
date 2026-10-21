/**
 * Official Brand Header Component for Tinubu Movement Worldwide (TMW)
 */

import React from "react";
import { TMWLogo } from "./TMWLogo";
import { 
  FileSpreadsheet, 
  UserPlus, 
  TableProperties, 
  Settings, 
  Printer, 
  Phone, 
  MessageSquare,
  Database
} from "lucide-react";

interface HeaderProps {
  activeTab: "individual" | "ward_sheet" | "registry" | "print_preview";
  setActiveTab: (tab: "individual" | "ward_sheet" | "registry" | "print_preview") => void;
  openSettings: () => void;
  isBackendConnected: boolean;
  totalRegistered: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  openSettings,
  isBackendConnected,
  totalRegistered,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs print:hidden">
      {/* Top National Coordination Bar */}
      <div className="bg-[#0D5C3A] text-emerald-50 px-4 py-1.5 text-xs font-medium border-b border-emerald-900/40">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-300"></span>
            <span className="font-semibold tracking-wide">ELECTORAL WARD REGISTRATION PORTAL</span>
            <span className="hidden sm:inline text-emerald-300/80">·</span>
            <span className="hidden sm:inline text-emerald-100">Renewed Hope 2027 Mobilization</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] sm:text-xs">
            <a
              href="tel:08038749440"
              className="flex items-center gap-1 hover:text-white transition-colors"
              title="Call Director General"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-300" />
              <span>DG: <strong className="font-semibold">08038749440</strong></span>
            </a>
            <span className="text-emerald-400/60">|</span>
            <a
              href="https://wa.me/18187991006"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-white transition-colors"
              title="Official WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-300" />
              <span>WhatsApp: <strong className="font-semibold">+1 (818) 799-1006</strong></span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Official Institutional Header */}
      <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Logo & Institution Titles */}
          <div className="flex items-center gap-3.5">
            <TMWLogo size={60} className="hover:scale-105 transition-transform" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0D5C3A]">
                  TINUBU MOVEMENT WORLDWIDE
                </h1>
                <span className="px-2 py-0.5 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 rounded">
                  TMW
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-700">
                National Support &amp; Campaign Coordination Institution
              </p>
              <p className="text-xs font-semibold text-red-600 mt-0.5 tracking-wide">
                Renewed Hope. Renewed Nigeria. Brighter Future.
              </p>
            </div>
          </div>

          {/* Quick Action / Settings Bar */}
          <div className="flex items-center gap-2 self-start md:self-center">
            {/* Status indicator */}
            <button
              onClick={openSettings}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                isBackendConnected
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                  : "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
              }`}
              title="Click to configure Google Sheets Web App endpoint"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>{isBackendConnected ? "Google Sheet Connected" : "Connect Google Sheet"}</span>
              <Settings className="w-3.5 h-3.5 text-slate-500 ml-1" />
            </button>

            {/* Total registrations badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 rounded-lg">
              <Database className="w-3.5 h-3.5 text-slate-500" />
              <span>Registered: <strong className="tabular-nums font-bold text-slate-900">{totalRegistered}</strong></span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between overflow-x-auto gap-2">
          <div className="flex items-center gap-1.5 min-w-max">
            <button
              onClick={() => setActiveTab("individual")}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-md transition-all whitespace-nowrap ${
                activeTab === "individual"
                  ? "bg-[#0D5C3A] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Single Member Form</span>
            </button>

            <button
              onClick={() => setActiveTab("ward_sheet")}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-md transition-all whitespace-nowrap ${
                activeTab === "ward_sheet"
                  ? "bg-[#0D5C3A] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <TableProperties className="w-4 h-4" />
              <span>Ward Sheet (Batch 20-Rows)</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-1.5 py-0.2 rounded">
                Official Form
              </span>
            </button>

            <button
              onClick={() => setActiveTab("registry")}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-md transition-all whitespace-nowrap ${
                activeTab === "registry"
                  ? "bg-[#0D5C3A] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Registry Database ({totalRegistered})</span>
            </button>
          </div>

          <button
            onClick={() => setActiveTab("print_preview")}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-md border transition-colors whitespace-nowrap ${
              activeTab === "print_preview"
                ? "bg-slate-900 text-white border-slate-900"
                : "text-slate-700 bg-white border-slate-300 hover:bg-slate-50"
            }`}
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Official Form (PDF)</span>
          </button>
        </div>
      </div>
    </header>
  );
};
