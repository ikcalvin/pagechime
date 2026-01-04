import Header from "@/components/header";
import { CollectionProvider } from "@/context/collection-context";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <CollectionProvider>
      <Header />
      <main className="container mx-auto pb-24">{children}</main>
    </CollectionProvider>
  );
}
