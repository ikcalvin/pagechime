import { ArticleList } from "@/components/article-list";
import { Sidebar } from "@/components/sidebar";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <main className="flex-1 p-4">
          <div className="max-w-5xl mx-auto">
            <ArticleList view="inbox" />
          </div>
        </main>
      </div>
    </div>
  );
}
