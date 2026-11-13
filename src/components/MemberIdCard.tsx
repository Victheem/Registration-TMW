/**
 * Official Printable Membership Identity Card Component
 * Tinubu Movement Worldwide (TMW) & All Progressives Congress (APC)
 * Includes Front & Back faces, Passport Photo Uploader, Dynamic QR Code, and Print-ready styling.
 */

import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { RegistrationRecord } from "../types";
import { TMWLogo } from "./TMWLogo";
import { APCLogo } from "./APCLogo";
import { 
  Printer, 
  Upload, 
  Camera, 
  RotateCw, 
  ShieldCheck, 
  CheckCircle2, 
  Star, 
  Users, 
  QrCode as QrIcon, 
  X,
  Sparkles,
  MapPin,
  Calendar,
  CreditCard,
  UserCheck
} from "lucide-react";

interface MemberIdCardProps {
  record: RegistrationRecord;
  onClose?: () => void;
}

export const MemberIdCard: React.FC<MemberIdCardProps> = ({ record, onClose }) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [activeSide, setActiveSide] = useState<"both" | "front" | "back">("both");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Verification URL encoded in QR Code
  const verificationUrl = typeof window !== "undefined"
    ? `${window.location.origin}/?verify=${encodeURIComponent(record.referenceId || record.id)}`
    : `https://tmw-registration.ng/?verify=${encodeURIComponent(record.referenceId || record.id)}`;

  // Generate QR code on mount or when referenceId changes
  useEffect(() => {
    QRCode.toDataURL(
      verificationUrl,
      {
        width: 256,
        margin: 1,
        color: {
          dark: "#064E3B", // Deep emerald green
          light: "#FFFFFF",
        },
        errorCorrectionLevel: "H",
      },
      (err, url) => {
        if (!err && url) {
          setQrCodeDataUrl(url);
        }
      }
    );
  }, [verificationUrl, record.referenceId]);

  // Load saved photo from localStorage if previously uploaded for this member
  useEffect(() => {
    const storageKey = `tmw_photo_${record.referenceId || record.id}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setPhotoUrl(saved);
    }
  }, [record.referenceId, record.id]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (PNG, JPEG, WEBP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setPhotoUrl(dataUrl);
        try {
          localStorage.setItem(`tmw_photo_${record.referenceId || record.id}`, dataUrl);
        } catch {
          // LocalStorage quota may be exceeded; in-memory photo still works
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = record.timestamp
    ? new Date(record.timestamp).toLocaleDateString("en-NG", {
        month: "short",
        year: "numeric"
      })
    : "Nov 2026";

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-w-4xl w-full mx-auto print:shadow-none print:border-0 print:rounded-none print:bg-transparent print:max-w-none">
      {/* Top Controller Bar (Hidden when printing) */}
      <div className="bg-gradient-to-r from-[#0D5C3A] via-[#09432A] to-[#042818] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-700/60 border border-emerald-400/40 flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-emerald-200" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight">Official Membership Identity Card</h3>
            <p className="text-[11px] text-emerald-200/90 font-medium">
              Tinubu Movement Worldwide · APC Affiliated
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="hidden sm:flex items-center bg-black/20 p-0.5 rounded-lg border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setActiveSide("both")}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                activeSide === "both" ? "bg-white text-emerald-950 font-bold shadow-xs" : "text-emerald-100 hover:text-white"
              }`}
            >
              Both Sides
            </button>
            <button
              type="button"
              onClick={() => setActiveSide("front")}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                activeSide === "front" ? "bg-white text-emerald-950 font-bold shadow-xs" : "text-emerald-100 hover:text-white"
              }`}
            >
              Front Only
            </button>
            <button
              type="button"
              onClick={() => setActiveSide("back")}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                activeSide === "back" ? "bg-white text-emerald-950 font-bold shadow-xs" : "text-emerald-100 hover:text-white"
              }`}
            >
              Back Only
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print ID Card</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Sub-bar with photo upload hint (Hidden when printing) */}
      <div className="bg-emerald-50/70 border-b border-emerald-100 px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-900 print:hidden">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            <strong>ID Card Ready:</strong> Scan the QR code with any phone camera to verify membership instantly.
          </span>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-emerald-100 border border-emerald-300 rounded-md font-semibold text-emerald-800 text-[11px] transition-colors cursor-pointer"
        >
          <Camera className="w-3.5 h-3.5 text-emerald-600" />
          <span>{photoUrl ? "Change Passport Photo" : "Upload Passport Photo"}</span>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handlePhotoUpload}
          className="hidden"
        />
      </div>

      {/* Printable Canvas Section */}
      <div className="p-4 sm:p-8 bg-slate-100/70 flex flex-col items-center justify-center print:p-0 print:bg-white print:block">
        
        {/* Container for Cards */}
        <div
          id="tmw-id-card-print-area"
          className={`grid gap-6 w-full max-w-3xl ${
            activeSide === "both" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 max-w-md"
          } print:grid print:grid-cols-1 print:gap-4 print:max-w-none print:w-full`}
        >

          {/* ========================================================================= */}
          {/* FRONT OF ID CARD */}
          {/* ========================================================================= */}
          <div 
            id="tmw-id-card-front"
            className={`relative w-full aspect-[1.586/1] bg-white rounded-2xl shadow-xl border-2 border-emerald-800 overflow-hidden flex-col justify-between print:flex print:shadow-none print:border-2 print:border-emerald-900 print:rounded-xl print:break-inside-avoid select-none ${
              activeSide === "back" ? "hidden" : "flex"
            }`}
            style={{
              boxShadow: "0 10px 25px -5px rgba(13, 92, 58, 0.15), 0 8px 10px -6px rgba(13, 92, 58, 0.1)"
            }}
          >
              {/* Background Guilloche Security Texture & Subtle Gradient */}
              <div 
                className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#0D5C3A_1px,transparent_1px)] [background-size:10px_10px]"
              />

              {/* Watermark Logo in center */}
              <div className="absolute right-3 bottom-8 opacity-[0.06] pointer-events-none select-none">
                <TMWLogo size={180} />
              </div>

              {/* Top APC Tri-Color Flag Ribbon */}
              <div className="h-2 w-full flex">
                <div className="w-1/4 bg-[#008751]" /> {/* APC Green */}
                <div className="w-1/4 bg-[#FFFFFF] border-y border-slate-200" /> {/* White */}
                <div className="w-1/4 bg-[#0077C8]" /> {/* Sky Blue */}
                <div className="w-1/4 bg-[#DC2626]" /> {/* Red */}
              </div>

              {/* Card Header */}
              <div className="px-3 pt-2.5 pb-2 bg-gradient-to-b from-emerald-50/90 to-white border-b border-emerald-900/15">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <TMWLogo size={40} className="ring-1 ring-emerald-800/30" />
                    <div>
                      <h4 className="text-[12.5px] font-black text-[#0D5C3A] tracking-tight leading-tight uppercase font-sans">
                        TINUBU MOVEMENT WORLDWIDE
                      </h4>
                      <p className="text-[8px] font-bold text-slate-700 leading-tight">
                        National Support &amp; Campaign Coordination Institution
                      </p>
                      <p className="text-[7.5px] font-extrabold text-red-600 tracking-wide uppercase leading-tight">
                        Renewed Hope · Renewed Nigeria · Brighter Future
                      </p>
                    </div>
                  </div>

                  {/* APC Official Logo at Top Right */}
                  <div className="flex flex-col items-center shrink-0">
                    <img
                      src="/assets/aistudio/apc_6f5b68a5.webp"
                      alt="All Progressives Congress (APC) Official Logo"
                      className="w-11 h-11 object-contain drop-shadow-xs select-none"
                    />
                  </div>
                </div>

                {/* Sub-strip title */}
                <div className="mt-1 px-2 py-0.5 bg-[#0D5C3A] text-white rounded text-[7.5px] font-extrabold tracking-widest uppercase flex items-center justify-between">
                  <span>OFFICIAL MEMBERSHIP IDENTITY CARD</span>
                  <span className="font-mono text-[8px] text-emerald-200">{record.referenceId}</span>
                </div>
              </div>

              {/* Card Main Body */}
              <div className="px-3 py-2 flex items-stretch gap-2.5 relative z-10 flex-1">
                
                {/* Left Column: Passport Photo */}
                <div className="flex flex-col items-center shrink-0 w-24">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-24 h-28 rounded-lg border-2 border-emerald-800 overflow-hidden bg-slate-100 flex items-center justify-center shadow-xs cursor-pointer group print:cursor-default"
                    title="Click to change passport photo"
                  >
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={record.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-slate-100 text-slate-400">
                        <Users className="w-10 h-10 text-slate-300 mb-1" />
                        <span className="text-[7px] font-bold text-slate-500 uppercase leading-tight print:hidden">
                          Click to Affix Passport
                        </span>
                        <span className="text-[7px] font-bold text-slate-400 uppercase leading-tight hidden print:inline">
                          PASSPORT PHOTO
                        </span>
                      </div>
                    )}

                    {/* Hover indicator on screen */}
                    <div className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-[8px] font-bold print:hidden">
                      <Camera className="w-4 h-4" />
                      <span>Upload</span>
                    </div>
                  </div>

                  {/* Classification Pill underneath photo */}
                  <div className="mt-1.5 w-full text-center">
                    <span className={`inline-block w-full py-0.5 px-1 rounded text-[7.5px] font-black tracking-wider uppercase truncate border ${
                      record.isExco
                        ? "bg-amber-100 border-amber-300 text-amber-900"
                        : "bg-emerald-100 border-emerald-300 text-emerald-950"
                    }`}>
                      {record.isExco ? `EXCO · ${record.excoLevel || "Ward"}` : "BONA FIDE MEMBER"}
                    </span>
                  </div>
                </div>

                {/* Right Column: Member Particulars */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    {/* Full Name */}
                    <div className="mb-1">
                      <span className="text-[7px] uppercase font-bold text-slate-500 block leading-tight">
                        Member Full Name
                      </span>
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight leading-snug line-clamp-2">
                        {record.fullName}
                      </h3>
                    </div>

                    {/* Specific Role */}
                    <div className="mb-1.5">
                      <span className="text-[7px] uppercase font-bold text-slate-500 block leading-tight">
                        Designation / Portfolio
                      </span>
                      <p className="text-[8.5px] font-bold text-[#0D5C3A] truncate leading-tight">
                        {record.role || (record.isExco ? "Executive Committee Officer" : "Grassroots Member")}
                      </p>
                    </div>

                    {/* Jurisdiction Grid */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[8px] bg-slate-50/90 p-1.5 rounded border border-slate-200">
                      <div>
                        <span className="text-[6.5px] uppercase font-bold text-slate-500 block">State</span>
                        <span className="font-extrabold text-slate-800 truncate block">{record.state}</span>
                      </div>
                      <div>
                        <span className="text-[6.5px] uppercase font-bold text-slate-500 block">LGA</span>
                        <span className="font-extrabold text-slate-800 truncate block">{record.lga}</span>
                      </div>
                      <div>
                        <span className="text-[6.5px] uppercase font-bold text-slate-500 block">Ward</span>
                        <span className="font-extrabold text-slate-800 truncate block">{record.ward}</span>
                      </div>
                      <div>
                        <span className="text-[6.5px] uppercase font-bold text-slate-500 block">VIN (Voter ID)</span>
                        <span className="font-mono font-bold text-slate-800 truncate block">{record.vin || "REGISTERED"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Polling Unit snippet */}
                  <div className="mt-1 flex items-center justify-between text-[7px] text-slate-600">
                    <span className="truncate max-w-[140px]">PU: {record.pollingUnit || "Designated Ward Polling Unit"}</span>
                    <span className="font-bold text-emerald-800">Verified Member</span>
                  </div>
                </div>

                {/* Far Right: QR Code for live smartphone scan verification */}
                <div className="flex flex-col items-center justify-center shrink-0 w-18 pl-1 border-l border-slate-200">
                  <div className="p-0.5 bg-white border border-emerald-800 rounded-md shadow-2xs">
                    {qrCodeDataUrl ? (
                      <img
                        src={qrCodeDataUrl}
                        alt="Scan to verify TMW membership"
                        className="w-16 h-16 object-contain"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-slate-100 flex items-center justify-center">
                        <QrIcon className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                  </div>
                  <span className="text-[6px] font-black tracking-widest text-[#0D5C3A] uppercase mt-1 text-center leading-tight">
                    SCAN TO VERIFY
                  </span>
                </div>

              </div>

              {/* Bottom Security Hologram Strip */}
              <div className="px-3 py-1 bg-gradient-to-r from-[#0D5C3A] via-[#083b25] to-[#042818] text-white flex items-center justify-between text-[7px] font-semibold border-t border-emerald-950">
                <span className="tracking-wider uppercase text-emerald-200">
                  ★ TMW NATIONAL REGISTERED IDENTITY CARD ★
                </span>
                <span className="font-mono text-emerald-300">
                  VALID: 2027 ELECTIONS
                </span>
              </div>
            </div>


          {/* ========================================================================= */}
          {/* BACK OF ID CARD */}
          {/* ========================================================================= */}
          <div 
            id="tmw-id-card-back"
            className={`relative w-full aspect-[1.586/1] bg-white rounded-2xl shadow-xl border-2 border-emerald-800 overflow-hidden flex-col justify-between print:flex print:shadow-none print:border-2 print:border-emerald-900 print:rounded-xl print:break-inside-avoid select-none ${
              activeSide === "front" ? "hidden" : "flex"
            }`}
            style={{
              boxShadow: "0 10px 25px -5px rgba(13, 92, 58, 0.15), 0 8px 10px -6px rgba(13, 92, 58, 0.1)"
            }}
          >
              {/* Background watermark */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.04] flex items-center justify-center">
                <TMWLogo size={200} />
              </div>

              {/* Top APC Tri-Color Flag Ribbon */}
              <div className="h-2 w-full flex">
                <div className="w-1/4 bg-[#008751]" />
                <div className="w-1/4 bg-[#FFFFFF] border-y border-slate-200" />
                <div className="w-1/4 bg-[#0077C8]" />
                <div className="w-1/4 bg-[#DC2626]" />
              </div>

              {/* Back Header */}
              <div className="px-3 py-1.5 bg-[#0D5C3A] text-white flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="text-[8px] font-extrabold uppercase tracking-widest text-emerald-100">
                    TMW NATIONAL CONSTITUTION &amp; CONDITIONS
                  </span>
                </div>
                <span className="text-[7px] font-mono text-emerald-200 uppercase">
                  CONFIDENTIAL / OFFICIAL
                </span>
              </div>

              {/* Terms & Certification Text */}
              <div className="px-3 py-2 text-slate-700 flex-1 flex flex-col justify-between relative z-10">
                <div className="space-y-1 text-[7.5px] leading-relaxed">
                  <p className="font-bold text-slate-900 text-center uppercase tracking-wide border-b border-slate-200 pb-0.5">
                    TERMS &amp; REGULATIONS OF MEMBERSHIP
                  </p>
                  <ol className="list-decimal list-inside space-y-0.8 text-slate-600">
                    <li>
                      This identity card certifies that the named holder is a registered, bona fide member of <strong>Tinubu Movement Worldwide (TMW)</strong> affiliated with the All Progressives Congress (APC).
                    </li>
                    <li>
                      This card is the exclusive property of the <strong>TMW National Support &amp; Campaign Coordination Institution</strong>.
                    </li>
                    <li>
                      The holder undertakes to uphold the tenets of peace, democratic mobilization, and national progress in line with the Renewed Hope Agenda.
                    </li>
                    <li>
                      <strong>If found</strong>, please return to any TMW Ward, LGA, or State Secretariat, or report to the nearest APC Secretariat office.
                    </li>
                  </ol>
                </div>

                {/* Signatures & Seal Block */}
                <div className="mt-1 pt-1 border-t border-slate-200 flex items-end justify-between">
                  {/* Director General Signature */}
                  <div className="text-center w-28">
                    <div className="h-6 flex items-center justify-center">
                      <span className="font-serif italic font-bold text-slate-800 text-[11px] select-none tracking-wider">
                        DirectorGen.
                      </span>
                    </div>
                    <div className="border-t border-slate-400 pt-0.5">
                      <span className="text-[6.5px] font-extrabold text-slate-800 uppercase block">
                        Director General
                      </span>
                      <span className="text-[5.5px] text-slate-500 block">TMW National Directorate</span>
                    </div>
                  </div>

                  {/* Engraved APC Logo Medallion */}
                  <div className="flex flex-col items-center justify-end">
                    <div className="relative w-9 h-9 rounded-full p-0.5 bg-white border-2 border-amber-500 shadow-2xs flex items-center justify-center ring-1 ring-amber-300 overflow-hidden">
                      <img
                        src="/assets/aistudio/apc_6f5b68a5.webp"
                        alt="Engraved APC Official Emblem"
                        className="w-full h-full object-contain select-none drop-shadow-2xs"
                      />
                    </div>
                    <span className="text-[5px] font-black uppercase tracking-wider text-slate-700 mt-0.5">
                      ENGRAVED APC SEAL
                    </span>
                  </div>

                  {/* National Secretary & Strategist Signature */}
                  <div className="text-center w-36">
                    <div className="h-8 flex items-center justify-center overflow-hidden">
                      <img
                        src="/assets/aistudio/WhatsApp_Image_2026-11-12_at_2.04.02_PM_f6cb985e.jpeg"
                        alt="Authorized Signature of National Secretary & Strategist"
                        className="h-full w-auto max-w-full object-contain mix-blend-multiply select-none"
                      />
                    </div>
                    <div className="border-t border-slate-400 pt-0.5">
                      <span className="text-[6.5px] font-extrabold text-slate-800 uppercase block leading-tight">
                        National Secretary &amp; Strategist
                      </span>
                      <span className="text-[5.5px] text-slate-500 block leading-tight">Documentation &amp; Strategy</span>
                    </div>
                  </div>
                </div>

                {/* Barcode Strip representation at bottom */}
                <div className="mt-1 flex items-center justify-between bg-slate-100 p-1 rounded border border-slate-200">
                  <div className="flex items-center gap-1 font-mono text-[6.5px] font-bold text-slate-700">
                    <span>ID: {record.referenceId}</span>
                    <span>·</span>
                    <span>ISSUED: {formattedDate}</span>
                  </div>
                  <div className="flex items-center gap-0.5 h-3">
                    {/* Stylized barcode lines */}
                    {[2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 3, 1, 2, 3, 1, 4, 2].map((w, idx) => (
                      <div
                        key={idx}
                        style={{ width: `${w}px` }}
                        className="h-full bg-slate-900"
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom footer bar */}
              <div className="px-3 py-1 bg-slate-900 text-white flex items-center justify-between text-[6.5px]">
                <span className="text-slate-300">
                  All Progressives Congress (APC) Support Platform
                </span>
                <span className="font-bold text-emerald-400">
                  www.tmw-nigeria.org
                </span>
              </div>
            </div>

        </div>

      </div>

      {/* Modal Actions Footer */}
      <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-[#0D5C3A]" />
          <span>Verified against TMW National Registry</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-[#0D5C3A] hover:bg-[#09432A] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print ID Card (Front &amp; Back)</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
