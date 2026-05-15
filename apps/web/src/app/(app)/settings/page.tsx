import { AccountSettings } from "@/components/settings/account-settings";
import { ProfileSettings } from "@/components/settings/profile-settings";
import { DataSettings } from "@/components/settings/data-settings";
import { VoiceSettings } from "@/components/settings/voice-settings";
import { DangerZone } from "@/components/settings/danger-zone";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/login");
  }

  const user = data.user;

  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-8 md:px-6 md:py-12 space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="space-y-6">
        {/* Account — Email, Password, Subscription */}
        <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <AccountSettings userEmail={user.email ?? ""} />
        </section>

        {/* Profile — Avatar, Display Name, Username, Bio */}
        <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <ProfileSettings />
        </section>

        {/* Voice & Audio — Reader Voice selection + preview */}
        <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <VoiceSettings />
        </section>

        {/* Data & Storage — Export JSON, Import (Pocket, Instapaper, HTML) */}
        <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <DataSettings />
        </section>

        {/* Danger Zone — Delete Account */}
        <section className="rounded-xl border border-destructive/20 bg-card shadow-sm overflow-hidden">
          <DangerZone />
        </section>
      </div>
    </div>
  );
}
