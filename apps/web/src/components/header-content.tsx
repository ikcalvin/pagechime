"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { AddArticleDialog } from "@/components/add-article-form";
import { SearchBar } from "@/components/search-bar";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Plus,
  User,
  Settings,
  Shield,
  FileText,
  Sun,
  Moon,
  Palette,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { useReaderSettings, ReaderTheme } from "@/context/use-reader-settings";
import { SignOutMenuItem } from "@/components/sign-out-menu-item";
import { MobileNav } from "@/components/mobile-nav";
import { TagFilterBar } from "./tag-filter-bar";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import { cn } from "@/lib/utils";

export function HeaderContent({ user }: { user: any }) {
  const { scrollDirection, scrollY } = useScrollDirection();
  const pathname = usePathname();
  const isSettingsPage = pathname === "/settings";
  const isHidden = scrollDirection === "down" && scrollY > 50;

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300">
        {/* Main Row (Desktop: Logo, Search, User | Mobile: Logo, User) */}
        <div className="container mx-auto flex items-center gap-4 p-4 h-16 relative z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center shrink-0 lg:w-56">
            <MobileNav />
            {/* Mobile: Logo or Page Title */}
            <div className="md:hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              {isSettingsPage ? (
                <span className="font-semibold text-lg">Settings</span>
              ) : (
                <Link href="/" className="flex items-center">
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
              )}
            </div>

            {/* Desktop: Always Logo */}
            <Link href="/" className="hidden md:flex items-center">
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
          </div>

          {/* Desktop Center: Search or Page Title */}
          <div
            className={cn(
              "hidden md:flex flex-1 px-4 items-center",
              isSettingsPage ? "justify-start" : "justify-center mx-auto"
            )}
          >
            {isSettingsPage ? (
              <span className="font-semibold text-lg text-foreground/80">
                Settings
              </span>
            ) : (
              <SearchBar />
            )}
          </div>

          <div className="absolute right-4 md:static flex items-center gap-4 shrink-0 ml-auto md:ml-0">
            {user ? (
              <>
                <div className="hidden md:block">
                  <ThemeToggle />
                </div>
                {!isSettingsPage && (
                  <div className="hidden md:block">
                    <AddArticleDialog>
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Add Link</span>
                        <span className="sm:hidden">Add</span>
                      </Button>
                    </AddArticleDialog>
                  </div>
                )}
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
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
                      {user.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem asChild>
                        <Link href="/settings">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Settings</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/privacy">
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Privacy</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/terms">
                          <FileText className="mr-2 h-4 w-4" />
                          <span>Terms</span>
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <UserThemeSubMenu />
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

        {/* Mobile Search & Tags Row - Collapsible */}
        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300 ease-in-out bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60",
            isHidden || isSettingsPage
              ? "max-h-0 opacity-0 border-none"
              : "max-h-40 opacity-100 border-t"
          )}
        >
          {!isSettingsPage && (
            <div className="container mx-auto px-4 py-3 space-y-3">
              <SearchBar />
              <TagFilterBar />
            </div>
          )}
        </div>
      </header>

      {/* Mobile FAB */}
      {user && !isSettingsPage && (
        <div className="md:hidden fixed bottom-20 right-4 z-50">
          <AddArticleDialog>
            <Button
              size="icon"
              className="h-16 w-16 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-6 w-6" />
              <span className="sr-only">Add Article</span>
            </Button>
          </AddArticleDialog>
        </div>
      )}
    </>
  );
}

function UserThemeSubMenu() {
  const { settings, updateSettings, mounted } = useReaderSettings();

  if (!mounted) return null;

  const setTheme = (theme: ReaderTheme) => {
    updateSettings({ ...settings, theme });
  };

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Palette className="mr-2 h-4 w-4" />
        <span>Theme</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("sepia")}>
          <div className="mr-2 h-4 w-4 rounded-full bg-[#f4ecd8] border border-stone-300" />
          <span>Sepia</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("black")}>
          <div className="mr-2 h-4 w-4 rounded-full bg-black border border-stone-700" />
          <span>Black</span>
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
