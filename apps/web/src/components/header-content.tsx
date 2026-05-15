"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
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

// ---------------------------------------------------------------------------
// Route → page title map
// ---------------------------------------------------------------------------

function getPageTitle(pathname: string): string | null {
  if (pathname === "/") return "Home";
  if (pathname === "/archive") return "Archive";
  if (pathname === "/newsletters") return "Newsletters";
  if (pathname === "/settings") return "Settings";
  if (pathname.startsWith("/collection/")) return "Collection";
  return null;
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

export function HeaderContent({ user }: { user: any }) {
  const { scrollDirection, scrollY } = useScrollDirection();
  const pathname = usePathname();
  const isSettingsPage = pathname === "/settings";
  const isHidden = scrollDirection === "down" && scrollY > 50;

  const pageTitle = getPageTitle(pathname);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300">
        <div className="flex items-center gap-4 px-4 h-14">

          {/* Mobile: hamburger + centered title */}
          <div className="flex items-center lg:hidden">
            <MobileNav />
          </div>

          {/* Mobile: centered page title or logo */}
          <div className="lg:hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            {pageTitle ? (
              <span className="font-semibold text-base">{pageTitle}</span>
            ) : (
              <Link href="/" className="flex items-center">
                <Image
                  src="/pagechime_logo_black.svg"
                  alt="PageChime"
                  width={103}
                  height={32}
                  className="h-7 w-auto dark:hidden"
                  priority
                />
                <Image
                  src="/pagechime_logo_white.svg"
                  alt="PageChime"
                  width={103}
                  height={32}
                  className="h-7 w-auto hidden dark:block"
                  priority
                />
              </Link>
            )}
          </div>

          {/* Desktop left: page title */}
          <div className="hidden lg:flex items-center min-w-0">
            {pageTitle && (
              <h1 className="text-lg font-semibold text-foreground truncate">
                {pageTitle}
              </h1>
            )}
          </div>

          {/* Desktop center: search bar (not on settings) */}
          <div
            className={cn(
              "hidden lg:flex flex-1 justify-center max-w-md mx-auto",
              isSettingsPage && "invisible"
            )}
          >
            <SearchBar />
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {user ? (
              <>
                {/* Add Link button — desktop only, not on settings */}
                {!isSettingsPage && (
                  <div className="hidden lg:block">
                    <AddArticleDialog>
                      <Button
                        size="sm"
                        className="h-8 gap-1.5 bg-[#FF6B4A] hover:bg-[#FF6B4A]/90 text-white"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Add Link</span>
                      </Button>
                    </AddArticleDialog>
                  </div>
                )}

                {/* Theme toggle — desktop */}
                <div className="hidden lg:block">
                  <ThemeToggle />
                </div>

                {/* User menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full h-8 w-8 bg-muted"
                    >
                      <User className="h-4 w-4" />
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

        {/* Mobile Search & Tags Row — Collapsible */}
        <div
          className={cn(
            "lg:hidden overflow-hidden transition-all duration-300 ease-in-out",
            isHidden || isSettingsPage
              ? "max-h-0 opacity-0 border-none"
              : "max-h-40 opacity-100 border-t border-border/40"
          )}
        >
          {!isSettingsPage && (
            <div className="px-4 py-3 space-y-3">
              <SearchBar />
              <TagFilterBar />
            </div>
          )}
        </div>
      </header>

      {/* Mobile FAB */}
      {user && !isSettingsPage && (
        <div className="lg:hidden fixed bottom-20 right-4 z-50">
          <AddArticleDialog>
            <Button
              size="icon"
              className="h-14 w-14 rounded-full shadow-lg bg-[#FF6B4A] text-white hover:bg-[#FF6B4A]/90"
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
