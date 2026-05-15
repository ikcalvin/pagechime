import { ArticleList } from "@/components/article-list";
import { Suspense } from "react";
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
    <div className="p-4">
      <div className="max-w-5xl mx-auto">
        <Suspense fallback={<div>Loading...</div>}>
          <ArticleList view="inbox" />
        </Suspense>
      </div>
    </div>
  );
}
