import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "RaceGuard AI v1",
  description: "Race condition detector for Java and SQL workloads",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-gray-900 text-gray-100">{children}</body>
    </html>
  );
}


