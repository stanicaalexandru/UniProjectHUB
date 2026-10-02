"use client";
import { I18nProvider } from "@/i18n";
import { FeedbackProvider } from "@/components/ui/Feedback";

// Traducerile trebuie sa fie disponibile si pentru notificari si ferestrele de confirmare
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <FeedbackProvider>{children}</FeedbackProvider>
    </I18nProvider>
  );
}
