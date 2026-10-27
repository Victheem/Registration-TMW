/**
 * Official TMW Electoral Ward Registration Certificate / Slip Modal
 */

import React from "react";
import { RegistrationRecord } from "../types";
import { TMWLogo } from "./TMWLogo";
import { 
  X, 
  Printer, 
  CheckCircle, 
  ShieldCheck, 
  UserPlus, 
  QrCode,
  Building,
  CreditCard,
  MapPin,
  Calendar,
  Star,
  Users
} from "lucide-react";

interface RegistrationSlipModalProps {
  record: RegistrationRecord | null;
  onClose: () => void;
  onNewRegistration: () => void;
}

export const RegistrationSlipModal: React.FC<RegistrationSlipModalProps> = ({
  record,
  onClose,
  onNewRegistration,
}) => {
  if (!record) return null;

  const handlePrintSlip = () => {
    window.print();
  };

  const formattedDate = new Date(record.timestamp).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Modal Top Bar */}
        <div className="bg-[#0D5C3A] text-white px-5 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-300" />
            <span className="font-bold text-sm">Registration Confirmed</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* The Printable Slip Body */}
        <div className="p-6 sm:p-8" id="tmw-printable-slip">
          <div className="border-2 border-[#0D5C3A] rounded-xl p-5 bg-gradient-to-b from-emerald-50/30 to-white relative overflow-hidden shadow-xs">
            
            {/* Watermark in background */}
            <div className="absolute right-4 bottom-4 opacity-5 pointer-events-none select-none">
              <TMWLogo size={220} />
            </div>

            {/* Slip Header */}
            <div className="flex items-center justify-between border-b-2 border-[#0D5C3A] pb-3 mb-4">
              <div className="flex items-center gap-3">
                <TMWLogo size={50} />
                <div>
                  <h3 className="text-base font-extrabold text-[#0D5C3A] tracking-tight leading-none">
                    TINUBU MOVEMENT WORLDWIDE
                  </h3>
                  <p className="text-[10px] font-semibold text-slate-600 mt-1">
                    National Support &amp; Campaign Coordination Institution
                  </p>
                  <p className="text-[9px] font-bold text-red-600 tracking-wider">
                    Renewed Hope. Renewed Nigeria. Brighter Future.
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-emerald-100 text-[#0D5C3A] rounded border border-emerald-300">
                  Official Slip
                </span>
                <p className="font-mono text-[10px] font-bold text-slate-700 mt-1">
                  {record.referenceId}
                </p>
              </div>
            </div>

            <div className="text-center py-1 mb-2 bg-[#0D5C3A] text-white rounded font-bold text-xs tracking-wider uppercase">
              ELECTORAL WARD REGISTRATION VERIFICATION
            </div>

            {/* EXCO vs Non-EXCO Role Classification */}
            <div className={`p-2.5 rounded-lg border mb-3 flex items-center justify-between ${
              record.isExco
                ? "bg-amber-50 border-amber-300 text-amber-950"
                : "bg-emerald-50 border-emerald-200 text-emerald-950"
            }`}>
              <div className="flex items-center gap-2">
                {record.isExco ? (
                  <Star className="w-4 h-4 text-amber-600 fill-amber-500 shrink-0" />
                ) : (
                  <Users className="w-4 h-4 text-emerald-700 shrink-0" />
                )}
                <div>
                  <span className="text-[9px] uppercase font-bold tracking-wider block opacity-75">
                    {record.isExco ? `Official EXCO Member · ${record.excoLevel || "Ward"} Level` : "Grassroots Member (Non-EXCO)"}
                  </span>
                  <span className="text-xs font-extrabold text-slate-900">{record.role || (record.isExco ? "Executive Committee Officer" : "General Member")}</span>
                </div>
              </div>
              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                record.isExco ? "bg-amber-200 text-amber-900" : "bg-emerald-100 text-emerald-800"
              }`}>
                {record.isExco ? "EXCO" : "MEMBER"}
              </span>
            </div>

            {/* Slip Data Grid */}
            <div className="space-y-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Registrant Full Name</span>
                  <span className="text-sm font-bold text-slate-900">{record.fullName}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Phone Number</span>
                  <span className="font-mono font-semibold text-slate-900">{record.phone}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">State</span>
                  <span className="font-bold text-slate-900 truncate block">{record.state}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">LGA</span>
                  <span className="font-bold text-slate-900 truncate block">{record.lga}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Ward</span>
                  <span className="font-bold text-slate-900 truncate block">{record.ward}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Voter Card No. (VIN)</span>
                  <span className="font-mono font-bold text-slate-900">{record.vin}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Polling Unit</span>
                  <span className="font-medium text-slate-900 truncate block">{record.pollingUnit}</span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Banking Details</span>
                  <span className="font-semibold text-slate-900">{record.bankName}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Account Number</span>
                  <span className="font-mono font-bold text-slate-900 tracking-wider">{record.accountNumber}</span>
                </div>
              </div>

              {/* Timestamp & Verification Seal */}
              <div className="pt-2 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-200">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Issued: {formattedDate}</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-800 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified TMW Ward Record</span>
                </div>
              </div>
            </div>

            {/* Official notice snippet */}
            <div className="mt-3 pt-2 text-[9px] text-slate-400 border-t border-dashed border-slate-200 text-center">
              Official TMW Electoral Ward Registration Record · Authorized Coordination Notice
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 print:hidden">
          <button
            type="button"
            onClick={onNewRegistration}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <UserPlus className="w-4 h-4 text-slate-600" />
            <span>Register Another Member</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintSlip}
              className="px-4 py-2 bg-[#0D5C3A] hover:bg-[#09432A] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print Slip / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
