import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";

import { AddArticleDialog } from "@/components/add-article-form";
import { SearchBar } from "@/components/search-bar";
import { Plus, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignOutMenuItem } from "@/components/sign-out-menu-item";

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex items-center gap-4 p-4 h-16">
        <Link href="/" className="shrink-0 flex items-center">
          <Image
            src="/pagechime_logo_black.svg"
            alt="PageChime"
            width={103}
            height={32}
            className="h-8 w-auto dark:hidden"
            priority
          />
          <Image
            src="/pagechime_logo_white.svg"
            alt="PageChime"
            width={103}
            height={32}
            className="h-8 w-auto hidden dark:block"
            priority
          />
        </Link>
        <div className="flex-1 max-w-2xl mx-auto">
          <SearchBar />
        </div>
        <div className="flex items-center gap-4 shrink-0">
          {user ? (
            <>
              <AddArticleDialog>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Link
                </Button>
              </AddArticleDialog>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full h-8 w-8 bg-muted"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
                    {user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <SignOutMenuItem />
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link href="/login">
              <Button size="sm">Login</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
