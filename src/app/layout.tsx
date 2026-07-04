import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/app/context/AuthContext";
import Navbar from "@/app/components/Navbar";

export const metadata: Metadata = {
  title: "ReFound - The Tavern Market",
  description: "A cozy marketplace for secondhand treasures",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-tavern-tan/30 py-6 px-4 text-center">
            <div className="tavern-divider max-w-md mx-auto mb-4" />
            <p className="text-tavern-cream/60 text-sm font-serif">
              🍺 ReFound — The Tavern Market • Where Secondhand Finds Find New Homes
            </p>
            <p className="text-tavern-cream/40 text-xs mt-1">
              Every item has a story. Be part of its next chapter.
            </p>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
