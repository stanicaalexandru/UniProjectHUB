"use client";
import { useEffect } from "react";
import { useT } from "@/i18n";
import { useToast } from "@/components/ui/Feedback";

const SWITCH_FLAG = "account-switched";
const userId = (json: string | null) => {
  try { return (JSON.parse(json || "null") as { id?: string } | null)?.id ?? null; } catch { return null; }
};

// Sesiunea sta in localStorage, comun tuturor filelor aceluiasi site: o autentificare cu alt cont (sau o deconectare)
// intr-o fila schimba sesiunea si in celelalte. Filele deschise se actualizeaza imediat, ca sa nu afiseze un cont
// si sa trimita cereri in numele altuia.
export function SessionWatcher() {
  const { t } = useT();
  const toast = useToast();

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SWITCH_FLAG)) {
        sessionStorage.removeItem(SWITCH_FLAG);
        toast.info(t("session.switched"));
      }
    } catch {}

    const onStorage = (e: StorageEvent) => {
      if (e.storageArea !== localStorage) return;
      // Deconectare (sau stergerea datelor site-ului) in alta fila
      if ((e.key === "access_token" && e.newValue === null) || e.key === null) {
        window.location.href = "/login";
        return;
      }
      // Alt cont in alta fila: reincarcam pagina cu noul cont (reinnoirea sesiunii pastreaza acelasi id)
      if (e.key === "user" && userId(e.oldValue) !== userId(e.newValue)) {
        try { sessionStorage.setItem(SWITCH_FLAG, "1"); } catch {}
        window.location.reload();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se inregistreaza o singura data
  }, []);

  return null;
}
