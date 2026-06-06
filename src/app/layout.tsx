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
  metadataBase: new URL("https://tipp.dirkteu.de"),
  title: "Bülser Alm — Tippspiel",
  description: "Tippspiel zur FIFA WM 2026 mit geheimer Tipp-Nachbarschaft.",
  openGraph: {
    title: "Bülser Alm — Tippspiel",
    description:
      "Tippe alle Spiele der FIFA WM 2026 mit geheimer Nachbarschaft. Wer ist deine Tipp-Nachbar:in?",
    url: "https://tipp.dirkteu.de",
    siteName: "Bülser Alm",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 519,
        alt: "Bülser Alm Logo",
      },
    ],
    locale: "de_DE",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Bülser Alm — Tippspiel",
    description: "Tippspiel zur FIFA WM 2026 mit geheimer Tipp-Nachbarschaft.",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
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
