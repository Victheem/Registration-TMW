/**
 * Print-Ready Official Electoral Ward Registration Sheet
 * Pixel-faithful reproduction of TMW_Electoral_Ward_Registration_Form_93f61e89.pdf
 */

import React from "react";
import { WardSheetHeader, WardSheetRow } from "../types";
import { TMWLogo } from "./TMWLogo";
import { Printer, ArrowLeft, Download } from "lucide-react";

interface PrintWardSheetProps {
  header: WardSheetHeader;
  rows: WardSheetRow[];
  onBack: () => void;
}

export const PrintWardSheet: React.FC<PrintWardSheetProps> = ({
  header,
  rows,
  onBack,
}) => {
  // Ensure we have at least 20 rows to mirror the official paper form
  const displayRows = rows.length >= 20 ? rows : [
    ...rows,
    ...Array.from({ length: 20 - rows.length }, (_, i) => ({
      sn: rows.length + i + 1,
      names: "",
      phone: "",
      vin: "",
      pollingUnit: "",
      bank: "",
      accountNo: "",
      sign: "",
      role: "",
      isExco: false,
    }))
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Non-printing Control Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Registration Portal</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            A4 Print-Ready Electoral Sheet
          </span>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0D5C3A] hover:bg-[#09432A] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Sheet (or Save as PDF)</span>
          </button>
        </div>
      </div>

      {/* The Printable Page (matches the PDF layout exactly) */}
      <div className="bg-white p-6 sm:p-10 border border-slate-300 shadow-md print:shadow-none print:border-none print:p-0 print:m-0 text-slate-900">
        
        {/* Document Header Section */}
        <div className="flex items-start justify-between pb-3">
          <div className="flex items-start gap-4">
            <TMWLogo size={70} />
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#0D5C3A] leading-tight">
                TINUBU MOVEMENT WORLDWIDE
              </h1>
              <p className="text-xs font-bold text-slate-700 mt-0.5">
                National Support &amp; Campaign Coordination Institution
              </p>
              <p className="text-xs font-bold text-red-600 mt-0.5">
                Renewed Hope. Renewed Nigeria. Brighter Future.
              </p>
            </div>
          </div>
        </div>

        {/* Form Title Banner with Underline */}
        <div className="mt-2 mb-3 border-b-2 border-[#0D5C3A] pb-1 text-center">
          <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-widest text-[#0D5C3A]">
            ELECTORAL WARD REGISTRATION FORM
          </h2>
        </div>

        {/* State, LGA, Electoral Ward Row (in light mint bar as shown on PDF) */}
        <div className="bg-[#EAF5F0] border border-emerald-200 px-4 py-2 mb-3 flex flex-wrap items-center justify-between text-xs font-bold uppercase text-slate-800">
          <div>
            <span className="text-[#0D5C3A]">STATE: </span>
            <span className="font-semibold underline decoration-dotted">{header.state || "____________________"}</span>
          </div>
          <div>
            <span className="text-[#0D5C3A]">LGA: </span>
            <span className="font-semibold underline decoration-dotted">{header.lga || "____________________"}</span>
          </div>
          <div>
            <span className="text-[#0D5C3A]">ELECTORAL WARD: </span>
            <span className="font-semibold underline decoration-dotted">{header.ward || "____________________"}</span>
          </div>
        </div>

        {/* The 20-Row Grid (faithful to PDF) */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-slate-400 text-[10px] sm:text-[11px]">
            <thead>
              <tr className="bg-[#0D5C3A] text-white font-bold uppercase text-center">
                <th className="border border-emerald-700 py-1.5 px-1 w-7">S/N</th>
                <th className="border border-emerald-700 py-1.5 px-2 text-left min-w-[130px]">NAMES</th>
                <th className="border border-emerald-700 py-1.5 px-1.5 text-left min-w-[110px]">ROLE / EXCO</th>
                <th className="border border-emerald-700 py-1.5 px-2 text-left min-w-[95px]">PHONE</th>
                <th className="border border-emerald-700 py-1.5 px-2 text-left min-w-[120px]">VOTER'S CARD NO.</th>
                <th className="border border-emerald-700 py-1.5 px-2 text-left min-w-[100px]">POLLING UNIT</th>
                <th className="border border-emerald-700 py-1.5 px-2 text-left min-w-[80px]">BANK</th>
                <th className="border border-emerald-700 py-1.5 px-2 text-left min-w-[90px]">ACCOUNT NO.</th>
                <th className="border border-emerald-700 py-1.5 px-1 min-w-[50px]">SIGN</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((r, i) => (
                <tr key={i} className="h-6 sm:h-7 border-b border-slate-300">
                  <td className="border border-slate-300 text-center font-bold text-slate-700 py-0.5 px-1">
                    {r.sn}.
                  </td>
                  <td className="border border-slate-300 py-0.5 px-2 font-medium truncate">
                    {r.names}
                  </td>
                  <td className="border border-slate-300 py-0.5 px-1.5 truncate text-[10px]">
                    {r.role ? (
                      <span className={r.isExco ? "font-bold text-amber-800" : "text-slate-700"}>
                        {r.isExco ? "★ " : ""}{r.role}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-[9px]">—</span>
                    )}
                  </td>
                  <td className="border border-slate-300 py-0.5 px-2 font-mono truncate">
                    {r.phone}
                  </td>
                  <td className="border border-slate-300 py-0.5 px-2 font-mono uppercase truncate">
                    {r.vin}
                  </td>
                  <td className="border border-slate-300 py-0.5 px-2 truncate">
                    {r.pollingUnit}
                  </td>
                  <td className="border border-slate-300 py-0.5 px-2 truncate">
                    {r.bank}
                  </td>
                  <td className="border border-slate-300 py-0.5 px-2 font-mono truncate">
                    {r.accountNo}
                  </td>
                  <td className="border border-slate-300 py-0.5 px-1 text-center italic text-[9px] text-slate-600">
                    {r.sign}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Data Protection Notice (matching PDF OCR text verbatim) */}
        <div className="mt-4 pt-2 border-t border-slate-200">
          <p className="text-[9px] leading-tight text-slate-600">
            Data-protection notice: collect only information required for authorised TMW registration and coordination. Handle personal data securely, obtain appropriate consent, and do not use registration information for unlawful inducement or unauthorised disclosure.
          </p>
          <div className="mt-2 flex items-center justify-between text-[9px] text-slate-500 font-medium">
            <span>TINUBU MOVEMENT WORLDWIDE (TMW) - Official Electoral Ward Registration Sheet</span>
            <span>Page 1 of 1</span>
          </div>
        </div>

      </div>
    </div>
  );
};
