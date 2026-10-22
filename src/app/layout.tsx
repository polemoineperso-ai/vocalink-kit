import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vocalink",
  description: "Dites une idée, elle se transforme en action.",
  // Ouverture plein écran une fois ajoutée à l'écran d'accueil iOS (voir manifest.ts).
  appleWebApp: { capable: true, title: "Vocalink", statusBarStyle: "default" },
};

// Barre d'état du téléphone assortie au fond de l'app (clair / sombre).
// viewportFit "cover" : l'app occupe tout l'écran (encoche comprise), les
// zones de sécurité sont gérées en CSS (safe-top, tab-bar).
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f3f0" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0e0d" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
