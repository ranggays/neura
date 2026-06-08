import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Indonesia Digital Rights Policy Graph",
  description: "A compact evidence-first workspace for tracing Indonesian digital policy relationships.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0&display=optional"
        />
      </head>
      <body className="h-full overflow-hidden" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
