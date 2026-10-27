import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export const metadata = {
  title: "DompetKu - Catat & Kelola Keuangan Pribadi",
  description: "Aplikasi modern pencatat dan pengelola keuangan harian pribadi yang rapi, minimalis, dan akurat.",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${jakarta.variable}`} suppressHydrationWarning>
      <body className="antialiased bg-[#f8fafc] text-slate-800 font-sans tracking-normal selection:bg-emerald-500/15 selection:text-emerald-700">
        {children}
      </body>
    </html>
  );
}
