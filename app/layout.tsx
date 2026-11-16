import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

// Coupon codes, counts and prices are set in mono; it carries most of the
// theme. Latin only, so the self-hosted subset stays small.
//
// The Chinese text deliberately stays on system fonts: a self-hosted CJK
// webfont is megabytes, and PingFang TC / Microsoft JhengHei already look
// right on the platforms that matter here.
const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

// metadataBase makes the canonical, Open Graph and robots URLs absolute.
// page.tsx overrides title/description per view; these are the fallbacks
// (e.g. for the 404 page) and what link previews use.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s｜${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["必勝客", "Pizza Hut", "折價券", "優惠代碼", "優惠券", "披薩", "外送優惠"],
  // Long digit runs (coupon codes, prices) are not phone numbers.
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    locale: "zh_TW",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The inline script sets data-theme before React hydrates, so the server
    // markup and the live <html> attributes are expected to differ.
    <html
      lang="zh-Hant-TW"
      data-theme="dark"
      className={`${mono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
