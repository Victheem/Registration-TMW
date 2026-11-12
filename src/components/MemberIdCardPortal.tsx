/**
 * Member ID Card Portal & Search Interface
 * Allows all registered members to search for their membership card by Full Name or Personal ID,
 * view the official card with QR code, affix their passport photograph, and print.
 */

import React, { useState, useEffect } from "react";
import { RegistrationRecord } from "../types";
import { MemberIdCard } from "./MemberIdCard";
import { TMWLogo } from "./TMWLogo";
import { APCLogo } from "./APCLogo";
import { 
  Search, 
  CreditCard, 
  UserCheck, 
  Printer, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  MapPin, 
  Star, 
  Users, 
  ArrowRight,
  UserPlus,
  Loader2,
  RefreshCw
} from "lucide-react";

interface MemberIdCardPortalProps {
  onNavigateToRegister: () => void;
  initialQuery?: string;
  initialRecord?: RegistrationRecord | null;
}

export const MemberIdCardPortal: React.FC<MemberIdCardPortalProps> = ({
  onNavigateToRegister,
  initialQuery = "",
  initialRecord = null,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<RegistrationRecord[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RegistrationRecord | null>(initialRecord);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If an initial record is passed, select it immediately
  useEffect(() => {
    if (initialRecord) {
      setSelectedRecord(initialRecord);
    }
  }, [initialRecord]);

  // Execute search against backend API
  const handleSearch = async (queryToSearch?: string) => {
    const term = (queryToSearch ?? searchQuery).trim();
    if (!term) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setErrorMessage(null);
    setHasSearched(true);

    try {
      const response = await fetch(`/api/id-card/search?query=${encodeURIComponent(term)}`);
      const data = await response.json();

      if (data.success && Array.isArray(data.records)) {
        setResults(data.records);
        // If exact single match found, automatically select it for easy preview
        if (data.records.length === 1) {
          setSelectedRecord(data.records[0]);
        }
      } else {
        setResults([]);
        setErrorMessage(data.message || "No matching members found.");
      }
    } catch (err: any) {
      setResults([]);
      setErrorMessage("Network error while searching registry. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleQuickSearch = (term: string) => {
    setSearchQuery(term);
    handleSearch(term);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Banner / Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#0D5C3A] via-[#09432A] to-[#042818] p-6 text-white relative">
          {/* Subtle logo emblem in background */}
          <div className="absolute right-4 -bottom-6 opacity-10 pointer-events-none select-none">
            <TMWLogo size={180} />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                <CreditCard className="w-6 h-6 text-emerald-300" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-300 block">
                  Official Membership Directory &amp; Verification
                </span>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5">
                  Print Your TMW Membership ID Card
                </h2>
                <p className="text-xs text-emerald-100/90 mt-1 max-w-xl">
                  Search by your <strong>Full Name</strong> or <strong>Personal ID</strong> (Reference ID) to generate and print your official card with security QR code.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-center">
              <APCLogo size={42} />
              <div className="text-right">
                <span className="text-[10px] font-black uppercase text-white block">APC Affiliated</span>
                <span className="text-[9px] text-emerald-200 block">Renewed Hope 2027</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar Container */}
        <div className="p-5 sm:p-6 bg-slate-50 border-t border-slate-200">
          <div className="max-w-2xl mx-auto">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              Find Registered Member ID Card
            </label>

            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter Full Name (e.g. Dogara Conscience) or Personal ID (e.g. TMW-FC-62848628)..."
                className="w-full pl-11 pr-28 py-3 bg-white border-2 border-slate-300 focus:border-[#0D5C3A] focus:ring-3 focus:ring-[#0D5C3A]/15 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-xs transition-all outline-hidden"
              />
              <button
                type="button"
                onClick={() => handleSearch()}
                disabled={isSearching || !searchQuery.trim()}
                className="absolute right-1.5 px-4 py-2 bg-[#0D5C3A] hover:bg-[#09432A] disabled:bg-slate-300 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shadow-xs"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Find Card</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick search suggestions */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
              <span className="font-semibold text-slate-600">Quick Try:</span>
              <button
                type="button"
                onClick={() => handleQuickSearch("Dogara Conscience")}
                className="px-2 py-0.5 bg-white hover:bg-emerald-50 text-slate-700 hover:text-[#0D5C3A] rounded border border-slate-200 text-[11px] font-medium transition-colors"
              >
                Dogara Conscience
              </button>
              <button
                type="button"
                onClick={() => handleQuickSearch("TMW-FC-62848628")}
                className="px-2 py-0.5 bg-white hover:bg-emerald-50 text-slate-700 hover:text-[#0D5C3A] rounded border border-slate-200 text-[11px] font-mono transition-colors"
              >
                TMW-FC-62848628
              </button>
              <button
                type="button"
                onClick={() => handleQuickSearch("Abdul Kareem")}
                className="px-2 py-0.5 bg-white hover:bg-emerald-50 text-slate-700 hover:text-[#0D5C3A] rounded border border-slate-200 text-[11px] font-medium transition-colors"
              >
                Abdul Kareem
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* If a card is selected, show the interactive ID Card preview */}
      {selectedRecord ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <div>
                <span className="text-xs font-bold text-slate-900">
                  Viewing ID Card for {selectedRecord.fullName}
                </span>
                <span className="text-[11px] font-mono text-slate-500 block">
                  Reference ID: {selectedRecord.referenceId}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedRecord(null)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline"
            >
              Choose another record
            </button>
          </div>

          <MemberIdCard
            record={selectedRecord}
            onClose={() => setSelectedRecord(null)}
          />
        </div>
      ) : hasSearched ? (
        /* Search Results List */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#0D5C3A]" />
              <h3 className="text-sm font-bold text-slate-800">
                Search Results ({results.length})
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              Query: &ldquo;{searchQuery}&rdquo;
            </span>
          </div>

          {results.length === 0 ? (
            <div className="py-10 text-center max-w-md mx-auto">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">No Registered Member Found</h4>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                We couldn&rsquo;t find any registration matching &ldquo;{searchQuery}&rdquo;. Check the spelling or register as a new member.
              </p>

              <button
                type="button"
                onClick={onNavigateToRegister}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0D5C3A] hover:bg-[#09432A] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Register on the Portal Now</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {results.map((rec) => (
                <div
                  key={rec.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-emerald-600 hover:shadow-md transition-all bg-white flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900 uppercase">
                          {rec.fullName}
                        </h4>
                        <span className="font-mono text-xs font-bold text-[#0D5C3A]">
                          {rec.referenceId}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${
                        rec.isExco
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                      }`}>
                        {rec.isExco ? "EXCO" : "MEMBER"}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-slate-600 mb-2 truncate">
                      {rec.role || (rec.isExco ? "Executive Official" : "General Member")}
                    </p>

                    <div className="grid grid-cols-3 gap-1 text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 mb-3">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">State</span>
                        <span className="font-semibold text-slate-800 truncate block">{rec.state}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">LGA</span>
                        <span className="font-semibold text-slate-800 truncate block">{rec.lga}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Ward</span>
                        <span className="font-semibold text-slate-800 truncate block">{rec.ward}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedRecord(rec)}
                    className="w-full py-2 px-3 bg-[#0D5C3A] hover:bg-[#09432A] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>View &amp; Print ID Card</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Default Empty State with instructions */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-8 text-center max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#0D5C3A] flex items-center justify-center mx-auto mb-4 border border-emerald-200">
            <CreditCard className="w-8 h-8" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900">
            Looking for Your Membership ID Card?
          </h3>
          <p className="text-xs text-slate-600 mt-1.5 mb-6 leading-relaxed">
            Enter your Full Name or Personal ID above to retrieve your card. You can upload your passport photograph and print it on standard cardstock or paper.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-800 block mb-1">
                1. Already Registered?
              </span>
              <p className="text-[11px] text-slate-500">
                Type your name or ID in the search bar above to pull up your authenticated card.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-800 block mb-1">
                2. Haven&rsquo;t Registered Yet?
              </span>
              <p className="text-[11px] text-slate-500">
                Complete the Single Member Form to be registered immediately.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center">
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <span>Register Now (Single Member Form)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
