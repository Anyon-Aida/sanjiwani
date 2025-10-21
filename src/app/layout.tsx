// src/app/layout.tsx
import "./globals.css";
import { Playfair_Display, Manrope } from "next/font/google";

const heading = Playfair_Display({ subsets: ["latin"], weight: ["600","700"], variable: "--font-heading" });
const body = Manrope({ subsets: ["latin"], weight: ["400","500","600","700"], variable: "--font-body" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu" className={`${heading.variable} ${body.variable}`}>
      <body>        
          {children}
      </body>
    </html>
  );
}
