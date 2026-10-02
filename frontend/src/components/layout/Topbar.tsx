"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Folder, ListChecks, Plus, Search, SearchX, UserRound, X, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, apiFetchAll } from "@/lib/api";
import { useT } from "@/i18n";
import { Spinner } from "@/components/ui/States";
import type { Project, Task, User } from "@/types";
import { usePageTitle } from "@/lib/usePageTitle";

interface TopbarProps {
  title: string;
  action?: { label: string; onClick: () => void };
}

type ResultType = "project" | "task" | "user";
type SearchResult = { id: string; title: string; subtitle: string; type: ResultType; href: string; icon: LucideIcon; badge?: string; badgeColor: string };

const GROUPS: { type: ResultType; label: "search.groupProject" | "search.groupTask" | "search.groupUser" }[] = [
  { type: "project", label: "search.groupProject" },
  { type: "task", label: "search.groupTask" },
  { type: "user", label: "search.groupUser" },
];

const listOf = <T,>(r: PromiseSettledResult<T[] | { data?: T[] }>): T[] =>
  r.status !== "fulfilled" ? [] : Array.isArray(r.value) ? r.value : r.value?.data || [];

export function Topbar({ title, action }: TopbarProps) {
  const { t } = useT();
  usePageTitle(title);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [unread, setUnread] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchCount = () => apiFetch("/notifications/count").then(d => setUnread(Number(d) || 0)).catch(() => {});
    fetchCount();
    window.addEventListener("notifications-updated", fetchCount);
    return () => window.removeEventListener("notifications-updated", fetchCount);
  }, []);

  // Click in afara inchide rezultatele; Ctrl/⌘+K muta focusul in campul de cautare
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); inputRef.current?.focus(); }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onClick); document.removeEventListener("keydown", onKey); };
  }, []);

  const performSearch = useCallback(async (query: string) => {
    setLoading(true);
    const q = query.toLowerCase();
    const [projects, tasks, users] = await Promise.allSettled([
      apiFetchAll<Project>("/projects"),
      apiFetch("/tasks") as Promise<Task[]>,
      apiFetchAll<User>("/users"),
    ]);
    const found: SearchResult[] = [];

    listOf<Project>(projects).filter(p =>
      p.title?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.technologies?.some(tech => tech.toLowerCase().includes(q))
    ).slice(0, 4).forEach(p => found.push({
      id: p.id, title: p.title, type: "project", href: `/projects/${p.id}`, icon: Folder,
      subtitle: `${t(`projectType.${p.type}`)} · ${t(`projectStatus.${p.status}`)}`,
      badge: t(`projectStatus.${p.status}`), badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    }));

    listOf<Task>(tasks).filter(task =>
      task.title?.toLowerCase().includes(q) || task.description?.toLowerCase().includes(q)
    ).slice(0, 3).forEach(task => found.push({
      id: task.id, title: task.title, type: "task", href: "/tasks", icon: ListChecks,
      subtitle: `${t("search.taskLabel")} · ${t(`priority.${task.priority}`)} · ${t(`taskStatus.${task.status}`)}`,
      badge: t(`priority.${task.priority}`), badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    }));

    listOf<User>(users).filter(u =>
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    ).slice(0, 3).forEach(u => found.push({
      id: u.id, title: `${u.firstName} ${u.lastName}`, type: "user", href: "/users", icon: UserRound,
      subtitle: `${t(`roles.${u.role}`)} · ${u.email}`,
      badge: t(`roles.${u.role}`), badgeColor: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
    }));

    // Ordinea din lista trebuie sa fie cea afisata (pe grupuri), ca navigarea cu sagetile sa urmeze ecranul
    setResults(GROUPS.flatMap(g => found.filter(r => r.type === g.type)));
    setHighlighted(0);
    setShowResults(true);
    setLoading(false);
  }, [t]);

  useEffect(() => {
    if (search.trim().length < 2) { setResults([]); setShowResults(false); return; }
    const timer = setTimeout(() => performSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search, performSearch]);

  const open = (href: string) => {
    setSearch("");
    setShowResults(false);
    router.push(href);
  };

  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") { setShowResults(false); inputRef.current?.blur(); return; }
    if (!showResults || results.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlighted(i => (i + 1) % results.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlighted(i => (i - 1 + results.length) % results.length); }
    else if (e.key === "Enter") { e.preventDefault(); open(results[highlighted].href); }
  };

  return (
    <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 sm:gap-4 px-4 sm:px-6 flex-shrink-0 transition-colors">
      <h1 className="text-base font-semibold sm:flex-1 dark:text-slate-100 truncate hidden sm:block">{title}</h1>

      {/* Cautarea globala */}
      <div className="relative flex-1 sm:max-w-80" ref={searchRef}>
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
          {loading ? <Spinner className="w-4 h-4 text-slate-500" /> : <Search className="w-4 h-4 text-slate-500 flex-shrink-0 dark:text-slate-400" aria-hidden="true" />}
          <input
            ref={inputRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => search.trim().length >= 2 && setShowResults(true)}
            onKeyDown={onInputKey}
            placeholder={t("search.placeholder")}
            aria-label={t("search.label")}
            role="combobox"
            aria-expanded={showResults}
            aria-controls="global-search-results"
            aria-activedescendant={showResults && results[highlighted] ? `search-result-${highlighted}` : undefined}
            className="bg-transparent text-sm outline-none flex-1 min-w-0 text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
          />
          {search && (
            <button aria-label={t("search.clear")} onClick={() => { setSearch(""); setShowResults(false); }} className="text-slate-500 hover:text-slate-600 transition-colors dark:text-slate-400">
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
          <kbd className="hidden md:flex items-center gap-1 text-xs text-slate-500 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-1.5 py-0.5 flex-shrink-0 dark:text-slate-300">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>

        {showResults && (
          <div id="global-search-results" className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
            {results.length === 0 ? (
              <div className="p-4 text-center" role="status">
                <SearchX className="w-6 h-6 mx-auto mb-1 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                <div className="text-sm text-slate-500 dark:text-slate-400">{t("search.noResults", { query: search })}</div>
              </div>
            ) : (
              <>
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide dark:text-slate-400" role="status">{t("search.resultCount", { count: results.length })}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{t("search.escToClose")}</span>
                </div>
                <div className="max-h-80 overflow-y-auto py-1" role="listbox" aria-label={t("search.label")}>
                  {GROUPS.map(({ type, label }) => {
                    const group = results.filter(r => r.type === type);
                    if (group.length === 0) return null;
                    return (
                      <div key={type} role="group" aria-label={t(label)}>
                        <div className="px-3 py-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 dark:text-slate-400" aria-hidden="true">{t(label)}</div>
                        {group.map(result => {
                          const index = results.indexOf(result);
                          return (
                            <button key={`${type}-${result.id}`} id={`search-result-${index}`} role="option" aria-selected={index === highlighted}
                              onClick={() => open(result.href)} onMouseEnter={() => setHighlighted(index)}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left ${index === highlighted ? "bg-slate-100 dark:bg-slate-800" : ""}`}>
                              <result.icon className="w-4 h-4 flex-shrink-0 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium dark:text-slate-200 truncate">{result.title}</div>
                                <div className="text-xs text-slate-500 truncate dark:text-slate-400">{result.subtitle}</div>
                              </div>
                              {result.badge && <span className={`hidden sm:inline text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${result.badgeColor}`}>{result.badge}</span>}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
                <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 text-center dark:text-slate-400">{t("search.footer")}</div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Link href="/notifications" aria-label={unread > 0 ? `${t("nav.notifications")} — ${t("nav.unread", { count: unread })}` : t("nav.notifications")}
          className="relative w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <Bell className="w-4 h-4 dark:text-slate-400" aria-hidden="true" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold" aria-hidden="true">{unread > 9 ? "9+" : unread}</span>
          )}
        </Link>
        {action && (
          <button onClick={action.onClick} className="btn-primary" aria-label={action.label}>
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">{action.label}</span>
          </button>
        )}
      </div>
    </header>
  );
}
