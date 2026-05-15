import Header from "@/components/header";
import { CollectionProvider } from "@/context/collection-context";
import { Sidebar } from "@/components/sidebar";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <CollectionProvider>
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen min-w-0">
          <Header />
          <main className="flex-1 pb-24">{children}</main>
        </div>
      </div>
    </CollectionProvider>
  );
}
