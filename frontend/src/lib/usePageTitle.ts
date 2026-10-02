"use client";
import { useEffect } from "react";

// Titlul filei din browser: "Proiecte · UniProject Hub"
export function usePageTitle(title: unknown) {
  useEffect(() => {
    if (typeof title !== "string" || !title) return;
    document.title = `${title} · UniProject Hub`;
    return () => { document.title = "UniProject Hub"; };
  }, [title]);
}
