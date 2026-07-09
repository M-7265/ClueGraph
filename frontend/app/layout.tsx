import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClueGraph — RAG Mystery Solver",
  description:
    "An interactive demo contrasting Naive RAG vs Multi-Hop Agentic RAG on a detective mystery. Watch the AI agent chain clues across documents to identify the culprit.",
  keywords: ["RAG", "Agentic AI", "LLM", "ChromaDB", "Ollama", "detective", "demo"],
  openGraph: {
    title: "ClueGraph — RAG Mystery Solver",
    description: "Naive RAG fails. Agentic RAG solves the mystery. Watch it happen live.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Inter from Google Fonts — loads only if network allows; system fallback otherwise */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-slate-900 text-slate-100 overflow-hidden">
        {children}
      </body>
    </html>
  );
}
