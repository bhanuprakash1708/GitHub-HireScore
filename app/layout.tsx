import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GitHub Portfolio Analyzer & Enhancer",
  description:
    "Analyze GitHub profiles and generate recruiter-ready portfolio insights."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50">
        <main>{children}</main>
      </body>
    </html>
  );
}

