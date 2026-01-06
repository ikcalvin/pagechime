import { Sidebar } from "@/components/sidebar";
import { ProfileSettings } from "../../../components/settings/profile-settings";
import { DataSettings } from "../../../components/settings/data-settings";
import { VoiceSettings } from "../../../components/settings/voice-settings";
import { DangerZone } from "../../../components/settings/danger-zone";

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <div className="max-w-5xl mx-auto w-full p-6 md:p-12 space-y-4">
          <div className="pb-6 border-b border-border">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          </div>

          <div className="divide-y divide-border">
            <ProfileSettings />
            <VoiceSettings />
            <DataSettings />
            <DangerZone />
          </div>
        </div>
      </div>
    </div>
  );
}
