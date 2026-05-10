import "./globals.css";

export const metadata = {
  title: "DompetKu - Catat Keuangan Praktis",
  description: "Aplikasi pencatat keuangan harian personal",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="antialiased bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}