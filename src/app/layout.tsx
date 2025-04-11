import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/custom/theme_provider";
import SessionAuthProvider from "@/context/SessionAuthProvider";

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          themes={["dark", "custom", "light"]}
          attribute="class"
          enableSystem
          disableTransitionOnChange
        >
          <SessionAuthProvider>{children}</SessionAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
