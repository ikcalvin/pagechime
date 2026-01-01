import { AddArticleDialog } from "@/components/add-article-form";
import { ArticleList } from "@/components/article-list";
import { Sidebar } from "@/components/sidebar";
import { SearchBar } from "@/components/search-bar";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="h-16 border-b px-8 flex items-center justify-between shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="w-full max-w-sm">
            <SearchBar />
          </div>
          <AddArticleDialog>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Link
            </Button>
          </AddArticleDialog>
        </header>

        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-5xl mx-auto">
            <ArticleList />
          </div>
        </main>
      </div>
    </div>
  );
}
