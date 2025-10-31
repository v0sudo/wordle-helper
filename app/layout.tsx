import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Script from "next/script";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: {
    default: "Wordle Helper - Solve Wordle Puzzles with Smart Word Filtering",
    template: "%s | Wordle Helper",
  },
  description: "Master Wordle with our intelligent helper tool! Enter your guesses, mark letter states, and get filtered word suggestions.",
  keywords: [
    "wordle",
    "wordle helper",
    "wordle solver",
    "word game",
    "5 letter words",
    "word puzzle",
    "wordle strategy",
    "wordle tips",
    "wordle assistant",
    "wordle cheat",
    "wordle tool",
    "daily wordle",
    "wordle game",
    "wordle solver tool",
    "wordle word finder",
  ],
  authors: [{ name: "Luke Orriss" }],
  creator: "Luke Orriss",
  publisher: "Luke Orriss",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://wordle.orriss.dev"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://wordle.orriss.dev",
    title: "Wordle Helper - Solve Wordle Puzzles with Smart Word Filtering",
    description: "Master Wordle with our intelligent helper tool! Enter your guesses, mark letter states, and get filtered word suggestions.",
    siteName: "Wordle Helper",
    images: [
      {
        url: "/favicon/og-image.png",
        width: 1200,
        height: 630,
        alt: "Wordle Helper - Solve Wordle Puzzles with Smart Word Filtering",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Wordle Helper - Solve Wordle Puzzles with Smart Word Filtering",
    description: "Master Wordle with our intelligent helper tool! Enter your guesses, mark letter states, and get filtered word suggestions.",
    images: ["/og-image.png"],
    creator: "@lukeorriss",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
    yahoo: "your-yahoo-verification-code",
  },
  category: "games",
  classification: "Word Game Helper Tool",
  referrer: "origin-when-cross-origin",

  icons: {
    icon: [
      { url: "/favicon/favicon.ico", sizes: "any" },
      { url: "/favicon/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [{ url: "/favicon/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [
      {
        rel: "mask-icon",
        url: "/favicon/safari-pinned-tab.svg",
        color: "#5bbad5",
      },
    ],
  },
  manifest: "/favicon/site.webmanifest",
  appleWebApp: {
    title: "Wordle Helper",
    statusBarStyle: "default",
    capable: true,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "application-name": "Wordle Helper",
    "msapplication-TileColor": "#ffffff",
    "msapplication-config": "/favicon/browserconfig.xml",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Script async strategy="afterInteractive" id="google-analytics" src="https://www.googletagmanager.com/gtag/js?id=G-H4SZY3FKB7" />
      <Script id="google-analytics2" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag() {
            dataLayer.push(arguments);
          }
          gtag("js", new Date());
          
          gtag("config", "G-H4SZY3FKB7");
        `}
      </Script>
      <link rel="icon" type="image/png" href="/favicon/favicon-96x96.png" sizes="96x96" />
      <link rel="icon" type="image/svg+xml" href="/favicon/favicon.svg" />
      <link rel="shortcut icon" href="/favicon/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
      <meta name="apple-mobile-web-app-title" content="ldo.dev" />
      <link rel="manifest" href="/favicon/site.webmanifest" />
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
