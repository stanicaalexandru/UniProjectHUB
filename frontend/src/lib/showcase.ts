import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

// Demo public (NEXT_PUBLIC_SHOWCASE=true): conturi demo pe pagina de autentificare si avertismente pentru vizitatori
export const SHOWCASE = process.env.NEXT_PUBLIC_SHOWCASE === "true";

export const DEMO_ACCOUNTS = [
  { key: "student", email: "demo.student@example.com", name: "Vlad Stoica" },
  { key: "professor", email: "prof@example.com", name: "Mihai Dobre" },
] as const;
export const DEMO_PASSWORD = "password123";

// Conturile demo sunt comune tuturor vizitatorilor: parola, PIN-ul si stergerea sunt blocate pe server
export const isSharedDemoAccount = (email?: string | null) => SHOWCASE && /@(student\.)?example\.com$/i.test(email ?? "");

// Informatii publice despre server (GET /health): daca emailul e configurat. In demo, cererea "trezeste"
// si serverul gratuit cat timp vizitatorul citeste pagina de autentificare.
type ServerInfo = { emailEnabled: boolean };
let serverInfo: Promise<ServerInfo> | null = null;
export function getServerInfo(): Promise<ServerInfo> {
  serverInfo ??= fetch(`${API_URL}/health`)
    .then(r => r.json())
    .then(j => ({ emailEnabled: (j.data ?? j).emailEnabled !== false }))
    .catch(() => { serverInfo = null; return { emailEnabled: true }; });
  return serverInfo;
}

export function useServerInfo() {
  const [info, setInfo] = useState<ServerInfo | null>(null);
  useEffect(() => { getServerInfo().then(setInfo); }, []);
  return info;
}
