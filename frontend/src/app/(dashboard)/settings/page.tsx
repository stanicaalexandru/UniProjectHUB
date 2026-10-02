"use client";
import { useState, useEffect } from "react";
import { useT } from "@/i18n";
import { storedUser } from "@/lib/projects";
import { isSharedDemoAccount } from "@/lib/showcase";
import { Page, PageHeader, PageBody } from "@/components/ui/Page";
import { ProfileSection } from "./ProfileSection";
import { NotificationsSection } from "./NotificationsSection";
import { SecuritySection } from "./SecuritySection";
import { DeleteAccountSection } from "./DeleteAccountSection";
import type { User } from "@/types";

export default function SettingsPage() {
  const { t } = useT();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => { setUser(storedUser()); }, []);

  // Copia locala a profilului (folosita de meniu, chat etc.) se actualizeaza odata cu serverul
  const updateUser = (next: User) => {
    localStorage.setItem("user", JSON.stringify(next));
    setUser(next);
  };

  return (
    <Page>
      <PageHeader title={t("settings.title")} />
      <PageBody>
        {user && (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
              <ProfileSection user={user} onUserChange={updateUser} />
              <div className="space-y-5">
                <NotificationsSection user={user} onUserChange={updateUser} />
                <SecuritySection user={user} onUserChange={updateUser} />
              </div>
            </div>
            {/* Conturile demo comune nu pot fi sterse */}
            {!isSharedDemoAccount(user.email) && <DeleteAccountSection />}
          </>
        )}
      </PageBody>
    </Page>
  );
}
