import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import { GlobalTools } from "@/components/GlobalTools";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const siteUrl = "https://nzm-wiki.pages.dev";

export const metadata: Metadata = {
  title: {
    default: "逆战未来 维基",
    template: "%s | 逆战未来 维基",
  },
  description:
    "逆战未来 武器、陷阱道具、敌人，以及僵尸猎场、塔防等模式详细数据资料",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "逆战未来 维基",
    title: "逆战未来 维基",
    description: "逆战未来游戏资料站 — 武器、特性、陷阱、敌人等全面攻略",
  },
  icons: {
    icon: `${basePath}/icon.png`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "逆战未来 维基",
              alternateName: ["逆战未来维基", "NZM Wiki"],
              url: siteUrl,
            }),
          }}
        />
        <script
          defer
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "179c48561851407d96f802690e2f1514"}'
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <GlobalTools />
      </body>
    </html>
  );
}
