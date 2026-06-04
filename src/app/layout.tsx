import type { Metadata, Viewport } from "next";
import { Roboto, Oswald } from "next/font/google";
import "@/styles/tokens.css";
import "@/styles/app.css";
import { FlagPolyfill } from "@/components/FlagPolyfill";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-roboto",
  display: "swap",
});

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-oswald",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Secret Squad",
  description: "Anonymes Zweier-Team Tippspiel zur FIFA WM 2026",
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={`${roboto.variable} ${oswald.variable}`}>
      <body>
        <FlagPolyfill />
        {children}
      </body>
    </html>
  );
}
