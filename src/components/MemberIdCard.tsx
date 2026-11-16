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
  Camera, 
  ShieldCheck, 
  Users, 
  QrCode as QrIcon, 
  X,
  Sparkles,
  CreditCard,
  Phone,
  Globe,
  Mail
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
          dark: "#0A0A0A",
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
          {/* FRONT OF ID CARD (Matches Official Executive Prototype) */}
          {/* ========================================================================= */}
          <div 
            id="tmw-id-card-front"
            className={`relative w-full aspect-[1.586/1] bg-white rounded-2xl shadow-xl border-[2.5px] border-[#0A5430] overflow-hidden flex-col justify-between print:flex print:shadow-none print:border-[2px] print:border-[#0A5430] print:rounded-xl print:break-inside-avoid select-none ${
              activeSide === "back" ? "hidden" : "flex"
            }`}
            style={{
              boxShadow: "0 10px 25px -5px rgba(10, 84, 48, 0.16), 0 8px 10px -6px rgba(10, 84, 48, 0.1)"
            }}
          >
              {/* Top-left emerald & gold sweeping corner accent */}
              <svg
                viewBox="0 0 120 75"
                className="absolute top-0 left-0 w-24 h-16 pointer-events-none select-none z-0"
                preserveAspectRatio="none"
              >
                <path d="M0,0 L95,0 C55,8 28,28 0,72 Z" fill="#0A5430" />
                <path d="M95,0 C55,8 28,28 0,72 L0,64 C24,25 50,7 84,0 Z" fill="#D4AF37" opacity="0.85" />
              </svg>

              {/* Subtle right watermark behind QR area */}
              <div className="absolute right-3 bottom-10 opacity-[0.07] pointer-events-none select-none z-0">
                <TMWLogo size={115} className="grayscale contrast-125" />
              </div>

              {/* Subtle light wave background above bottom footer */}
              <svg
                viewBox="0 0 400 70"
                className="absolute bottom-7 left-0 w-full h-14 pointer-events-none select-none z-0"
                preserveAspectRatio="none"
              >
                <path d="M0,38 Q120,10 245,42 T400,26 L400,70 L0,70 Z" fill="#0A5430" opacity="0.08" />
                <path d="M0,48 Q130,22 250,48 T400,34 L400,70 L0,70 Z" fill="#0A5430" opacity="0.14" />
                <path d="M0,48 Q125,28 245,54 T400,40" fill="none" stroke="#D4AF37" strokeWidth="2.5" opacity="0.85" />
              </svg>

              {/* Top Header Block: TMW Logo | Center Institution Title | APC Logo */}
              <div className="relative z-10 px-2.5 pt-2 pb-1.5 bg-gradient-to-b from-white/95 to-white/90">
                <div className="flex items-center justify-between gap-2">
                  {/* Left: TMW Seal + vertical gold hairline */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="p-0.5 rounded-full bg-white shadow-xs border border-[#0A5430]/30">
                      <TMWLogo size={42} className="ring-1 ring-[#0A5430]/30" />
                    </div>
                    <div className="w-[1.5px] h-10 bg-gradient-to-b from-[#B38E2C] via-[#9E8B3B] to-[#B38E2C]" />
                  </div>

                  {/* Center: Institution Title & Slogan */}
                  <div className="flex-1 text-center min-w-0 px-0.5">
                    <h4 className="text-[11px] sm:text-[12px] font-black text-[#084C28] tracking-tight leading-[1.06] uppercase font-sans">
                      TINUBU MOVEMENT
                      <br />
                      WORLDWIDE (TMW)
                    </h4>
                    <p className="text-[6.8px] sm:text-[7.2px] font-bold text-slate-900 leading-tight mt-0.5 truncate">
                      National Support &amp; Campaign Coordination Institution
                    </p>
                    <p className="text-[6px] sm:text-[6.4px] font-extrabold text-[#D92027] tracking-tight uppercase leading-tight mt-0.5 truncate">
                      RENEWED HOPE • RENEWED NIGERIA • BRIGHTER FUTURE
                    </p>
                  </div>

                  {/* Right: vertical gold hairline + APC Official Logo */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-[1.5px] h-10 bg-gradient-to-b from-[#B38E2C] via-[#9E8B3B] to-[#B38E2C]" />
                    <div className="w-10 h-10 rounded-full p-0.5 bg-white border-[1.5px] border-[#C89B2B] shadow-xs flex items-center justify-center overflow-hidden">
                      <img
                        src="/assets/aistudio/apc_6f5b68a5.webp"
                        alt="All Progressives Congress (APC) Official Logo"
                        className="w-full h-full object-contain select-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Full-Width Gold & Emerald Ribbon Banner */}
              <div className="relative z-10 w-full h-[22px] flex items-center justify-center overflow-hidden bg-gradient-to-r from-[#C89B2B] via-[#F2D574] to-[#C89B2B]">
                {/* Angled Emerald Center Ribbon */}
                <div
                  className="w-[88%] h-full bg-[#0A5430] flex items-center justify-center px-3 shadow-xs"
                  style={{
                    clipPath: "polygon(3% 0%, 100% 0%, 97% 100%, 0% 100%)"
                  }}
                >
                  <span className="text-[8.5px] sm:text-[9px] font-black tracking-[0.07em] text-white uppercase whitespace-nowrap">
                    {record.isExco && record.excoLevel === "National"
                      ? "OFFICIAL NATIONAL LEADERSHIP IDENTITY CARD"
                      : "OFFICIAL MEMBERSHIP IDENTITY CARD"}
                  </span>
                </div>
              </div>

              {/* Main Card Body: Left Passport | Center Member Particulars | Right QR Code */}
              <div className="relative z-10 px-3 py-1.5 flex items-center justify-between gap-2.5 flex-1 min-h-0">
                
                {/* Left Column: Passport Photo Placeholder */}
                <div className="flex flex-col items-center justify-center shrink-0">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-[84px] h-[102px] rounded-xl border-2 border-[#0A5430] overflow-hidden bg-[#EDEDED] flex items-center justify-center shadow-xs cursor-pointer group print:cursor-default"
                    title="Click to change passport photo"
                  >
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={record.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-1.5 text-center bg-[#F1F3F2] text-slate-400">
                        <Users className="w-9 h-9 text-slate-300 mb-1" />
                        <span className="text-[6.5px] font-bold text-slate-500 uppercase leading-tight print:hidden">
                          Click to Affix Passport
                        </span>
                        <span className="text-[6.5px] font-bold text-slate-400 uppercase leading-tight hidden print:inline">
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
                </div>

                {/* Center Column: Member Full Name, Designation Pill, Membership ID */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  {/* Member Full Name */}
                  <div>
                    <span className="text-[6.5px] uppercase font-extrabold tracking-wider text-[#084C28] block leading-none mb-0.5">
                      MEMBER FULL NAME
                    </span>
                    <h3 className="text-[11px] sm:text-[11.5px] font-black text-slate-950 uppercase tracking-tight leading-[1.12] line-clamp-2">
                      {record.fullName}
                    </h3>
                  </div>

                  {/* Thin Gold Hairline */}
                  <div className="h-[1px] w-full bg-gradient-to-r from-[#C89B2B] via-[#E5C158] to-transparent my-1" />

                  {/* Designation */}
                  <div>
                    <span className="text-[6.5px] uppercase font-extrabold tracking-wider text-[#084C28] block leading-none mb-1">
                      DESIGNATION
                    </span>
                    <div className="inline-block max-w-full px-2.5 py-0.5 rounded-md bg-[#0A5430] text-white shadow-2xs">
                      <p className="text-[7.5px] sm:text-[8px] font-extrabold uppercase tracking-wide truncate leading-tight">
                        {record.role || (record.isExco ? "EXECUTIVE OFFICER" : "GENERAL MEMBER")}
                      </p>
                    </div>
                  </div>

                  {/* Thin Gold Hairline */}
                  <div className="h-[1px] w-full bg-gradient-to-r from-[#C89B2B] via-[#E5C158] to-transparent my-1" />

                  {/* Membership ID */}
                  <div>
                    <span className="text-[6.5px] uppercase font-extrabold tracking-wider text-[#084C28] block leading-none mb-0.5">
                      MEMBERSHIP ID
                    </span>
                    <span className="text-[10px] sm:text-[10.5px] font-black text-slate-950 uppercase tracking-tight leading-none block font-sans">
                      {record.referenceId}
                    </span>
                  </div>
                </div>

                {/* Right Column: QR Code + SCAN TO VERIFY Pill */}
                <div className="flex flex-col items-center justify-center shrink-0 w-[76px] pl-1.5 border-l border-slate-300/70">
                  <div className="p-1 bg-white border-[1.5px] border-[#0A5430] rounded-lg shadow-2xs">
                    {qrCodeDataUrl ? (
                      <img
                        src={qrCodeDataUrl}
                        alt="Scan to verify TMW membership"
                        className="w-[60px] h-[60px] object-contain"
                      />
                    ) : (
                      <div className="w-[60px] h-[60px] bg-slate-100 flex items-center justify-center">
                        <QrIcon className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                  </div>
                  <div className="mt-1 px-2 py-0.5 rounded-full bg-[#0A5430] text-white">
                    <span className="text-[5.5px] font-black tracking-wider uppercase block leading-none whitespace-nowrap">
                      SCAN TO VERIFY
                    </span>
                  </div>
                </div>

              </div>

              {/* Bottom Dark Emerald Footer with Gold Trim */}
              <div className="relative z-10 bg-gradient-to-r from-[#064424] via-[#0A5430] to-[#064424] text-white px-3 py-1.5 border-t-[2px] border-[#D4AF37] flex items-center justify-between gap-2">
                {/* Left: Card Owner Contact Phone */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-5 h-5 rounded-full border border-white/80 flex items-center justify-center shrink-0 bg-white/10">
                    <Phone className="w-2.5 h-2.5 text-white" />
                  </div>
                  <div className="min-w-0 leading-tight">
                    <span className="text-[5.8px] font-extrabold uppercase tracking-wide text-emerald-100 block truncate">
                      MEMBER CONTACT PHONE
                    </span>
                    <span className="text-[8.5px] font-black text-white tracking-wide block leading-none mt-0.5 truncate">
                      {record.phone?.trim() || "NOT ON FILE"}
                    </span>
                  </div>
                </div>

                {/* Vertical Divider */}
                <div className="w-[1px] h-5 bg-white/40 shrink-0" />

                {/* Right: Website & Email */}
                <div className="flex flex-col justify-center gap-0.5 text-[6.5px] font-semibold text-white shrink-0 leading-none">
                  <div className="flex items-center gap-1">
                    <Globe className="w-2.5 h-2.5 text-emerald-200 shrink-0" />
                    <span>www.tinubumovement.org</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Mail className="w-2.5 h-2.5 text-emerald-200 shrink-0" />
                    <span>info@tinubumovement.org</span>
                  </div>
                </div>
              </div>
            </div>


          {/* ========================================================================= */}
          {/* BACK OF ID CARD */}
          {/* ========================================================================= */}
          <div 
            id="tmw-id-card-back"
            className={`relative w-full aspect-[1.586/1] bg-white rounded-2xl shadow-xl border-[2.5px] border-[#0A5430] overflow-hidden flex-col justify-between print:flex print:shadow-none print:border-[2px] print:border-[#0A5430] print:rounded-xl print:break-inside-avoid select-none ${
              activeSide === "front" ? "hidden" : "flex"
            }`}
            style={{
              boxShadow: "0 10px 25px -5px rgba(10, 84, 48, 0.16), 0 8px 10px -6px rgba(10, 84, 48, 0.1)"
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
              <div className="px-3 py-1.5 bg-[#0A5430] text-white flex items-center justify-between border-b border-[#D4AF37]">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
                  <span className="text-[8px] font-extrabold uppercase tracking-widest text-emerald-50">
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
                  <ol className="list-decimal list-inside space-y-0.5 text-slate-600">
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

                {/* Signatures Block (Engraved APC Seal image & text removed as requested) */}
                <div className="mt-1 pt-1 border-t border-slate-200 flex items-end justify-between gap-4">
                  {/* Director General Signature */}
                  <div className="text-center w-32">
                    <div className="h-7 flex items-center justify-center">
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
              <div className="px-3 py-1 bg-[#064424] text-white flex items-center justify-between text-[6.5px] border-t border-[#D4AF37]">
                <span className="text-emerald-100">
                  All Progressives Congress (APC) Support Platform
                </span>
                <span className="font-bold text-emerald-300">
                  www.tinubumovement.org
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
