import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Quotefox — Tunnels de devis instantanés pour les métiers du service à domicile",
    template: "%s · Quotefox",
  },
  description:
    "Transformez les visiteurs de votre site en leads qualifiés et chiffrés grâce à un configurateur de devis à votre image — sans frais par lead, sans code.",
  openGraph: {
    title: "Quotefox — Tunnels de devis instantanés pour les métiers du service à domicile",
    description:
      "Transformez les visiteurs de votre site en leads qualifiés et chiffrés grâce à un configurateur de devis à votre image — sans frais par lead, sans code.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
