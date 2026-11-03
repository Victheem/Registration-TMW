import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { NIGERIAN_STATES_AND_LGAS } from "../src/data/nigeriaData.js";

export type CoordinatorClaims =
  | { role: "national"; exp: number }
  | { role: "state"; state: string; exp: number; mustChangePin?: boolean };
type CoordinatorTokenClaims =
  | { role: "national" }
  | { role: "state"; state: string; mustChangePin?: boolean };

export class CoordinatorConfigError extends Error {}
export class CoordinatorValidationError extends Error {}

const TOKEN_LIFETIME_SECONDS = 8 * 60 * 60;
const canonicalStates = new Map<string, string>(
  NIGERIAN_STATES_AND_LGAS.map(({ state }) => [state.toLowerCase(), state] as const),
);
const DEFAULT_STATE_PIN = "0000";
const DEFAULT_NATIONAL_PIN = "2005";
const STATE_PIN_KEY_PREFIX = "tmw:state-coordinator-pin:";
const LOCAL_PIN_FILE = path.resolve(process.cwd(), "data", "state-coordinator-pins.json");

function getTokenSecret(): string {
  const secret = process.env.COORDINATOR_TOKEN_SECRET?.trim() ||
    (process.env.NODE_ENV === "production"
      ? process.env.KV_REST_API_TOKEN?.trim() || ""
      : "tmw-local-only-coordinator-secret-change-before-deployment");
  if (!secret || secret.length < 32) {
    throw new CoordinatorConfigError(
      "Set COORDINATOR_TOKEN_SECRET to a random value of at least 32 characters.",
    );
  }
  return secret;
}

function matchesSecret(provided: string, configured: string): boolean {
  const providedHash = createHash("sha256").update(provided).digest();
  const configuredHash = createHash("sha256").update(configured).digest();
  return timingSafeEqual(providedHash, configuredHash);
}

interface StoredPin {
  salt: string;
  hash: string;
}

function hashPin(pin: string, salt: string): Buffer {
  return scryptSync(pin, salt, 64);
}

function getKvCredentials(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL?.trim();
  const token = process.env.KV_REST_API_TOKEN?.trim();
  if (!url && !token && process.env.NODE_ENV !== "production") return null;
  if (!url || !token) {
    throw new CoordinatorConfigError(
      "Connect Vercel KV and configure KV_REST_API_URL and KV_REST_API_TOKEN to enable state coordinator logins.",
    );
  }
  return { url: url.replace(/\/+$/, ""), token };
}

async function runKvCommand<T>(command: string[]): Promise<T> {
  const credentials = getKvCredentials();
  if (!credentials) {
    throw new CoordinatorConfigError("Vercel KV is not configured for this deployment.");
  }
  const { url, token } = credentials;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });
  const result = await response.json().catch(() => null) as
    | { result?: T; error?: string }
    | null;
  if (!response.ok || !result || result.error) {
    throw new CoordinatorConfigError(
      `Could not access Vercel KV state PIN storage${result?.error ? `: ${result.error}` : ` (HTTP ${response.status})`}.`,
    );
  }
  return result.result as T;
}

function readLocalPin(state: string): StoredPin | null {
  if (!existsSync(LOCAL_PIN_FILE)) return null;
  const parsed: unknown = JSON.parse(readFileSync(LOCAL_PIN_FILE, "utf8"));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new CoordinatorConfigError("The local state PIN store is invalid.");
  }
  const record = (parsed as Record<string, unknown>)[state.toLowerCase()];
  if (!record) return null;
  if (typeof record !== "object" || record === null) {
    throw new CoordinatorConfigError(`The stored PIN for ${state} is invalid.`);
  }
  const stored = record as Partial<StoredPin>;
  if (typeof stored.salt !== "string" || typeof stored.hash !== "string") {
    throw new CoordinatorConfigError(`The stored PIN for ${state} is incomplete.`);
  }
  return { salt: stored.salt, hash: stored.hash };
}

function writeLocalPin(state: string, pin: StoredPin): void {
  let pins: Record<string, StoredPin> = {};
  if (existsSync(LOCAL_PIN_FILE)) {
    const parsed: unknown = JSON.parse(readFileSync(LOCAL_PIN_FILE, "utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new CoordinatorConfigError("The local state PIN store is invalid.");
    }
    pins = parsed as Record<string, StoredPin>;
  }
  pins[state.toLowerCase()] = pin;
  writeFileSync(LOCAL_PIN_FILE, JSON.stringify(pins, null, 2), { encoding: "utf8", mode: 0o600 });
}

function getStatePins(): Map<string, { state: string; pin: string }> {
  const raw = process.env.STATE_COORDINATOR_PINS;
  if (!raw) return new Map();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new CoordinatorConfigError("STATE_COORDINATOR_PINS must be valid JSON.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new CoordinatorConfigError("STATE_COORDINATOR_PINS must be a JSON object.");
  }

  const pins = new Map<string, { state: string; pin: string }>();
  for (const [name, pin] of Object.entries(parsed)) {
    const state = canonicalStates.get(name.trim().toLowerCase());
    if (!state || typeof pin !== "string" || pin.length < 4) {
      throw new CoordinatorConfigError(
        "STATE_COORDINATOR_PINS must use Nigerian state names and PINs of at least 4 characters.",
      );
    }
    pins.set(state.toLowerCase(), { state, pin });
  }
  return pins;
}

export function verifyNationalCoordinatorPin(pin: unknown): boolean {
  const configured = process.env.NATIONAL_COORDINATOR_PIN || DEFAULT_NATIONAL_PIN;
  if (typeof pin !== "string" || !pin) return false;
  return matchesSecret(pin, configured);
}

export async function verifyStateCoordinatorPin(
  stateName: unknown,
  pin: unknown,
): Promise<{ state: string; mustChangePin: boolean } | null> {
  if (typeof stateName !== "string" || typeof pin !== "string" || !pin) return null;
  const state = canonicalStates.get(stateName.trim().toLowerCase());
  if (!state) return null;
  const kvCredentials = getKvCredentials();
  const storedValue = kvCredentials
    ? await runKvCommand<string | null>(["GET", `${STATE_PIN_KEY_PREFIX}${state.toLowerCase()}`])
    : null;
  let storedPin: StoredPin | null = null;
  if (storedValue) {
    try {
      storedPin = JSON.parse(storedValue) as StoredPin;
    } catch {
      throw new CoordinatorConfigError(`The stored PIN for ${state} is not valid. Contact the system administrator.`);
    }
  } else if (!kvCredentials) {
    storedPin = readLocalPin(state);
  }
  if (storedPin) {
    if (typeof storedPin.salt !== "string" || typeof storedPin.hash !== "string") {
      throw new CoordinatorConfigError(`The stored PIN for ${state} is incomplete. Contact the system administrator.`);
    }
    const storedHash = Buffer.from(storedPin.hash, "hex");
    const providedHash = hashPin(pin, storedPin.salt);
    if (storedHash.length !== providedHash.length || !timingSafeEqual(storedHash, providedHash)) {
      return null;
    }
    return { state, mustChangePin: false };
  }

  const configured = getStatePins().get(state.toLowerCase());
  const activePin = configured?.pin || DEFAULT_STATE_PIN;
  if (!matchesSecret(pin, activePin)) return null;
  return { state, mustChangePin: !configured || activePin === DEFAULT_STATE_PIN };
}

export async function changeStateCoordinatorPin(
  state: string,
  currentPin: unknown,
  newPin: unknown,
): Promise<string> {
  if (typeof newPin !== "string" || newPin.trim().length < 4) {
    throw new CoordinatorValidationError("The new PIN must be at least 4 characters.");
  }
  const verified = await verifyStateCoordinatorPin(state, currentPin);
  if (!verified) throw new CoordinatorValidationError("The current state PIN is incorrect.");
  const salt = randomBytes(16).toString("hex");
  const hash = hashPin(newPin.trim(), salt).toString("hex");
  const storedPin = { salt, hash } satisfies StoredPin;
  if (getKvCredentials()) {
    await runKvCommand<string>([
      "SET",
      `${STATE_PIN_KEY_PREFIX}${verified.state.toLowerCase()}`,
      JSON.stringify(storedPin),
    ]);
  } else {
    writeLocalPin(verified.state, storedPin);
  }
  return createCoordinatorToken({ role: "state", state: verified.state });
}

export function createCoordinatorToken(
  claims: CoordinatorTokenClaims,
): string {
  const payload = Buffer.from(
    JSON.stringify({ ...claims, exp: Math.floor(Date.now() / 1000) + TOKEN_LIFETIME_SECONDS }),
  ).toString("base64url");
  const signature = createHmac("sha256", getTokenSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyCoordinatorToken(token: string | undefined): CoordinatorClaims | null {
  if (!token) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra !== undefined) return null;

  const expected = createHmac("sha256", getTokenSecret()).update(payload).digest();
  let provided: Buffer;
  try {
    provided = Buffer.from(signature, "base64url");
  } catch {
    return null;
  }
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null;

  let claims: unknown;
  try {
    claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!claims || typeof claims !== "object") return null;
  const candidate = claims as Partial<CoordinatorClaims>;
  if (typeof candidate.exp !== "number" || candidate.exp <= Math.floor(Date.now() / 1000)) {
    return null;
  }
  if (candidate.role === "national") {
    return { role: "national", exp: candidate.exp };
  }
  if (candidate.role === "state" && typeof candidate.state === "string") {
    const state = canonicalStates.get(candidate.state.toLowerCase());
    if (state === candidate.state) {
      return {
        role: "state",
        state,
        exp: candidate.exp,
        ...(candidate.mustChangePin ? { mustChangePin: true } : {}),
      };
    }
  }
  return null;
}

export function getBearerToken(authorization: string | undefined): string | undefined {
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  return match?.[1];
}
