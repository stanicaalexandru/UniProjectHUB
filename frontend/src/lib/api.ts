// Adresa API-ului vine din .env.local (NEXT_PUBLIC_API_URL); localhost e doar valoarea implicita pentru dezvoltare
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}
// Eroare venita de la API: pe langa mesaj pastreaza codul stabil (ex. PROJECT_NOT_FOUND), folosit la traduceri.
// Mesajele de aici sunt doar de rezerva; interfata afiseaza textul tradus dupa cod (vezi useErrorMessage).
export class ApiError extends Error {
  constructor(message: string, public code: string, public status: number, public details?: string[], public params?: Record<string, string | number>) {
    super(message);
  }
}

const NETWORK_ERROR = "The server is not responding.";

// Token-ul de acces expira dupa 15 minute. Refresh token-ul se roteste la fiecare folosire, deci doua reinnoiri
// paralele s-ar anula reciproc: in aceeasi fila facem o singura reinnoire pentru toate cererile care primesc 401,
// iar intre file (acelasi localStorage) le serializam cu Web Locks. Daca intre timp alta fila a reinnoit deja
// sesiunea (token-ul din localStorage nu mai e cel respins), folosim direct token-ul nou.
let refreshing: Promise<boolean> | null = null;

async function doRefresh(rejectedToken: string | null): Promise<boolean> {
  const current = localStorage.getItem("access_token");
  if (current && current !== rejectedToken) return true;
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const json = await res.json();
    const data = json.data ?? json;
    localStorage.setItem("access_token", data.accessToken);
    localStorage.setItem("refresh_token", data.refreshToken);
    localStorage.setItem("user", JSON.stringify(data.user));
    return true;
  } catch {
    return false;
  }
}

function refreshSession(rejectedToken: string | null): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (!refreshing) {
    const run: Promise<boolean> = navigator.locks
      ? (async () => await navigator.locks.request("uniproject-session-refresh", () => doRefresh(rejectedToken)))()
      : doRefresh(rejectedToken);
    refreshing = run.finally(() => { refreshing = null; });
  }
  return refreshing;
}

// Emailul unui cont neconfirmat, trecut de la autentificare la ecranul de confirmare (nu prin URL)
export const PENDING_EMAIL_KEY = "pending-verification-email";

// Sterge doar datele sesiunii; preferintele dispozitivului (tema, limba) raman
export function clearSession() {
  for (const key of ["access_token", "refresh_token", "user", "remember_me"]) localStorage.removeItem(key);
}

function endSession() {
  clearSession();
  if (!window.location.pathname.startsWith("/login")) window.location.href = "/login?expired=1";
}

// fetch autentificat: adauga token-ul, reinnoieste sesiunea la 401 si repeta cererea o singura data
export async function authFetch(path: string, options: RequestInit = {}, retry = true): Promise<Response> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    });
  } catch {
    throw new ApiError(NETWORK_ERROR, "NETWORK_ERROR", 0);
  }
  if (res.status === 401 && token && retry && !path.startsWith("/auth/")) {
    if (await refreshSession(token)) return authFetch(path, options, false);
    endSession();
  }
  return res;
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const isForm = typeof FormData !== "undefined" && options.body instanceof FormData;
  const res = await authFetch(path, {
    ...options,
    headers: { ...(isForm ? {} : { "Content-Type": "application/json" }), ...options.headers },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = Array.isArray(json.message) ? json.message[0] : json.message;
    throw new ApiError(message || "Unexpected error.", json.code || "UNKNOWN", res.status, json.details, json.params);
  }
  return json.data ?? json;
}
// Listele paginate (/projects, /users) intorc cel mult 100 de rezultate pe pagina: le aducem pe toate.
// Pastreaza formatul { data, total }, ca paginile care citesc `data` sa functioneze neschimbat.
export async function apiFetchAll<T = unknown>(path: string): Promise<{ data: T[]; total: number }> {
  const sep = path.includes("?") ? "&" : "?";
  const all: T[] = [];
  for (let page = 1; page <= 50; page++) {
    const res = await apiFetch(`${path}${sep}limit=100&page=${page}`);
    const items = Array.isArray(res) ? res : res.data || [];
    all.push(...items);
    if (Array.isArray(res) || items.length === 0 || all.length >= (res.total ?? 0)) break;
  }
  return { data: all, total: all.length };
}
// Descarcare autentificata: un <a href> simplu nu trimite token-ul, iar API-ul cere autentificare
export async function downloadFile(path: string, filename: string) {
  const res = await authFetch(path);
  if (!res.ok) throw new ApiError("The file could not be downloaded.", "DOWNLOAD_FAILED", res.status);
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
// Apel video Jitsi pentru o conversatie. Fereastra se deschide sincron, la click (altfel browserul o blocheaza
// ca pop-up), si primeste adresa dupa ce serverul confirma ca userul face parte din conversatie.
export async function startVideoCall(room: string | (() => Promise<string>)) {
  const win = window.open("about:blank", "_blank");
  // Fereastra blocata de browser: nu parasim aplicatia, explicam ce trebuie permis
  if (!win) throw new ApiError("The call window was blocked by the browser.", "POPUP_BLOCKED", 0);
  try {
    // Conversatia poate fi obtinuta abia acum (ex. pe pagina proiectului), dupa ce fereastra e deja deschisa
    const roomId = typeof room === "string" ? room : await room();
    const { url } = await apiFetch(`/chat/rooms/${roomId}/call`);
    win.opener = null;
    win.location.href = url;
  } catch (e) {
    win?.close();
    throw e;
  }
}
// Autorul unui continut poate fi null daca si-a sters contul (continutul ramane, anonimizat)
export function userName(u: { firstName?: string; lastName?: string } | null | undefined, fallback: string) {
  return u ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() : fallback;
}
