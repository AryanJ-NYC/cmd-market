import type { ReactNode } from "react";
import "./globals.css";

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

type RootLayoutProps = {
  children: ReactNode;
};
