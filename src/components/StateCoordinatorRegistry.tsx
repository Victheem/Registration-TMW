import React, { useEffect, useMemo, useState } from "react";
import { KeyRound, RefreshCw, Search, ShieldAlert, Users, X } from "lucide-react";
import { RegistrationRecord } from "../types";
import { changeStateCoordinatorPin } from "../services/googleSheetsService";

interface StateCoordinatorRegistryProps {
  state: string;
  token: string;
  mustChangePin: boolean;
  records: RegistrationRecord[];
  onRefresh: () => void;
  isRefreshing: boolean;
  onPinChanged: (token: string) => void;
}

export const StateCoordinatorRegistry: React.FC<StateCoordinatorRegistryProps> = ({
  state,
  token,
  mustChangePin,
  records,
  onRefresh,
  isRefreshing,
  onPinChanged,
}) => {
  const [search, setSearch] = useState("");
  const [isChangingPin, setIsChangingPin] = useState(mustChangePin);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinMessage, setPinMessage] = useState<string | null>(null);
  const [isSavingPin, setIsSavingPin] = useState(false);

  useEffect(() => {
    if (mustChangePin) setIsChangingPin(true);
  }, [mustChangePin]);

  const handleChangePin = async (event: React.FormEvent) => {
    event.preventDefault();
    setPinError(null);
    setPinMessage(null);
    if (newPin.trim().length < 4) {
      setPinError("New PIN must be at least 4 characters.");
      return;
    }
    if (newPin !== confirmPin) {
      setPinError("The new PINs do not match.");
      return;
    }

    setIsSavingPin(true);
    try {
      const result = await changeStateCoordinatorPin(token, currentPin, newPin);
      setPinMessage(result.message);
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      onPinChanged(result.token);
      setIsChangingPin(false);
    } catch (error) {
      setPinError(error instanceof Error ? error.message : "Could not change the state PIN.");
    } finally {
      setIsSavingPin(false);
    }
  };

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return records;
    return records.filter((record) =>
      [
        record.referenceId,
        record.fullName,
        record.phone,
        record.lga,
        record.ward,
        record.vin,
        record.role,
      ].some((value) => value?.toLowerCase().includes(term)),
    );
  }, [records, search]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div>
          <h3 className="text-lg font-extrabold text-emerald-950">{state} Registration List</h3>
          <p className="mt-1 text-xs text-emerald-800">This list is restricted to registrations assigned to {state}.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-emerald-900">
            {records.length} {records.length === 1 ? "entry" : "entries"}
          </span>
          <button
            type="button"
            onClick={() => setIsChangingPin(true)}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-bold text-emerald-900 hover:bg-emerald-100"
          >
            <KeyRound className="h-3.5 w-3.5" />
            Change PIN
          </button>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-lg bg-[#0D5C3A] px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {pinMessage && (
        <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
          {pinMessage}
        </p>
      )}

      {isChangingPin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <form onSubmit={handleChangePin} className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-emerald-950">
                  {mustChangePin ? "Set a private state PIN" : "Change state PIN"}
                </h3>
                <p className="mt-1 text-xs text-slate-600">
                  {mustChangePin
                    ? "This state is using the default PIN. Change it before continuing."
                    : `Only ${state} coordinator credentials will be changed.`}
                </p>
              </div>
              {!mustChangePin && (
                <button type="button" onClick={() => setIsChangingPin(false)} className="rounded p-1 text-slate-500 hover:bg-slate-100" aria-label="Close change PIN form">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <label className="block text-xs font-semibold text-slate-700">
              Current PIN
              <input
                type="password"
                required
                value={currentPin}
                onChange={(event) => setCurrentPin(event.target.value)}
                autoComplete="current-password"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-sm outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-700">
              New PIN
              <input
                type="password"
                required
                minLength={4}
                value={newPin}
                onChange={(event) => setNewPin(event.target.value)}
                autoComplete="new-password"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-sm outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-700">
              Confirm new PIN
              <input
                type="password"
                required
                minLength={4}
                value={confirmPin}
                onChange={(event) => setConfirmPin(event.target.value)}
                autoComplete="new-password"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-sm outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600"
              />
            </label>

            {pinError && (
              <div role="alert" className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              {!mustChangePin && (
                <button type="button" onClick={() => setIsChangingPin(false)} className="rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                  Cancel
                </button>
              )}
              <button type="submit" disabled={isSavingPin} className="rounded-lg bg-[#0D5C3A] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60">
                {isSavingPin ? "Saving..." : "Save new PIN"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, phone, LGA, ward, or reference"
          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        {filteredRecords.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <Users className="mx-auto mb-3 h-8 w-8 text-slate-400" />
            <p className="text-sm font-bold text-slate-800">
              {search ? "No matching registrations" : "No registrations found for this state"}
            </p>
          </div>
        ) : (
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-700">
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Full name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">LGA</th>
                <th className="px-4 py-3">Ward</th>
                <th className="px-4 py-3">VIN</th>
                <th className="px-4 py-3">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold text-emerald-800">{record.referenceId}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900">{record.fullName}</td>
                  <td className="whitespace-nowrap px-4 py-3">{record.phone}</td>
                  <td className="whitespace-nowrap px-4 py-3">{record.lga}</td>
                  <td className="whitespace-nowrap px-4 py-3">{record.ward}</td>
                  <td className="whitespace-nowrap px-4 py-3">{record.vin}</td>
                  <td className="whitespace-nowrap px-4 py-3">{record.role || "Member"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
};
