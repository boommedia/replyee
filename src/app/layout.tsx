import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Replyee — AI Chatbot for Your Website",
    template: "%s | Replyee",
  },
  description:
    "Train an AI on your content. Embed it on your website. Answer customer questions 24/7 — without lifting a finger.",
  keywords: ["AI chatbot", "website chatbot", "customer support AI", "Chatbase alternative", "embeddable chatbot"],
  metadataBase: new URL("https://replyee.online"),
  alternates: { canonical: "https://replyee.online" },
  icons: {
    icon: "/replyee-icon.png",
    apple: "/replyee-icon.png",
    shortcut: "/replyee-icon.png",
  },
  openGraph: {
    title: "Replyee — AI Chatbot for Your Website",
    description: "Train an AI on your content. Embed it on your website. Answer customer questions 24/7.",
    url: "https://replyee.online",
    siteName: "Replyee",
    images: [{ url: "https://replyee.online/og-image.png", width: 1200, height: 630, alt: "Replyee — AI Chatbot" }],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Replyee — AI Chatbot for Your Website",
    description: "Train an AI on your content. Embed it on your website. Answer customer questions 24/7.",
    images: ["https://replyee.online/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Replyee",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              url: "https://replyee.online",
              description: "AI chatbot platform — train on your content, embed on your website.",
              offers: { "@type": "AggregateOffer", priceCurrency: "USD" },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Boom Media",
              url: "https://replyee.online",
              contactPoint: { "@type": "ContactPoint", email: "eric@boommedia.us", contactType: "customer support" },
            }),
          }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
