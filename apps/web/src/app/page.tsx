import { AddArticleForm } from "@/components/add-article-form";
import { ArticleList } from "@/components/article-list";
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
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Your Library</h1>
        <p className="text-muted-foreground">
          Manage and listen to your saved articles.
        </p>
      </div>

      <AddArticleForm />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Saved Articles</h2>
        <ArticleList />
      </div>
    </div>
  );
}
