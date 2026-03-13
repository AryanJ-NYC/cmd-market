import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "CMD Market",
  description:
    "List physical goods through OpenClaw and let buyers discover cleaner, structured inventory on the web or through their own agents."
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-neutral-950 text-stone-100 antialiased`}>
        {children}
      </body>
    </html>
  );
}

type RootLayoutProps = {
  children: ReactNode;
};
