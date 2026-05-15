import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { NewsletterDashboard } from "@/components/newsletter-dashboard";

export default async function NewslettersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="p-4">
      <div className="max-w-5xl mx-auto">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-[#FF6B4A]" />
            </div>
          }
        >
          <NewsletterDashboard />
        </Suspense>
      </div>
    </div>
  );
}
