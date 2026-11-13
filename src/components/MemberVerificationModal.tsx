/**
 * Official Public Verification Modal
 * Triggered automatically when scanning the QR code on a member's ID card:
 * Reveals all registration information to prove that he or she is a bona fide registered member.
 */

import React, { useState, useEffect } from "react";
import { RegistrationRecord } from "../types";
import { verifyMemberCredential } from "../services/idCardSearchService";
import { TMWLogo } from "./TMWLogo";
import { APCLogo } from "./APCLogo";
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  CreditCard, 
  X, 
  Search, 
  Award, 
  MapPin, 
  Users, 
  Calendar,
  ExternalLink,
  Loader2,
  Star
} from "lucide-react";

interface MemberVerificationModalProps {
  referenceId: string;
  onClose: () => void;
  onViewIdCard: (record: RegistrationRecord) => void;
}

export const MemberVerificationModal: React.FC<MemberVerificationModalProps> = ({
  referenceId,
  onClose,
  onViewIdCard,
}) => {
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<RegistrationRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const fetchVerification = async () => {
      try {
        const res = await verifyMemberCredential(referenceId);

        if (!isMounted) return;

        if (res.success && res.member) {
          setMember(res.member);
        } else {
          setError(res.message || "No verified member record found for this reference code.");
        }
      } catch (err: any) {
        if (!isMounted) return;
        setError("Network error verifying member credential. Please check your connection.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchVerification();

    return () => {
      isMounted = false;
    };
  }, [referenceId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-[#0D5C3A] via-[#09432A] to-[#042818] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <APCLogo size={32} />
            <div>
              <span className="font-extrabold text-sm block">TMW Official Membership Verification</span>
              <span className="text-[10px] text-emerald-200 block">Scanned QR Code Authentication · APC Affiliated</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-10 h-10 text-[#0D5C3A] animate-spin mb-3" />
              <h4 className="text-sm font-bold text-slate-800">Authenticating Member Credentials...</h4>
              <p className="text-xs text-slate-500 mt-1 font-mono">Reference: {referenceId}</p>
            </div>
          ) : error || !member ? (
            <div className="py-8 text-center">
              <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Record Not Found</h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto mt-1 mb-4">
                {error || `No registered member record matches Reference ID: ${referenceId}`}
              </p>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 max-w-md mx-auto mb-4 text-left">
                <strong>Notice:</strong> If you recently registered, please ensure your ward coordinator has synced records to the national database, or search by your full name.
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
              >
                Close Verification
              </button>
            </div>
          ) : (
            <div>
              {/* Authenticated Verification Seal */}
              <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-4 mb-5 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                  <span className="bg-emerald-600 text-white text-[9px] font-black uppercase px-3 py-1 rounded-bl-lg tracking-wider">
                    AUTHENTIC RECORD
                  </span>
                </div>

                <div className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm ring-4 ring-emerald-100">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <h3 className="text-base font-extrabold text-emerald-950 uppercase tracking-tight">
                  BONA FIDE REGISTERED MEMBER
                </h3>
                <p className="text-xs text-emerald-800 font-semibold mt-0.5">
                  Tinubu Movement Worldwide (TMW) · All Progressives Congress (APC)
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white border border-emerald-300 rounded font-mono text-xs font-bold text-[#0D5C3A]">
                  <span>MEMBER ID:</span>
                  <span>{member.referenceId}</span>
                </div>
              </div>

              {/* Official Statement */}
              <p className="text-xs text-slate-600 leading-relaxed text-center mb-5 italic">
                &ldquo;This is to certify that <strong>{member.fullName}</strong> is a duly authenticated, bona fide registered member of Tinubu Movement Worldwide (TMW), organized under the electoral jurisdiction detailed below.&rdquo;
              </p>

              {/* Detailed Breakdown Grid */}
              <div className="space-y-2.5 text-xs">
                {/* Full Name & Phone */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Full Name</span>
                    <span className="text-sm font-extrabold text-slate-900">{member.fullName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Phone</span>
                    <span className="font-mono font-semibold text-slate-900">{member.phone || "On File"}</span>
                  </div>
                </div>

                {/* Role / Classification */}
                <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
                  member.isExco
                    ? "bg-amber-50 border-amber-300 text-amber-950"
                    : "bg-emerald-50 border-emerald-200 text-emerald-950"
                }`}>
                  <div className="flex items-center gap-2">
                    {member.isExco ? (
                      <Star className="w-4 h-4 text-amber-600 fill-amber-500 shrink-0" />
                    ) : (
                      <Users className="w-4 h-4 text-emerald-700 shrink-0" />
                    )}
                    <div>
                      <span className="text-[9px] uppercase font-bold tracking-wider block opacity-75">
                        {member.isExco ? `Official EXCO Member · ${member.excoLevel || "Ward"} Level` : "Grassroots Member (Non-EXCO)"}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{member.role}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                    member.isExco ? "bg-amber-200 text-amber-900" : "bg-emerald-100 text-emerald-800"
                  }`}>
                    {member.isExco ? "EXCO" : "MEMBER"}
                  </span>
                </div>

                {/* State, LGA, Ward */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">State</span>
                    <span className="font-bold text-slate-900 truncate block">{member.state}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">LGA</span>
                    <span className="font-bold text-slate-900 truncate block">{member.lga}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Ward</span>
                    <span className="font-bold text-slate-900 truncate block">{member.ward}</span>
                  </div>
                </div>

                {/* Polling Unit & VIN */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Voter Card No. (VIN)</span>
                    <span className="font-mono font-bold text-slate-900">{member.vin || "Recorded in Registry"}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Polling Unit</span>
                    <span className="font-medium text-slate-900 truncate block">{member.pollingUnit || "Designated Ward Polling Unit"}</span>
                  </div>
                </div>

                {/* Date */}
                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Registered: {new Date(member.timestamp).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}</span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-800 font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Certified Authentic</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => onViewIdCard(member)}
                  className="px-4 py-2 bg-[#0D5C3A] hover:bg-[#09432A] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>View &amp; Print Member ID Card</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
