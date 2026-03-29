// app/layout.js - VERSION CORRIGÉE
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "../lib/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Cabinet Dr Hammach Yassine - Gestion médicale",
  description: "Application de gestion pour le cabinet médical du Dr Hammach Yassine",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
