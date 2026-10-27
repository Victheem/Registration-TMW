/**
 * Single Member Electoral Ward Registration Form
 * Tinubu Movement Worldwide (TMW)
 */

import React, { useState } from "react";
import { 
  NIGERIAN_STATES_AND_LGAS, 
  NIGERIAN_BANKS, 
  isValidAccountNumber, 
  generateReferenceId, 
  formatNigerianPhone,
  isValidVIN,
  EXCO_LEVELS,
  STANDARD_EXCO_ROLES_BY_LEVEL,
  STANDARD_NON_EXCO_ROLES
} from "../data/nigeriaData";
import { RegistrationRecord, ExcoLevel } from "../types";
import { submitRegistration } from "../services/googleSheetsService";
import { 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  User, 
  CreditCard, 
  MapPin, 
  Phone, 
  FileCheck,
  Send,
  RotateCcw,
  Award,
  Users,
  Star
} from "lucide-react";
import confetti from "canvas-confetti";

interface SingleRegistrationFormProps {
  onSuccess: (record: RegistrationRecord) => void;
  openSettings: () => void;
  isBackendConnected: boolean;
  isAdminMode?: boolean;
}

export const SingleRegistrationForm: React.FC<SingleRegistrationFormProps> = ({
  onSuccess,
  openSettings,
  isBackendConnected,
  isAdminMode = false,
}) => {
  // Electoral Jurisdiction
  const [stateName, setStateName] = useState("Lagos");
  const [lga, setLga] = useState("Ikeja");
  const [customLga, setCustomLga] = useState("");
  const [ward, setWard] = useState("");

  // Role & EXCO Distinction
  const [isExco, setIsExco] = useState(false);
  const [excoLevel, setExcoLevel] = useState<ExcoLevel>("Ward");
  const [selectedExcoRole, setSelectedExcoRole] = useState(STANDARD_EXCO_ROLES_BY_LEVEL["Ward"][0]);
  const [selectedNonExcoRole, setSelectedNonExcoRole] = useState(STANDARD_NON_EXCO_ROLES[0]);
  const [customRole, setCustomRole] = useState("");

  // Member Credentials
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [vin, setVin] = useState("");
  const [pollingUnit, setPollingUnit] = useState("");

  // Banking Details
  const [bankName, setBankName] = useState("Access Bank");
  const [customBank, setCustomBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  // Sign-off
  const [signatureName, setSignatureName] = useState("");
  const [hasConsent, setHasConsent] = useState(true);

  // Status & Validation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // Available LGAs based on selected state
  const selectedStateObj = NIGERIAN_STATES_AND_LGAS.find(s => s.state === stateName);
  const availableLgas = selectedStateObj ? selectedStateObj.lgas : [];

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newState = e.target.value;
    setStateName(newState);
    const stateObj = NIGERIAN_STATES_AND_LGAS.find(s => s.state === newState);
    if (stateObj && stateObj.lgas.length > 0) {
      setLga(stateObj.lgas[0]);
    } else {
      setLga("");
    }
    setCustomLga("");
  };

  const handleExcoLevelChange = (lvl: ExcoLevel) => {
    setExcoLevel(lvl);
    const levelKey = lvl === "None" ? "Ward" : lvl;
    const defaultForLevel = STANDARD_EXCO_ROLES_BY_LEVEL[levelKey]?.[0] || "Executive Member";
    setSelectedExcoRole(defaultForLevel);
    setCustomRole("");
  };

  const isOtherExcoRole = selectedExcoRole.includes("Other");
  const isOtherNonExcoRole = selectedNonExcoRole.includes("Other");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    // Validation
    const effectiveLga = lga === "OTHER" ? customLga.trim() : lga.trim();
    const effectiveBank = bankName === "Other / Microfinance Bank" ? customBank.trim() : bankName.trim();

    const effectiveRole = isExco
      ? (isOtherExcoRole ? (customRole.trim() || selectedExcoRole) : selectedExcoRole)
      : (isOtherNonExcoRole ? (customRole.trim() || selectedNonExcoRole) : selectedNonExcoRole);

    if (!stateName) {
      setFeedback({ type: "error", message: "Please select your State." });
      return;
    }
    if (!effectiveLga) {
      setFeedback({ type: "error", message: "Please specify your Local Government Area (LGA)." });
      return;
    }
    if (!ward.trim()) {
      setFeedback({ type: "error", message: "Please enter your Electoral Ward." });
      return;
    }
    if (!fullName.trim() || fullName.trim().length < 3) {
      setFeedback({ type: "error", message: "Please enter the registrant's Full Name (at least 3 characters)." });
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, "").length < 10) {
      setFeedback({ type: "error", message: "Please enter a valid Phone Number (at least 10 digits)." });
      return;
    }
    if (!vin.trim()) {
      setFeedback({ type: "error", message: "Please provide the Voter's Card Number (VIN)." });
      return;
    }
    if (!pollingUnit.trim()) {
      setFeedback({ type: "error", message: "Please enter the Polling Unit name or code." });
      return;
    }
    if (!effectiveBank) {
      setFeedback({ type: "error", message: "Please provide the Bank Name." });
      return;
    }
    if (!accountNumber.trim() || !isValidAccountNumber(accountNumber)) {
      setFeedback({ type: "error", message: "Nigerian bank account number must be exactly 10 digits (NUBAN standard)." });
      return;
    }
    if (!hasConsent) {
      setFeedback({ type: "error", message: "You must accept the data-protection and authorization terms to proceed." });
      return;
    }

    setIsSubmitting(true);

    const refId = generateReferenceId(selectedStateObj?.code || "NG");
    const record: RegistrationRecord = {
      id: `tmw-${Date.now()}`,
      referenceId: refId,
      state: stateName,
      lga: effectiveLga,
      ward: ward.trim(),
      fullName: fullName.trim(),
      phone: formatNigerianPhone(phone.trim()),
      vin: vin.trim().toUpperCase(),
      pollingUnit: pollingUnit.trim(),
      bankName: effectiveBank,
      accountNumber: accountNumber.trim(),
      signature: signatureName.trim() || fullName.trim(),
      timestamp: new Date().toISOString(),
      status: "pending",
      isExco,
      excoLevel: isExco ? excoLevel : "None",
      role: effectiveRole
    };

    try {
      const res = await submitRegistration(record);
      
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#0D5C3A", "#F59E0B", "#DC2626", "#10B981"]
        });
      } catch {}

      setFeedback({
        type: "success",
        message: res.message
      });

      onSuccess(record);

      // Reset member-specific fields, retaining State, LGA, Ward for fast repetitive entries
      setFullName("");
      setPhone("");
      setVin("");
      setAccountNumber("");
      setSignatureName("");
      setCustomRole("");
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: `Failed to submit registration: ${err?.message || "Please check your network and try again."}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (confirm("Reset the form fields?")) {
      setFullName("");
      setPhone("");
      setVin("");
      setPollingUnit("");
      setAccountNumber("");
      setSignatureName("");
      setCustomRole("");
      setFeedback(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Official Sheet Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-[#0D5C3A] via-[#0b4e31] to-[#083b25] px-6 py-5 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold tracking-widest uppercase text-emerald-200">
                Official Registration Sheet
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5">
                ELECTORAL WARD REGISTRATION FORM
              </h2>
              <p className="text-xs text-emerald-100/90 mt-1">
                Tinubu Movement Worldwide (TMW) National Grassroots Directory
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-xs rounded-md text-xs font-semibold text-emerald-50 border border-white/20">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                Verified Form
              </span>
            </div>
          </div>
        </div>

        {/* Backend notice if not connected (VISIBLE ONLY TO COORDINATOR / ADMIN) */}
        {isAdminMode && !isBackendConnected && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Coordinator Notice:</strong> No Google Sheet URL connected. Submissions are temporarily saving to local device memory.
              </span>
            </div>
            <button
              type="button"
              onClick={openSettings}
              className="font-semibold underline hover:text-amber-950 whitespace-nowrap ml-2"
            >
              Configure Google Sheet
            </button>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
          
          {/* Section 1: Electoral Location Jurisdiction */}
          <div>
            <div className="flex items-center gap-2 pb-2 mb-4 border-b border-slate-200">
              <MapPin className="w-4 h-4 text-[#0D5C3A]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                1. Electoral Jurisdiction Details
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* State */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  State <span className="text-red-500">*</span>
                </label>
                <select
                  value={stateName}
                  onChange={handleStateChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 font-medium focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 focus:bg-white transition-all"
                  required
                >
                  {NIGERIAN_STATES_AND_LGAS.map((item) => (
                    <option key={item.state} value={item.state}>
                      {item.state} State
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Select Nigerian State of registration
                </span>
              </div>

              {/* LGA */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  LGA (Local Govt Area) <span className="text-red-500">*</span>
                </label>
                <select
                  value={lga}
                  onChange={(e) => setLga(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 font-medium focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 focus:bg-white transition-all"
                  required
                >
                  {availableLgas.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                  <option value="OTHER">-- Enter Other LGA --</option>
                </select>

                {lga === "OTHER" && (
                  <input
                    type="text"
                    value={customLga}
                    onChange={(e) => setCustomLga(e.target.value)}
                    placeholder="Enter custom LGA name"
                    className="w-full mt-2 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600"
                    required
                  />
                )}
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Designated Local Government Area
                </span>
              </div>

              {/* Electoral Ward */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Electoral Ward <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  placeholder="e.g. Ward 03 / Alausa Ward"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 font-medium focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 focus:bg-white transition-all"
                  required
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Official INEC designated ward name or number
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Membership Role & EXCO Distinction (NEW) */}
          <div className="bg-slate-50/70 p-5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 mb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#0D5C3A]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  2. Membership Role &amp; EXCO Classification
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                Official Hierarchy &amp; Portfolios
              </span>
            </div>

            {/* EXCO vs Non-EXCO Switch Buttons */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                Is this member an EXCO (Executive Committee) Member? <span className="text-red-500">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Non-EXCO Card */}
                <button
                  type="button"
                  onClick={() => setIsExco(false)}
                  className={`p-3.5 rounded-lg border text-left transition-all flex items-start gap-3 cursor-pointer ${
                    !isExco
                      ? "bg-white border-[#0D5C3A] ring-2 ring-[#0D5C3A]/20 shadow-xs"
                      : "bg-white/60 border-slate-200 hover:bg-white hover:border-slate-300"
                  }`}
                >
                  <div className={`p-2 rounded-md shrink-0 mt-0.5 ${!isExco ? "bg-emerald-100 text-[#0D5C3A]" : "bg-slate-100 text-slate-500"}`}>
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900">Non-EXCO Member</span>
                      {!isExco && (
                        <span className="text-[10px] bg-emerald-100 text-[#0D5C3A] font-bold px-1.5 py-0.2 rounded">
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      General Member, Grassroots Mobilizer, Supporter, or Volunteer
                    </p>
                  </div>
                </button>

                {/* EXCO Card */}
                <button
                  type="button"
                  onClick={() => setIsExco(true)}
                  className={`p-3.5 rounded-lg border text-left transition-all flex items-start gap-3 cursor-pointer ${
                    isExco
                      ? "bg-white border-amber-500 ring-2 ring-amber-500/20 shadow-xs"
                      : "bg-white/60 border-slate-200 hover:bg-white hover:border-slate-300"
                  }`}
                >
                  <div className={`p-2 rounded-md shrink-0 mt-0.5 ${isExco ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>
                    <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900">EXCO Member</span>
                      {isExco && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                          Executive Official
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Holds an Executive Committee office at Ward, LGA, State, or National level
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Role Fields based on EXCO choice */}
            {isExco ? (
              <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-lg space-y-4">
                <div className="flex items-center gap-2 text-amber-900 text-xs font-bold">
                  <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                  <span>Executive Committee Details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* EXCO Level */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                      EXCO Administrative Level <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={excoLevel}
                      onChange={(e) => handleExcoLevelChange(e.target.value as ExcoLevel)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                    >
                      {EXCO_LEVELS.map((lvl) => (
                        <option key={lvl.value} value={lvl.value}>
                          {lvl.label}
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Select level where the executive portfolio is held
                    </span>
                  </div>

                  {/* Specific EXCO Role */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                      Executive Portfolio / Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedExcoRole}
                      onChange={(e) => setSelectedExcoRole(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500"
                    >
                      {(STANDARD_EXCO_ROLES_BY_LEVEL[excoLevel === "None" ? "Ward" : excoLevel] || []).map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Official Executive Office assigned
                    </span>
                  </div>
                </div>

                {isOtherExcoRole && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                      Specify Executive Office Title:
                    </label>
                    <input
                      type="text"
                      value={customRole}
                      onChange={(e) => setCustomRole(e.target.value)}
                      placeholder="e.g. Ward Special Adviser / Liaison"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-emerald-900 text-xs font-bold">
                  <Users className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Grassroots Member Role</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                      Member Designation / Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedNonExcoRole}
                      onChange={(e) => setSelectedNonExcoRole(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-600"
                    >
                      {STANDARD_NON_EXCO_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  {isOtherNonExcoRole && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                        Specify Role Title:
                      </label>
                      <input
                        type="text"
                        value={customRole}
                        onChange={(e) => setCustomRole(e.target.value)}
                        placeholder="e.g. Grassroots Youth Mobilizer"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-600"
                        required
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Member Personal & Voter Information */}
          <div>
            <div className="flex items-center gap-2 pb-2 mb-4 border-b border-slate-200">
              <User className="w-4 h-4 text-[#0D5C3A]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                3. Member &amp; Voter Credentials
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Full Name / Names <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Babatunde Olawale Adeleke"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 font-medium focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 focus:bg-white transition-all"
                  required
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Enter Surname followed by First &amp; Middle names
                </span>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0803 123 4567"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 font-medium focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 focus:bg-white transition-all"
                    required
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Active contact for campaign coordination
                </span>
              </div>

              {/* Voter's Card Number (VIN) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Voter's Card Number (VIN) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={vin}
                  onChange={(e) => setVin(e.target.value)}
                  placeholder="e.g. 90F5 B402 7819 2831 012"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono text-slate-900 tracking-wider uppercase focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 focus:bg-white transition-all"
                  required
                />
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                  <span>Standard INEC Permanent Voter's Card (PVC) VIN</span>
                  {vin && (
                    <span className={isValidVIN(vin) ? "text-emerald-600 font-semibold" : "text-amber-600"}>
                      {isValidVIN(vin) ? "✓ Valid VIN Format" : "VIN length check"}
                    </span>
                  )}
                </div>
              </div>

              {/* Polling Unit */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Polling Unit <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={pollingUnit}
                  onChange={(e) => setPollingUnit(e.target.value)}
                  placeholder="e.g. PU 014 / Community Primary School"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 font-medium focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 focus:bg-white transition-all"
                  required
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Name and code of the polling unit where member votes
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Financial & Banking Details */}
          <div>
            <div className="flex items-center gap-2 pb-2 mb-4 border-b border-slate-200">
              <CreditCard className="w-4 h-4 text-[#0D5C3A]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                4. Financial &amp; Bank Account Information
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Bank Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Bank Name <span className="text-red-500">*</span>
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 font-medium focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 focus:bg-white transition-all"
                  required
                >
                  {NIGERIAN_BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>

                {bankName === "Other / Microfinance Bank" && (
                  <input
                    type="text"
                    value={customBank}
                    onChange={(e) => setCustomBank(e.target.value)}
                    placeholder="Enter official bank / MFB name"
                    className="w-full mt-2 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-600"
                    required
                  />
                )}
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Registered Nigerian Commercial or FinTech Bank
                </span>
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Account Number (10 Digits) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                  placeholder="0123456789"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono tracking-widest text-slate-900 font-medium focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 focus:bg-white transition-all"
                  required
                />
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                  <span>Standard 10-digit NUBAN account format</span>
                  <span className={`font-mono font-medium ${accountNumber.length === 10 ? "text-emerald-600" : "text-slate-400"}`}>
                    {accountNumber.length} / 10 digits
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Signature / Sign-off */}
          <div>
            <div className="flex items-center gap-2 pb-2 mb-4 border-b border-slate-200">
              <FileCheck className="w-4 h-4 text-[#0D5C3A]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                5. Sign-off &amp; Endorsement
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Registrant / Coordinator Signature (Name)
                </label>
                <input
                  type="text"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  placeholder="Type Full Name as digital signature"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm italic text-slate-900 font-medium focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 focus:bg-white transition-all"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Acts as digital authorization for TMW Ward documentation
                </span>
              </div>

              {/* Data Protection Checkbox */}
              <div className="flex items-start gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  id="consent"
                  checked={hasConsent}
                  onChange={(e) => setHasConsent(e.target.checked)}
                  className="mt-1 w-4 h-4 text-emerald-700 rounded border-slate-300 focus:ring-emerald-600"
                  required
                />
                <label htmlFor="consent" className="text-xs text-slate-700 leading-relaxed cursor-pointer">
                  I confirm that the information provided is accurate and hereby grant consent for Tinubu Movement Worldwide (TMW) electoral mobilization coordination.
                </label>
              </div>
            </div>
          </div>

          {/* Feedback message banner */}
          {feedback && (
            <div
              className={`p-4 rounded-lg flex items-start gap-3 text-sm ${
                feedback.type === "success"
                  ? "bg-emerald-50 text-emerald-900 border border-emerald-300"
                  : "bg-red-50 text-red-900 border border-red-300"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-semibold">{feedback.type === "success" ? "Submitted Successfully" : "Submission Alert"}</p>
                <p className="text-xs mt-0.5">{feedback.message}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Clear Form</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto min-w-[220px] px-6 py-3 bg-[#0D5C3A] hover:bg-[#09432A] text-white font-bold text-sm rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                  <span>Submitting to Google Sheet...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-emerald-200" />
                  <span>Submit Ward Registration</span>
                </>
              )}
            </button>
          </div>

          {/* Official Mandatory Data Protection Notice */}
          <div className="mt-8 pt-4 border-t border-slate-200">
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
              <span className="font-bold text-slate-800 uppercase tracking-wider block mb-1">
                Data-Protection Notice:
              </span>
              Collect only information required for authorised TMW registration and coordination. Handle personal data securely, obtain appropriate consent, and do not use registration information for unlawful inducement or unauthorised disclosure.
            </div>
            <div className="mt-2 text-center text-[10px] text-slate-400 font-medium">
              TINUBU MOVEMENT WORLDWIDE (TMW) · Official Electoral Ward Registration Sheet
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
