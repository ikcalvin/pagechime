import { Sidebar } from "@/components/sidebar";
import { ProfileSettings } from "../../../components/settings/profile-settings";
import { DataSettings } from "../../../components/settings/data-settings";
import { VoiceSettings } from "../../../components/settings/voice-settings";
import { DangerZone } from "../../../components/settings/danger-zone";
import { AccountSettings } from "../../../components/settings/account-settings";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  let user;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      console.error("Error fetching user or no session:", error);
    } else {
      user = data.user;
    }
  } catch (error) {
    console.error("Unexpected error in settings page:", error);
  }

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <div className="max-w-5xl mx-auto w-full p-6 md:p-12 space-y-4">
          <div className="divide-y divide-border">
            <AccountSettings userEmail={user.email || ""} />
            <ProfileSettings user={user} />
            <VoiceSettings />
            <DataSettings />
            <DangerZone />
          </div>
        </div>
      </div>
    </div>
  );
}
