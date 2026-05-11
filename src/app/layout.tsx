import type { Metadata } from "next";
import { Inter, Kanit, Prompt, Sarabun, Mitr } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const kanit = Kanit({ subsets: ["thai", "latin"], weight: ["200", "300", "400", "500", "600", "700"], variable: '--font-kanit' });
const prompt = Prompt({ subsets: ["thai", "latin"], weight: ["200", "300", "400", "500", "600", "700"], variable: '--font-prompt' });
const sarabun = Sarabun({ subsets: ["thai", "latin"], weight: ["200", "300", "400", "500", "600", "700"], variable: '--font-sarabun' });
const mitr = Mitr({ subsets: ["thai", "latin"], weight: ["200", "300", "400", "500", "600", "700"], variable: '--font-mitr' });

export const metadata: Metadata = {
  title: "HTML Showcase Portal",
  description: "A fast, secure, and fully customizable HTML CMS and Showcase Portal.",
  keywords: ["HTML", "CMS", "Showcase", "Portal", "Google Apps Script", "Web App"],
  openGraph: {
    title: "HTML Showcase Portal",
    description: "A fast, secure, and fully customizable HTML CMS and Showcase Portal.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HTML Showcase Portal",
    description: "A fast, secure, and fully customizable HTML CMS and Showcase Portal.",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className={`${inter.variable} ${kanit.variable} ${prompt.variable} ${sarabun.variable} ${mitr.variable} ${inter.className} antialiased min-h-screen bg-slate-950 text-slate-50 selection:bg-yellow-400 selection:text-slate-950`}>
        {/* Subtle global background mesh/glow */}
        <div className="fixed inset-0 z-[-1] h-full w-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]"></div>
        {children}
        <Toaster 
          theme="dark" 
          position="bottom-right" 
          toastOptions={{
            style: { background: '#0f172a', border: '1px solid #1e293b', color: '#f8fafc' },
            className: 'font-sans'
          }}
        />
      </body>
    </html>
  );
}
