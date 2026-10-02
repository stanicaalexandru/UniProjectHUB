"use client";
import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useT, useErrorMessage } from "@/i18n";
import { Page, PageHeader } from "@/components/ui/Page";
import { Alert } from "@/components/ui/Alert";
import { LoadingState } from "@/components/ui/States";
import { loadCalendarEvents, dayKey, parseDayKey, startOfWeek, eventColor, EVENT_ICON, EVENT_COLOR, type CalEvent, type EventKind } from "./calendarData";

const KINDS: EventKind[] = ["projectStart", "projectEnd", "milestone", "task"];
const MONDAY = new Date(2024, 0, 1); // o zi de luni oarecare, pentru numele zilelor saptamanii

function useEventTitle() {
  const { t } = useT();
  return (ev: CalEvent) => {
    const text = ev.kind === "projectEnd" ? t("calendar.projectEndTitle", { title: ev.title })
      : ev.kind === "projectStart" ? t("calendar.projectStartTitle", { title: ev.title }) : ev.title;
    return `${EVENT_ICON[ev.kind]} ${text}`;
  };
}

function EventChip({ ev, compact }: { ev: CalEvent; compact?: boolean }) {
  const title = useEventTitle()(ev);
  return <div className={`${eventColor(ev)} text-white text-xs ${compact ? "px-1.5 py-0.5 rounded-md leading-tight" : "px-2 py-1 rounded-lg"} truncate`} title={title}>{title}</div>;
}

export default function CalendarPage() {
  const { t, locale } = useT();
  const errorMessage = useErrorMessage();
  const eventTitle = useEventTitle();
  const tag = locale === "ro" ? "ro-RO" : "en-GB";
  const today = new Date();
  const todayKey = dayKey(today);

  const [view, setView] = useState<"month" | "week">("month");
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));
  const [selected, setSelected] = useState<string | null>(null);
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setEvents(await loadCalendarEvents()); } catch (e) { setError(e); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const eventsOn = (key: string) => events.filter(e => e.date === key);
  const shift = (delta: number) => view === "month"
    ? setMonth(m => new Date(m.getFullYear(), m.getMonth() + delta, 1))
    : setWeekStart(w => new Date(w.getFullYear(), w.getMonth(), w.getDate() + 7 * delta));
  const goToday = () => {
    setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setWeekStart(startOfWeek(today));
    setSelected(todayKey);
  };

  const weekDayNames = Array.from({ length: 7 }, (_, i) => new Date(MONDAY.getFullYear(), 0, 1 + i));
  const monthDays = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const leadingBlanks = (month.getDay() + 6) % 7;
  const weekDays = Array.from({ length: 7 }, (_, i) => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i));
  const heading = view === "month"
    ? month.toLocaleDateString(tag, { month: "long", year: "numeric" })
    : `${weekDays[0].toLocaleDateString(tag, { day: "numeric", month: "short" })} — ${weekDays[6].toLocaleDateString(tag, { day: "numeric", month: "short", year: "numeric" })}`;

  const upcoming = events.filter(e => e.date >= todayKey).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8);
  const selectedEvents = selected ? eventsOn(selected) : [];

  const dayCellLabel = (key: string, count: number) =>
    `${parseDayKey(key).toLocaleDateString(tag, { weekday: "long", day: "numeric", month: "long" })}: ${t("calendar.eventCount", { count })}`;

  return (
    <Page>
      <PageHeader title={t("calendar.title")}>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1" role="group" aria-label={t("calendar.viewLabel")}>
          {(["month", "week"] as const).map(v => (
            <button key={v} onClick={() => setView(v)} aria-pressed={view === v}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${view === v ? "bg-white dark:bg-slate-700 shadow-sm text-blue-700 dark:text-blue-300" : "text-slate-600 dark:text-slate-400"}`}>
              {v === "month" ? t("calendar.monthView") : t("calendar.weekView")}
            </button>
          ))}
        </div>
        <button onClick={goToday} className="btn-secondary text-xs">{t("calendar.today")}</button>
        <button aria-label={t("calendar.reload")} title={t("calendar.reload")} onClick={load} className="btn-secondary p-2"><RefreshCw className="w-4 h-4" aria-hidden="true" /></button>
      </PageHeader>

      <div className="flex-1 overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950">
        <div className="flex-1 flex flex-col lg:overflow-hidden p-4 sm:p-5 min-w-0">
          {error ? <Alert className="mb-4">{errorMessage(error)}</Alert> : null}
          <div className="flex items-center justify-between mb-4">
            <button aria-label={view === "month" ? t("calendar.prevMonth") : t("calendar.prevWeek")} onClick={() => shift(-1)} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700">
              <ChevronLeft className="w-4 h-4 dark:text-slate-400" aria-hidden="true" />
            </button>
            <h2 className="text-base sm:text-lg font-bold dark:text-slate-100 capitalize" aria-live="polite">{heading}</h2>
            <button aria-label={view === "month" ? t("calendar.nextMonth") : t("calendar.nextWeek")} onClick={() => shift(1)} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700">
              <ChevronRight className="w-4 h-4 dark:text-slate-400" aria-hidden="true" />
            </button>
          </div>

          {loading ? <LoadingState label={t("calendar.loading")} /> : view === "month" ? (
            <div className="overflow-x-auto">
              <div className="min-w-[560px]">
                <div className="grid grid-cols-7 mb-2" aria-hidden="true">
                  {weekDayNames.map(d => <div key={d.getDate()} className="text-center text-xs font-bold text-slate-500 dark:text-slate-400 py-2 uppercase tracking-wide">{d.toLocaleDateString(tag, { weekday: "short" })}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: leadingBlanks }).map((_, i) => <div key={`empty-${i}`} className="min-h-20" />)}
                  {Array.from({ length: monthDays }).map((_, i) => {
                    const key = dayKey(new Date(month.getFullYear(), month.getMonth(), i + 1));
                    const dayEvents = eventsOn(key);
                    const isToday = key === todayKey;
                    const isSelected = key === selected;
                    return (
                      <button key={key} onClick={() => setSelected(key)} aria-pressed={isSelected} aria-label={dayCellLabel(key, dayEvents.length)}
                        className={`min-h-20 p-1.5 rounded-xl text-left align-top transition-all border ${isSelected ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50" : isToday ? "border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/30" : "border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-900"}`}>
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold mb-1 ${isToday ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-400"}`} aria-hidden="true">{i + 1}</span>
                        <span className="block space-y-0.5" aria-hidden="true">
                          {dayEvents.slice(0, 2).map(ev => <EventChip key={ev.id} ev={ev} compact />)}
                          {dayEvents.length > 2 && <span className="block text-xs text-slate-500 dark:text-slate-400 pl-1">{t("calendar.more", { count: dayEvents.length - 2 })}</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <div className="grid grid-cols-7 gap-2 min-w-[640px]">
                {weekDays.map(date => {
                  const key = dayKey(date);
                  const dayEvents = eventsOn(key);
                  const isToday = key === todayKey;
                  return (
                    <div key={key} className="flex flex-col">
                      <div className="text-center mb-2" aria-hidden="true">
                        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">{date.toLocaleDateString(tag, { weekday: "short" })}</div>
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold mx-auto ${isToday ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-400"}`}>{date.getDate()}</div>
                      </div>
                      <button onClick={() => { setSelected(key); setMonth(new Date(date.getFullYear(), date.getMonth(), 1)); }} aria-label={dayCellLabel(key, dayEvents.length)} aria-pressed={key === selected}
                        className={`flex-1 rounded-xl p-2 text-left border transition-colors min-h-32 ${isToday ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700"}`}>
                        {dayEvents.length === 0
                          ? <span className="block text-center py-4 text-xs text-slate-500 dark:text-slate-400" aria-hidden="true">—</span>
                          : <span className="block space-y-1" aria-hidden="true">{dayEvents.map(ev => <EventChip key={ev.id} ev={ev} />)}</span>}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Panoul lateral: ziua aleasa, urmatoarele evenimente, legenda */}
        <aside className="lg:w-72 flex-shrink-0 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col lg:overflow-y-auto">
          <section className="p-4" aria-live="polite">
            {selected ? (
              <>
                <h3 className="text-sm font-semibold dark:text-slate-100 mb-3">{parseDayKey(selected).toLocaleDateString(tag, { day: "numeric", month: "long", year: "numeric" })}</h3>
                {selectedEvents.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-500 dark:text-slate-400"><span className="block text-3xl mb-2" aria-hidden="true">📅</span>{t("calendar.noEventsDay")}</p>
                ) : (
                  <ul className="space-y-2">
                    {selectedEvents.map(ev => (
                      <li key={ev.id} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${eventColor(ev)}`} aria-hidden="true" />
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{eventTitle(ev)}</span>
                        </div>
                        {ev.projectName && ev.kind !== "projectStart" && ev.kind !== "projectEnd" && <div className="text-xs text-slate-500 ml-4 dark:text-slate-400"><span aria-hidden="true">📁 </span>{ev.projectName}</div>}
                        <div className="ml-4 mt-1"><span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-white text-xs ${eventColor(ev)}`}>{t(`calendar.kind.${ev.kind}`)}</span></div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <>
                <h3 className="text-sm font-semibold dark:text-slate-100 mb-1">{t("calendar.pickDay")}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t("calendar.pickDayHint")}</p>
              </>
            )}
          </section>

          <section className="border-t border-slate-100 dark:border-slate-800 p-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">{t("calendar.upcoming")}</h3>
            {upcoming.length === 0 ? <p className="text-xs text-slate-500 dark:text-slate-400">{t("calendar.noUpcoming")}</p> : (
              <ul className="space-y-2">
                {upcoming.map(ev => (
                  <li key={ev.id} className="flex items-start gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${eventColor(ev)}`} aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium dark:text-slate-300 truncate">{eventTitle(ev)}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{parseDayKey(ev.date).toLocaleDateString(tag, { day: "numeric", month: "short" })}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="border-t border-slate-100 dark:border-slate-800 p-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">{t("gantt.legend")}</h3>
            <ul className="space-y-1.5">
              {KINDS.map(kind => (
                <li key={kind} className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-sm ${EVENT_COLOR[kind]}`} aria-hidden="true" />
                  <span className="text-xs text-slate-600 dark:text-slate-400">{t(`calendar.kind.${kind}`)}</span>
                </li>
              ))}
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-teal-700" aria-hidden="true" />
                <span className="text-xs text-slate-600 dark:text-slate-400">{t("calendar.kindDone")}</span>
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </Page>
  );
}
