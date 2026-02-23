import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "./providers";
import GoogleMapsScript from "./components/Map/GoogleMapScript";
import { ConfigProvider } from "@/app/context/ConfigContext";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300","400","500","600","700","800"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rampes Gardex - ERP",
  description: "Système de gestion Rampes Gardex - Fabricant de rampes d'aluminium",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning >
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ConfigProvider>
          <Providers>{children}</Providers>
          <GoogleMapsScript />
        </ConfigProvider>
      </body>
    </html>
  );
}
