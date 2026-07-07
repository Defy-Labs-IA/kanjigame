import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kanji Memory Game",
  description: "Aprender, ouvir, observar, escrever e lembrar.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
