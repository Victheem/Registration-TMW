/**
 * Official TMW Electoral Ward Registration Portal User Guide Modal
 * Complete operational manual for field agents, ward executives, and State Coordinators
 */

import React, { useState } from "react";
import { 
  X, 
  BookOpen, 
  UserPlus, 
  TableProperties, 
  Database, 
  Lock, 
  Printer, 
  Download, 
  ShieldCheck, 
  CheckCircle2, 
  Star, 
  Users, 
  Award,
  ChevronRight,
  ExternalLink,
  Smartphone,
  RefreshCw
} from "lucide-react";
import { TMWLogo } from "./TMWLogo";

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCoordinatorLogin?: () => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({
  isOpen,
  onClose,
  onOpenCoordinatorLogin,
}) => {
  const [activeSection, setActiveSection] = useState<"overview" | "single" | "batch" | "coordinator" | "sync" | "faq">("overview");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0D5C3A] via-[#0b4e31] to-[#083b25] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TMWLogo size={36} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-300">
                  Documentation &amp; Training
                </span>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded font-mono">
                  v3.5
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                Portal User Guide &amp; Field Manual
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close Guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Navigation Pills */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex items-center gap-2 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveSection("overview")}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
              activeSection === "overview"
                ? "bg-[#0D5C3A] text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            1. Overview &amp; Roles
          </button>
          <button
            onClick={() => setActiveSection("single")}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
              activeSection === "single"
                ? "bg-[#0D5C3A] text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            2. Single Member Form
          </button>
          <button
            onClick={() => setActiveSection("batch")}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
              activeSection === "batch"
                ? "bg-[#0D5C3A] text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            3. Ward Batch Sheet (20-Rows)
          </button>
          <button
            onClick={() => setActiveSection("coordinator")}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
              activeSection === "coordinator"
                ? "bg-[#0D5C3A] text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            4. Coordinator Mode &amp; Login
          </button>
          <button
            onClick={() => setActiveSection("sync")}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
              activeSection === "sync"
                ? "bg-[#0D5C3A] text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            5. Live Sync &amp; Database
          </button>
          <button
            onClick={() => setActiveSection("faq")}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
              activeSection === "faq"
                ? "bg-[#0D5C3A] text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            6. Field FAQs
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700 leading-relaxed flex-1">
          
          {/* Section 1: Overview */}
          {activeSection === "overview" && (
            <div className="space-y-5">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <h3 className="text-base font-bold text-emerald-950 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-700" />
                  Purpose of the Electoral Ward Registration Portal
                </h3>
                <p className="text-xs text-emerald-900 mt-1">
                  The Tinubu Movement Worldwide (TMW) Electoral Ward Registration Portal is the official digital infrastructure for grassroots voter mobilization and leadership directory compilation across all 36 States, the FCT, 774 LGAs, and 8,809 Electoral Wards in Nigeria.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center gap-2 text-[#0D5C3A] font-bold">
                    <UserPlus className="w-4 h-4" />
                    <h4>Public Member Intake Mode</h4>
                  </div>
                  <p className="text-xs text-slate-600">
                    Accessible to any grassroots member, volunteer, or mobilization agent via mobile phone, tablet, or PC without needing any login or technical configuration.
                  </p>
                  <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                    <li>Clean, distraction-free member intake form</li>
                    <li>Instant generation of digital verified member slip</li>
                    <li>Real-time automated saving to central cloud database</li>
                  </ul>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold">
                    <Lock className="w-4 h-4 text-amber-700" />
                    <h4>Protected Coordinator Mode</h4>
                  </div>
                  <p className="text-xs text-slate-600">
                    Protected by a coordinator security PIN to prevent unauthorized public tampering or data viewing.
                  </p>
                  <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                    <li>Access to the Central Registry Database</li>
                    <li>Live multi-device search and filtering</li>
                    <li>CSV export and Google Sheets automation setup</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
                  Official Leadership &amp; EXCO Hierarchy Portfolios:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <strong className="text-amber-800">1.</strong> State Coordinator
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <strong className="text-amber-800">2.</strong> Deputy / Operations Lead
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <strong className="text-amber-800">3.</strong> State Secretary
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <strong className="text-amber-800">4.</strong> State Finance / Admin Lead
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <strong className="text-amber-800">5.</strong> State Communications Lead
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <strong className="text-amber-800">6.</strong> State Mobilisation Lead
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <strong className="text-amber-800">7.</strong> State Policy / Engagement Lead
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <strong className="text-amber-800">8.</strong> LGA Coordinators
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <strong className="text-amber-800">9.</strong> Ward Coordinators
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Single Member Form */}
          {activeSection === "single" && (
            <div className="space-y-5">
              <div className="border-l-4 border-[#0D5C3A] pl-4 py-1">
                <h3 className="font-bold text-slate-900 text-base">
                  Step-by-Step: Registering an Individual Member
                </h3>
                <p className="text-xs text-slate-500">
                  Ideal for on-the-spot member enrollment at polling units, ward meetings, or constituency offices.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#0D5C3A] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#0D5C3A] flex items-center justify-center text-[11px] font-bold">1</span>
                    Electoral Jurisdiction
                  </h4>
                  <p className="text-xs text-slate-600">
                    Select the member's <strong>State</strong>. The <strong>LGA dropdown</strong> automatically filters to list only the official local governments in that state. If a newly created or diaspora area is needed, select <em>-- Enter Other LGA --</em>. Enter the official <strong>Electoral Ward</strong> name or number (e.g., <em>Ward 03 Alausa</em>).
                  </p>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#0D5C3A] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#0D5C3A] flex items-center justify-center text-[11px] font-bold">2</span>
                    Role &amp; Executive Classification
                  </h4>
                  <p className="text-xs text-slate-600">
                    Choose whether the member holds an <strong>EXCO</strong> (Executive Committee) office or is a <strong>Non-EXCO</strong> general member/mobilizer:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
                    <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
                      <strong className="text-emerald-900 block">Non-EXCO Member:</strong>
                      Select standard designation (General Member, Grassroots Mobilizer, Polling Unit Agent, Volunteer, or Elder/Patron).
                    </div>
                    <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200">
                      <strong className="text-amber-900 block">EXCO Member:</strong>
                      Use the 1-Click quick buttons for the 9 core titles, or select the administrative level (State, LGA, Ward, National) and specific portfolio.
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#0D5C3A] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#0D5C3A] flex items-center justify-center text-[11px] font-bold">3</span>
                    Member &amp; Voter Credentials
                  </h4>
                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                    <li><strong>Full Name:</strong> Enter Surname first, followed by First Name and Middle Name.</li>
                    <li><strong>Phone Number:</strong> Active Nigerian mobile number (e.g., <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">0803 123 4567</code>). Leading zeros are preserved automatically.</li>
                    <li><strong>Voter Card (VIN):</strong> Enter the 19-character alphanumeric Permanent Voter's Card VIN code. The portal validates format automatically.</li>
                    <li><strong>Polling Unit:</strong> Enter the name/code of the voting unit where the member casts their ballot.</li>
                  </ul>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#0D5C3A] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#0D5C3A] flex items-center justify-center text-[11px] font-bold">4</span>
                    Financial &amp; Bank Account Information
                  </h4>
                  <p className="text-xs text-slate-600">
                    Select the Nigerian commercial bank or Microfinance Bank (MFB). Enter the 10-digit standard NUBAN account number.
                  </p>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#0D5C3A] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#0D5C3A] flex items-center justify-center text-[11px] font-bold">5</span>
                    Submission &amp; Certificate Generation
                  </h4>
                  <p className="text-xs text-slate-600">
                    Type digital signature name, tick the authorization checkbox, and tap <strong>"Submit Ward Registration"</strong>. The portal displays a verified digital certificate with member QR verification, printable on any standard mobile printer or office paper.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Ward Batch Sheet */}
          {activeSection === "batch" && (
            <div className="space-y-5">
              <div className="border-l-4 border-amber-600 pl-4 py-1">
                <h3 className="font-bold text-slate-900 text-base">
                  Ward Batch Sheet: 20-Row Mass Registration
                </h3>
                <p className="text-xs text-slate-500">
                  Mirrors the official paper ward register used by Ward Executives to transcribe field lists in batches.
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                  How to Use the Batch Sheet:
                </h4>
                <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside">
                  <li>
                    <strong>Set the Common Ward Header:</strong> At the top of the sheet, set the State, LGA, Electoral Ward name, and Coordinator's Name once. All 20 member rows automatically inherit this jurisdiction.
                  </li>
                  <li>
                    <strong>Fill Member Rows:</strong> Enter each member's Name, Phone, EXCO status, Role, VIN, Polling Unit, Bank, and Account Number.
                  </li>
                  <li>
                    <strong>EXCO vs Non-EXCO Switch:</strong> Click the badge on any row to toggle between <em>EXCO</em> (gold star) and <em>Non-EXCO</em> (green).
                  </li>
                  <li>
                    <strong>Quick Testing:</strong> Click <strong>"Fill Sample Data"</strong> to populate test records and preview table layout.
                  </li>
                  <li>
                    <strong>Add More Rows:</strong> If your ward meeting had more than 20 attendees, click <strong>"Add 5 More Rows"</strong> at the bottom to expand to 25, 30, or more rows.
                  </li>
                  <li>
                    <strong>Single-Click Batch Submission:</strong> Click <strong>"Submit Ward Sheet"</strong> to upload all filled rows to the central registry and Google Sheets at once.
                  </li>
                  <li>
                    <strong>Print / Export PDF:</strong> Click <strong>"Print / Export PDF Sheet"</strong> to generate a formatted official A4 document ready for signing and filing.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* Section 4: Coordinator Mode */}
          {activeSection === "coordinator" && (
            <div className="space-y-5">
              <div className="border-l-4 border-[#0D5C3A] pl-4 py-1">
                <h3 className="font-bold text-slate-900 text-base">
                  State &amp; LGA Coordinator Mode
                </h3>
                <p className="text-xs text-slate-500">
                  Secure administration controls for monitoring registration progress, syncing data, and exporting files.
                </p>
              </div>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                  <Lock className="w-4 h-4 text-amber-700" />
                  Default Coordinator Security PIN
                </div>
                <p className="text-xs text-amber-950">
                  The default security PIN to unlock Coordinator Mode is: <strong className="font-mono bg-white px-2 py-0.5 rounded border border-amber-300 text-amber-900 text-sm">2027</strong> (or <strong className="font-mono bg-white px-2 py-0.5 rounded border border-amber-300 text-amber-900 text-sm">tmw2027</strong>).
                </p>
                <p className="text-[11px] text-amber-800">
                  You can change this PIN anytime in the Coordinator Login dialog to your own custom PIN.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                  Unlocking Coordinator Mode:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <strong className="text-slate-900 block mb-1">Method 1: Footer Login</strong>
                    Scroll to the bottom of the page and click <strong>"Coordinator Login"</strong>, enter PIN <code className="font-mono font-bold">2027</code>, and tap Unlock.
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <strong className="text-slate-900 block mb-1">Method 2: Direct URL</strong>
                    Append <code className="font-mono bg-slate-100 px-1 py-0.5 rounded font-bold">#admin</code> or <code className="font-mono bg-slate-100 px-1 py-0.5 rounded font-bold">?admin=true</code> to the website address in your browser address bar.
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#0D5C3A]">
                  Registry Features Available to Coordinators:
                </h4>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                  <li><strong>Central Registry Database:</strong> View all members registered on any mobile phone or computer nationwide.</li>
                  <li><strong>Filter by EXCO Status:</strong> Filter instantly between <em>All Members</em>, <em>EXCO Only</em>, or <em>Non-EXCO</em>.</li>
                  <li><strong>Instant Live Search:</strong> Search across names, phone numbers, VIN, LGA, Ward, or Role.</li>
                  <li><strong>Export to CSV / Excel:</strong> Download an offline spreadsheet of all registered members with all 16 columns formatted for election day management.</li>
                  <li><strong>Print Individual Slips:</strong> Re-open and print any member's verified slip at any time.</li>
                  <li><strong>Lock / Exit Coordinator Mode:</strong> Click <strong>"Exit"</strong> in the top green banner when handing your device to a field member so they cannot see database records.</li>
                </ul>
              </div>
            </div>
          )}

          {/* Section 5: Live Sync & Database */}
          {activeSection === "sync" && (
            <div className="space-y-5">
              <div className="border-l-4 border-emerald-600 pl-4 py-1">
                <h3 className="font-bold text-slate-900 text-base">
                  Real-Time Cross-Device Synchronization
                </h3>
                <p className="text-xs text-slate-500">
                  How registrations sync between Device A, Device B, Google Sheets, and Supabase.
                </p>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 text-emerald-700" />
                  Automatic Multi-Device Synchronization
                </h4>
                <p className="text-xs text-emerald-900">
                  When a ward agent enters registrations on their phone in Kano or Rivers State, the State Coordinator in Abuja or Lagos sees the records appear in the Central Registry automatically within <strong>3.5 seconds</strong>.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                  Connecting Google Sheets:
                </h4>
                <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside">
                  <li>In Coordinator Mode, click the <strong>"Connect Google Sheet"</strong> button in the header bar.</li>
                  <li>Click <strong>"Copy Code.gs"</strong> to copy the ready-to-run automation script.</li>
                  <li>Open your Google Sheet, go to <strong>Extensions &gt; Apps Script</strong>, paste the script, and click <strong>Deploy &gt; New deployment &gt; Web app</strong>.</li>
                  <li>Set <strong>Who has access: Anyone</strong> and copy the resulting Web App URL (<code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[11px]">https://script.google.com/macros/s/.../exec</code>).</li>
                  <li>Paste the URL into the app's Google Sheet settings modal. The server verifies the connection and syncs all submissions automatically.</li>
                  <li>To pull existing rows from your Google Sheet into the coordinator registry, click <strong>"Fetch from Google Sheet"</strong>.</li>
                </ol>
              </div>
            </div>
          )}

          {/* Section 6: FAQs */}
          {activeSection === "faq" && (
            <div className="space-y-4">
              <div className="border-l-4 border-[#0D5C3A] pl-4 py-1 mb-2">
                <h3 className="font-bold text-slate-900 text-base">
                  Frequently Asked Questions (Field Operations)
                </h3>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                <strong className="text-xs text-slate-900 font-bold block">
                  Q: Does registration work if internet connection drops momentarily in the field?
                </strong>
                <p className="text-xs text-slate-600">
                  Yes. The portal includes an offline queue. Submissions are securely preserved in device storage and automatically uploaded as soon as mobile network or Wi-Fi reconnects.
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                <strong className="text-xs text-slate-900 font-bold block">
                  Q: Why did phone numbers lose their leading zero in previous Excel files?
                </strong>
                <p className="text-xs text-slate-600">
                  Standard Excel often strips leading zeros from numbers. This portal specifically formats Nigerian phone numbers (e.g. <code className="font-mono font-bold">080...</code>) and bank account numbers with an escaped text format so leading zeros are 100% preserved in CSV exports and Google Sheets.
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                <strong className="text-xs text-slate-900 font-bold block">
                  Q: Can public members view or delete other people's registrations?
                </strong>
                <p className="text-xs text-slate-600">
                  No. The Registry Database and all delete/export controls are completely hidden behind Coordinator Login. Public users only see the clean registration intake forms.
                </p>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                <strong className="text-xs text-slate-900 font-bold block">
                  Q: How do we print an official blank 20-row ward sheet for offline manual collection?
                </strong>
                <p className="text-xs text-slate-600">
                  Click the <strong>"Print Official Form (PDF)"</strong> tab in the navigation bar. Select your State, LGA, and Ward, and click Print. You can print blank sheets for field mobilization agents to carry to remote polling units.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <BookOpen className="w-4 h-4 text-emerald-700" />
            <span>TMW National Coordination Manual &bull; Renewed Hope 2027</span>
          </div>
          <div className="flex items-center gap-2">
            {onOpenCoordinatorLogin && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCoordinatorLogin();
                }}
                className="px-3 py-1.5 font-bold text-amber-900 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 rounded-lg border border-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                <span>Coordinator Login (PIN: 2027)</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 font-bold text-white bg-[#0D5C3A] hover:bg-[#09432A] rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              Close Guide
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
