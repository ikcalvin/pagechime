import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { AddArticleDialog } from "@/components/add-article-form";
import { SearchBar } from "@/components/search-bar";
import { Plus } from "lucide-react";

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const signOut = async () => {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex items-center justify-between p-4">
        <Link href="/" className="font-bold text-xl shrink-0">
          PageChime
        </Link>

        {user && (
          <div className="flex-1 max-w-xl mx-8 flex items-center gap-4">
            <div className="flex-1">
              <SearchBar />
            </div>
            <AddArticleDialog>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Link
              </Button>
            </AddArticleDialog>
          </div>
        )}

        <nav className="flex items-center gap-4 shrink-0">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {user.email}
              </span>
              <form action={signOut}>
                <Button variant="outline" size="sm">
                  Sign Out
                </Button>
              </form>
            </div>
          ) : (
            <Link href="/login">
              <Button size="sm">Login</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
