"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ro } from "./locales/ro";
import { en } from "./locales/en";
import { userName } from "@/lib/api";

// Traduceri fara biblioteci externe: dictionarul romanesc defineste cheile, cel englezesc trebuie sa aiba
// exact aceleasi chei (verificat la compilare). Limba aleasa se pastreaza in browser.

export type Locale = "ro" | "en";
export const LOCALES: Locale[] = ["ro", "en"];
const DICTIONARIES = { ro, en } as const;
const STORAGE_KEY = "locale";

// Toate cheile posibile, ca text cu puncte: "nav.projects", "errors.PROJECT_NOT_FOUND" etc.
type Leaves<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];
export type TranslationKey = Leaves<typeof ro>;
export type Params = Record<string, string | number | undefined | null>;

function lookup(dict: unknown, key: string): string | undefined {
  const value = key.split(".").reduce<unknown>((node, part) => (node && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined), dict);
  return typeof value === "string" ? value : undefined;
}

function interpolate(text: string, params?: Params) {
  return params ? text.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? "")) : text;
}

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: Params) => string;
  /** Pentru chei construite dinamic (ex. statusuri venite de la server): intoarce fallback daca cheia nu exista */
  tr: (key: string, fallback?: string, params?: Params) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ro");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "ro" || saved === "en") setLocaleState(saved);
    } catch {}
  }, []);

  useEffect(() => { document.documentElement.lang = locale; }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch {}
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    const dict = DICTIONARIES[locale];
    // Pentru count = 1 se foloseste varianta de singular (cheie_one), daca exista
    const find = (key: string) => lookup(dict, key) ?? lookup(ro, key);
    const tr = (key: string, fallback?: string, params?: Params) =>
      interpolate((params?.count === 1 ? find(`${key}_one`) : undefined) ?? find(key) ?? fallback ?? key, params);
    return { locale, setLocale, tr, t: (key, params) => tr(key, undefined, params) };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT trebuie folosit in interiorul I18nProvider");
  return ctx;
}

// Mesajul unei erori in limba curenta: dupa codul stabil trimis de server, altfel mesajul primit
// Un text simplu (ex. validare facuta in pagina) este intors neschimbat.
export function useErrorMessage() {
  const { tr } = useT();
  return useCallback((err: unknown) => {
    if (typeof err === "string") return err;
    const e = err as { code?: string; message?: string; params?: Params };
    return e?.code ? tr(`errors.${e.code}`, e.message || tr("errors.UNKNOWN"), e.params) : e?.message || tr("errors.UNKNOWN");
  }, [tr]);
}

// Numele unui utilizator; pentru conturile sterse (relatie goala) un text tradus
export function useUserName() {
  const { t } = useT();
  return useCallback((u?: { firstName?: string; lastName?: string } | null) => userName(u, t("common.unknownUser")), [t]);
}

// Formatare de date si numere dupa limba curenta
export function useFormat() {
  const { locale } = useT();
  const tag = locale === "ro" ? "ro-RO" : "en-GB";
  return {
    date: (value?: string | Date | null, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) =>
      value ? new Date(value).toLocaleDateString(tag, opts) : "—",
    dateTime: (value?: string | Date | null) =>
      value ? new Date(value).toLocaleString(tag, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—",
    number: (value: number, digits = 0) => value.toLocaleString(tag, { maximumFractionDigits: digits }),
    fileSize: (bytes: number) => {
      if (!bytes) return "0 B";
      if (bytes < 1024) return `${bytes} B`;
      const kb = bytes / 1024;
      return kb < 1024 ? `${kb.toLocaleString(tag, { maximumFractionDigits: 1 })} KB` : `${(kb / 1024).toLocaleString(tag, { maximumFractionDigits: 1 })} MB`;
    },
  };
}
